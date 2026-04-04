import { Document, Types, PopulatedDoc } from "mongoose";
import { JwtPayload } from "jsonwebtoken";

// ----------------------------------------------------
// Integration Connection Types
// ----------------------------------------------------

export interface IGoogleConnection extends Document {
    userId: Types.ObjectId;
    google_id: string;
    email: string;
    access_token: string;
    refresh_token: string;
    token_type: string;
    scope: string;
    access_token_expires_in: number;
    id_token: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface INotionConnection extends Document {
    userId: Types.ObjectId;
    notion_user_id: string;
    workspace_id: string;
    workspace_name?: string;
    bot_id?: string;
    access_token: string;
    refresh_token: string;
    token_type: string;
    scope: string;
    name?: string;
    email?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface IDiscordConnection extends Document {
    userId: Types.ObjectId;
    discord_user_id: string;
    username: string;
    global_name?: string;
    email?: string;
    token_type: string;
    access_token: string;
    refresh_token: string;
    scope: string;
    access_token_expires_in: number;
    guild_id?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface ITelegramConnection extends Document {
    userId: Types.ObjectId;
    telegram_id: string;
    username?: string;
    first_name: string;
    auth_date: number;
    bot_token?: string;
    chat_id?: string;
    scope: string;
    createdAt: Date;
    updatedAt: Date;
}

// ----------------------------------------------------
// Main User Type
// ----------------------------------------------------

export interface IUser extends Document {
    email: string;
    name: string;
    picture?: string;

    // These arrays can either hold just the raw ObjectIds, 
    // or the full Document if you use .populate()
    google_connections: PopulatedDoc<IGoogleConnection, Types.ObjectId>[];
    notion_connections: PopulatedDoc<INotionConnection, Types.ObjectId>[];
    discord_connections: PopulatedDoc<IDiscordConnection, Types.ObjectId>[];
    telegram_connections: PopulatedDoc<ITelegramConnection, Types.ObjectId>[];

    createdAt: Date;
    updatedAt: Date;

    generateToken: () => string;
}

// ----------------------------------------------------
// JWT Payload Type
// ----------------------------------------------------

// Updated to match the new payload inside userSchema.methods.generateToken
export interface CustomJwtPayload extends JwtPayload {
    userId: string;
    email: string;
}


// ----------------------------------------------------
// Express Request Extended Type
// ----------------------------------------------------
export interface Req {
    db_doc_id: Types.ObjectId;
}


// ----------------------------------------------------
// Connections Type
// ----------------------------------------------------
export type Provider = 'google' | 'notion' | 'discord' | 'telegram';
