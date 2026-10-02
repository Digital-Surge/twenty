import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { type Request, type Response } from 'express';
import { isDefined } from 'twenty-shared/utils';

import {
  MCP_PUBLIC_API_KEY_REFUSED_MESSAGE,
  MCP_PUBLIC_REQUEST_HEADER,
} from 'src/engine/api/mcp/constants/mcp-public-request.const';
import { isPublicMcpRequest } from 'src/engine/api/mcp/utils/is-public-mcp-request.util';
import { ALL_OAUTH_SCOPES } from 'src/engine/core-modules/application/application-oauth/constants/oauth-scopes';
import { JwtAuthGuard } from 'src/engine/guards/jwt-auth.guard';

// RFC 9728 / MCP authorization spec: when the MCP endpoint returns 401,
// include a WWW-Authenticate header pointing to the path-aware Protected
// Resource Metadata URL so the client discovers the correct resource
// identifier. The `scope` parameter tells the client which scopes to request.
//
// Tide fork: a request that came through Cloudflare (see MCP_PUBLIC_REQUEST_HEADER) must authenticate as a person
// with OAuth; an API key is refused there with the same challenge, so the client falls back to the OAuth flow.
@Injectable()
export class McpAuthGuard implements CanActivate {
  constructor(private readonly jwtAuthGuard: JwtAuthGuard) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isAuthenticated = await this.jwtAuthGuard.canActivate(context);
    const request = context.switchToHttp().getRequest<Request>();

    if (!isAuthenticated) {
      this.challenge(context, request);

      throw new UnauthorizedException();
    }

    const isApiKeyRequest = isDefined(
      (request as Request & { apiKey?: unknown }).apiKey,
    );

    if (
      isApiKeyRequest &&
      isPublicMcpRequest(request.headers[MCP_PUBLIC_REQUEST_HEADER])
    ) {
      this.challenge(context, request);

      throw new UnauthorizedException(MCP_PUBLIC_API_KEY_REFUSED_MESSAGE);
    }

    return true;
  }

  private challenge(context: ExecutionContext, request: Request) {
    const baseUrl = `${request.protocol}://${request.get('host')}`;
    const resourceMetadataUrl = `${baseUrl}/.well-known/oauth-protected-resource/mcp`;
    const scope = ALL_OAUTH_SCOPES.join(' ');

    // Set the header on the response before throwing, because exception
    // filters may not preserve custom headers from the exception payload.
    const response = context.switchToHttp().getResponse<Response>();

    response.setHeader(
      'WWW-Authenticate',
      `Bearer resource_metadata="${resourceMetadataUrl}", scope="${scope}"`,
    );
  }
}
