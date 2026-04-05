export const FRONTEND_URLS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://[::1]:5173",
];

export const SERVICE_OPERATIONS = {
    discord: ["get_guilds", "get_channels", "send_message"],
    gemini: ["generate_text"],
    core: ["manual_input"],
    gmail: ["send_message", "get_thread", "list_threads"],
    google_docs: ["create_document", "append_document", "get_document"],
    google_drive: ["list_files"],
    google_forms: ["list_responses", "get_form_details", "create_form", "add_question"],
    google_meet: ["create_space", "get_space", "list_recordings", "list_transcripts", "list_transcript_entries"],
    google_sheets: ["append_row", "get_rows", "get_info"],
    notion: ["search", "create_page", "create_database_item"]
} as const;

export const GOOGLE_SERVICES = [
    "gmail", 
    "google_docs", 
    "google_drive", 
    "google_forms", 
    "google_meet", 
    "google_sheets"
];