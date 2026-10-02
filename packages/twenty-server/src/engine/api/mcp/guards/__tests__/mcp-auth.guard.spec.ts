import { type ExecutionContext, UnauthorizedException } from '@nestjs/common';

import { McpAuthGuard } from 'src/engine/api/mcp/guards/mcp-auth.guard';
import { JwtAuthGuard } from 'src/engine/guards/jwt-auth.guard';

describe('McpAuthGuard', () => {
  let guard: McpAuthGuard;
  let jwtAuthGuard: jest.Mocked<JwtAuthGuard>;

  const mockSetHeader = jest.fn();
  const buildContext = (
    host = 'crm.example.com',
    {
      headers = {},
      apiKey,
    }: { headers?: Record<string, string>; apiKey?: { id: string } } = {},
  ): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getResponse: () => ({ setHeader: mockSetHeader }),
        getRequest: () => ({
          protocol: 'https',
          headers,
          apiKey,
          get: (name: string) => (name === 'host' ? host : undefined),
        }),
      }),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    jwtAuthGuard = {
      canActivate: jest.fn(),
    } as unknown as jest.Mocked<JwtAuthGuard>;

    guard = new McpAuthGuard(jwtAuthGuard);
    mockSetHeader.mockClear();
  });

  it('should return true when JwtAuthGuard passes', async () => {
    jwtAuthGuard.canActivate.mockResolvedValue(true);

    const result = await guard.canActivate(buildContext());

    expect(result).toBe(true);
    expect(mockSetHeader).not.toHaveBeenCalled();
  });

  it('should set WWW-Authenticate using the request host and throw when auth fails', async () => {
    jwtAuthGuard.canActivate.mockResolvedValue(false);

    await expect(
      guard.canActivate(buildContext('acme.twenty.com')),
    ).rejects.toThrow(UnauthorizedException);

    expect(mockSetHeader).toHaveBeenCalledWith(
      'WWW-Authenticate',
      'Bearer resource_metadata="https://acme.twenty.com/.well-known/oauth-protected-resource/mcp", scope="api profile"',
    );
  });

  describe('public requests (Tide fork)', () => {
    const publicHeaders = { 'cf-connecting-ip': '160.79.104.10' };

    it('refuses an API key on a request that came through Cloudflare, with the OAuth challenge', async () => {
      jwtAuthGuard.canActivate.mockResolvedValue(true);

      await expect(
        guard.canActivate(
          buildContext('tide.example.com', {
            headers: publicHeaders,
            apiKey: { id: 'api-key-id' },
          }),
        ),
      ).rejects.toThrow(UnauthorizedException);

      expect(mockSetHeader).toHaveBeenCalledWith(
        'WWW-Authenticate',
        'Bearer resource_metadata="https://tide.example.com/.well-known/oauth-protected-resource/mcp", scope="api profile"',
      );
    });

    it('accepts an OAuth (user) token on a public request', async () => {
      jwtAuthGuard.canActivate.mockResolvedValue(true);

      await expect(
        guard.canActivate(
          buildContext('tide.example.com', { headers: publicHeaders }),
        ),
      ).resolves.toBe(true);
      expect(mockSetHeader).not.toHaveBeenCalled();
    });

    it('accepts an API key on a request without the Cloudflare header (the operator tunnel)', async () => {
      jwtAuthGuard.canActivate.mockResolvedValue(true);

      await expect(
        guard.canActivate(
          buildContext('127.0.0.1:3000', { apiKey: { id: 'api-key-id' } }),
        ),
      ).resolves.toBe(true);
    });

    it('refuses an API key when only cf-ray arrives (visitor IP headers removed)', async () => {
      jwtAuthGuard.canActivate.mockResolvedValue(true);

      await expect(
        guard.canActivate(
          buildContext('tide.example.com', {
            headers: { 'cf-ray': '8c0a1b2c3d4e5f60-SYD' },
            apiKey: { id: 'api-key-id' },
          }),
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('treats an empty header as not public', async () => {
      jwtAuthGuard.canActivate.mockResolvedValue(true);

      await expect(
        guard.canActivate(
          buildContext('127.0.0.1:3000', {
            headers: { 'cf-connecting-ip': '' },
            apiKey: { id: 'api-key-id' },
          }),
        ),
      ).resolves.toBe(true);
    });
  });
});
