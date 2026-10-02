import { MCP_EXCLUDED_TOOL_NAMES } from 'src/engine/api/mcp/constants/mcp-excluded-tool-names.const';
import { MCP_PUBLIC_EXCLUDED_TOOL_CATEGORIES } from 'src/engine/api/mcp/constants/mcp-public-request.const';
import { buildMcpExcludedToolNames } from 'src/engine/api/mcp/utils/build-mcp-excluded-tool-names.util';
import { isPublicMcpRequest } from 'src/engine/api/mcp/utils/is-public-mcp-request.util';

describe('buildMcpExcludedToolNames (Tide fork)', () => {
  it('keeps upstream exclusions only for a tunnel request', () => {
    const excluded = buildMcpExcludedToolNames({
      isPublicRequest: false,
      publicExcludedCategoryToolNames: ['create_workflow'],
    });

    expect(excluded).toBe(MCP_EXCLUDED_TOOL_NAMES);
    expect(excluded.has('send_email')).toBe(false);
    expect(excluded.has('create_workflow')).toBe(false);
  });

  it('adds the mail tools and every tool of the excluded categories for a public request', () => {
    const excluded = buildMcpExcludedToolNames({
      isPublicRequest: true,
      publicExcludedCategoryToolNames: ['create_workflow', 'create_webhook'],
    });

    for (const name of MCP_EXCLUDED_TOOL_NAMES) {
      expect(excluded.has(name)).toBe(true);
    }
    for (const name of [
      'send_email',
      'draft_email',
      'save_campaign',
      'create_workflow',
      'create_webhook',
    ]) {
      expect(excluded.has(name)).toBe(true);
    }
    expect(excluded.has('app_website_draft_article')).toBe(false);
  });

  it('never excludes the apps’ own tools (LOGIC_FUNCTION) on the public endpoint', () => {
    expect(MCP_PUBLIC_EXCLUDED_TOOL_CATEGORIES).not.toContain('LOGIC_FUNCTION');
  });
});

describe('isPublicMcpRequest (Tide fork)', () => {
  it.each([
    ['160.79.104.10', true],
    [['160.79.104.10'], true],
    ['', false],
    [undefined, false],
    [[], false],
  ])('%p → %p', (value, expected) => {
    expect(isPublicMcpRequest(value as string | string[] | undefined)).toBe(
      expected,
    );
  });
});
