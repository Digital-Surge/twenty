import {
  isPublicMcpRequest,
  publicRedirectUriProblem,
} from 'src/engine/api/mcp/utils/is-public-mcp-request.util';

describe('isPublicMcpRequest (Tide fork)', () => {
  it.each([
    [{ 'cf-connecting-ip': '160.79.104.10' }, true],
    [{ 'cf-connecting-ip': ['160.79.104.10'] }, true],
    // "Remove visitor IP headers" drops cf-connecting-ip, not cf-ray: still public.
    [{ 'cf-ray': '8c0a1b2c3d4e5f60-SYD' }, true],
    [{ 'cdn-loop': 'cloudflare; loops=1' }, true],
    [{ 'cdn-loop': 'some-other-cdn' }, false],
    [{ 'cf-connecting-ip': '' }, false],
    [{ 'cf-connecting-ip': [] }, false],
    [{ host: '127.0.0.1:3000' }, false],
    [undefined, false],
  ])('%p → %p', (headers, expected) => {
    expect(isPublicMcpRequest(headers as never)).toBe(expected);
  });
});

describe('publicRedirectUriProblem (Tide fork)', () => {
  it('allows Claude’s callbacks and loopback ones', () => {
    expect(
      publicRedirectUriProblem([
        'https://claude.ai/api/mcp/auth_callback',
        'https://claude.com/api/mcp/auth_callback',
        'http://localhost:53682/callback',
        'http://127.0.0.1:8080/callback',
      ]),
    ).toBeNull();
  });

  it('refuses any other callback (consent phishing), even next to an allowed one', () => {
    expect(
      publicRedirectUriProblem([
        'https://claude.ai/api/mcp/auth_callback',
        'https://evil.example/cb',
      ]),
    ).toContain('https://evil.example/cb');
    expect(
      publicRedirectUriProblem(['https://claude.ai.evil.example/cb']),
    ).not.toBeNull();
    expect(
      publicRedirectUriProblem(['http://localhost.evil.example/cb']),
    ).not.toBeNull();
  });
});
