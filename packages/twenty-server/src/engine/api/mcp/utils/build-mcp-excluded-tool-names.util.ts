import { MCP_EXCLUDED_TOOL_NAMES } from 'src/engine/api/mcp/constants/mcp-excluded-tool-names.const';
import { MCP_PUBLIC_EXCLUDED_TOOL_NAMES } from 'src/engine/api/mcp/constants/mcp-public-request.const';

// The names an MCP caller may not list, learn or execute. A public request also loses the fixed public names and
// every tool in the public-excluded categories (resolved per request, so a newly installed tool in those categories
// is covered too).
export const buildMcpExcludedToolNames = ({
  isPublicRequest,
  publicExcludedCategoryToolNames,
}: {
  isPublicRequest: boolean;
  publicExcludedCategoryToolNames: string[];
}): Set<string> => {
  if (!isPublicRequest) {
    return MCP_EXCLUDED_TOOL_NAMES;
  }

  return new Set([
    ...MCP_EXCLUDED_TOOL_NAMES,
    ...MCP_PUBLIC_EXCLUDED_TOOL_NAMES,
    ...publicExcludedCategoryToolNames,
  ]);
};
