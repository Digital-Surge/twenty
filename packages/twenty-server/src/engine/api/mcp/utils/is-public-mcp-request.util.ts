import { isNonEmptyString } from '@sniptt/guards';

import {
  MCP_PUBLIC_ALLOWED_REDIRECT_URI_PREFIXES,
  MCP_PUBLIC_CDN_LOOP_HEADER,
  MCP_PUBLIC_REQUEST_HEADERS,
} from 'src/engine/api/mcp/constants/mcp-public-request.const';

type HeaderValue = string | string[] | undefined;
type Headers = Record<string, HeaderValue> | undefined;

const values = (value: HeaderValue): string[] =>
  (Array.isArray(value) ? value : [value]).filter(isNonEmptyString);

// Did this request come through Cloudflare (Tide fork)? Express lower-cases header names.
export const isPublicMcpRequest = (headers: Headers): boolean => {
  if (!headers) {
    return false;
  }

  if (
    MCP_PUBLIC_REQUEST_HEADERS.some((name) => values(headers[name]).length > 0)
  ) {
    return true;
  }

  return values(headers[MCP_PUBLIC_CDN_LOOP_HEADER]).some((v) =>
    v.toLowerCase().includes('cloudflare'),
  );
};

// The reason a public registration's redirect URIs are refused, or null when every one is allowed.
export const publicRedirectUriProblem = (uris: string[]): string | null => {
  const refused = uris.filter(
    (uri) =>
      !MCP_PUBLIC_ALLOWED_REDIRECT_URI_PREFIXES.some((prefix) =>
        uri.toLowerCase().startsWith(prefix),
      ),
  );

  return refused.length === 0
    ? null
    : `Through the public endpoint only Claude's callbacks (claude.ai, claude.com) or a loopback callback may be registered; refused: ${refused.slice(0, 3).join(', ')}`;
};
