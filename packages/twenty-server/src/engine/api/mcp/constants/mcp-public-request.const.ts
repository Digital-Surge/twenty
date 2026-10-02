import { ToolCategory } from 'twenty-shared/ai';

// Tide fork: Twenty is reached two ways. Operators and box services use an SSH port-forward to the server, so their
// requests arrive without Cloudflare headers. Everyone else, including claude.ai's MCP connector (Anthropic's
// servers), comes through the Cloudflare tunnel, which sets these headers. ANY of them makes a request "public", so
// the guard does not depend on one setting (e.g. "Remove visitor IP headers" drops cf-connecting-ip, not cf-ray).
// A forged header only narrows what the sender may do.
export const MCP_PUBLIC_REQUEST_HEADERS = [
  'cf-connecting-ip',
  'cf-ray',
] as const;
// Cloudflare's loop-detection header (RFC 8586); its value names Cloudflare.
export const MCP_PUBLIC_CDN_LOOP_HEADER = 'cdn-loop';

// Through the public endpoint, OAuth clients may register only Claude's own callbacks (claude.ai / claude.com) or a
// loopback one (Claude Code on a workstation): an arbitrary https callback would let anyone phish a consent with a
// client name of their choosing.
export const MCP_PUBLIC_ALLOWED_REDIRECT_URI_PREFIXES = [
  'https://claude.ai/',
  'https://claude.com/',
  'http://localhost:',
  'http://localhost/',
  'http://127.0.0.1:',
  'http://127.0.0.1/',
] as const;

// Public requests act as a signed-in person through OAuth, never through an API key: a leaked or service key must not
// work from the internet just because /mcp is reachable there.
export const MCP_PUBLIC_API_KEY_REFUSED_MESSAGE =
  'API keys are not accepted on the public MCP endpoint. Connect with OAuth (sign in as yourself).';

// Tools a public caller never gets, whatever their role: sending mail from a connected mailbox (send_email, and
// create_calendar_event, whose invitations are emails with any text to any attendees, sent through the mailbox's
// provider) and Twenty's own email campaigns bypass Tide's send guards (Tide sends marketing email only through its
// own apps).
export const MCP_PUBLIC_EXCLUDED_TOOL_NAMES = new Set([
  'send_email',
  'draft_email',
  'save_campaign',
  'create_calendar_event',
]);

// Whole categories a public caller never gets: workflows (a workflow can carry a Send Email step), webhooks, roles and
// the data model are operator work. Not LOGIC_FUNCTION: that category is the installed apps' own AI tools
// (app_<name>), which are the point of exposing /mcp.
export const MCP_PUBLIC_EXCLUDED_TOOL_CATEGORIES: ToolCategory[] = [
  ToolCategory.WORKFLOW,
  ToolCategory.WEBHOOK,
  ToolCategory.ROLE,
  ToolCategory.METADATA,
];
