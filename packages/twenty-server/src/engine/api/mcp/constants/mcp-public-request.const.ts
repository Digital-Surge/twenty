import { ToolCategory } from 'twenty-shared/ai';

// Tide fork: Twenty is reached two ways. Operators and box services use an SSH port-forward to the server, so their
// requests arrive without Cloudflare headers. Everyone else, including claude.ai's MCP connector (Anthropic's
// servers), comes through the Cloudflare tunnel, which always sets this header and overwrites a client-supplied one.
// Its presence is what makes a request "public". A forged header only narrows what the sender may do.
export const MCP_PUBLIC_REQUEST_HEADER = 'cf-connecting-ip';

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
