// ============================================================================
// 1. CONNECTION TYPES (Safe Mode - Stripped of Tokens)
// ============================================================================

import type { WorkflowSummary } from "./workflowType";

export interface GoogleConnection {
    _id: string;
    userId: string;
    email: string;
    scope: string;
    createdAt: string;
    updatedAt: string;
    __v?: number;
}

export interface NotionConnection {
    _id: string;
    userId: string;
    workspace_id: string;
    workspace_name?: string;
    scope: string;
    name?: string;
    email?: string;
    createdAt: string;
    updatedAt: string;
    __v?: number;
}

export interface DiscordConnection {
    _id: string;
    userId: string;
    username: string;
    global_name?: string;
    email?: string;
    scope: string;
    guild_id: string;
    guild_name: string;
    guild_icon?: string;
    createdAt: string;
    updatedAt: string;
    __v?: number;
}

export interface TelegramConnection {
    _id: string;
    userId: string;
    username?: string;
    first_name: string;
    scope: string;
    createdAt: string;
    updatedAt: string;
    __v?: number;
}

// ============================================================================
// 3. MAIN USER PROFILE TYPE
// ============================================================================


export interface UserProfile {
    _id: string;
    email: string;
    name: string;
    picture?: string;

    google_connections: GoogleConnection[];
    notion_connections: NotionConnection[];
    discord_connections: DiscordConnection[];
    telegram_connections?: TelegramConnection[];

    workflow_connections: WorkflowSummary[];

    createdAt: string;
    updatedAt: string;
    __v?: number;
}


export interface ServiceMenuItem {
    service: string;
    label: string;
    operations: string[];
}

export interface ServiceMenuCategory {
    category: string;
    services: ServiceMenuItem[];
}


