// Tide fork: send_email (a connected mailbox) and save_campaign (Twenty's own email campaigns) bypass Tide's send
// guards; Tide's marketing email goes only through its own apps. People still compose one-to-one email in the UI.
export const AI_CHAT_EXCLUDED_TOOL_NAMES = new Set([
  'create_file_upload',
  'complete_file_upload',
  'send_email',
  'save_campaign',
]);
