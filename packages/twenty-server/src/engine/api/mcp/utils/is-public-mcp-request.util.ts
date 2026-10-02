import { isNonEmptyString } from '@sniptt/guards';

import { MCP_PUBLIC_REQUEST_HEADER } from 'src/engine/api/mcp/constants/mcp-public-request.const';

export const isPublicMcpRequest = (
  headerValue: string | string[] | undefined,
): boolean =>
  Array.isArray(headerValue)
    ? headerValue.some(isNonEmptyString)
    : isNonEmptyString(headerValue);
