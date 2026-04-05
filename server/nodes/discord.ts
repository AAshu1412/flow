// nodes/discord.ts
import { NodeDefinition } from "../types/node-type";
// --- Types & Interfaces ---
// export interface NodeInput {
//     key: string;
//     label: string;
//     type: 'string' | 'number' | 'boolean';
//     mandatory: boolean;
//     description?: string;
// }

// export interface NodeUI {
//     type: string;
//     label: string;
//     description: string;
//     icon: string;
// }

// export interface NodeDefinition {
//     service: string;
//     operation: string;
//     ui: NodeUI;
//     inputs: NodeInput[];
//     execute: (evaluatedInputs: Record<string, any>, environment: Record<string, any>) => Promise<any>;
// }

// --- Shared Private Helper Functions ---
async function handleDiscordApiError(response: Response): Promise<Response> {
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Discord API Error: ${errorData.message || 'Unknown Error'} (Code: ${errorData.code})`);
    }
    return response;
}

// Discord currently uses v10 of their API
const DISCORD_API_BASE = 'https://discord.com/api/v10';

// --- The Exported Node Operations ---
export const discordNodes: Record<string, NodeDefinition> = {

    // Operation 1: Get Guilds (Servers)
    "discord_get_guilds_v1": {
        service: "discord",
        operation: "get_guilds",
        ui: {
            type: "custom/apiNode",
            label: "Discord - Get Servers",
            description: "Retrieves a list of servers (guilds) the authenticated user or bot is a part of.",
            icon: "https://img.icons8.com/?size=100&id=30998&format=png&color=000000",
        },
        inputs: [], // No inputs required to list current user's guilds
        execute: async function (evaluatedInputs, environment) {
            const accessToken = environment.access_token;

            // Note: Depending on your OAuth setup, this might be 'Bearer <token>' for users
            // or 'Bot <token>' if you are operating strictly via a bot application token.
            const response = await fetch(`${DISCORD_API_BASE}/users/@me/guilds`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/json'
                }
            });

            await handleDiscordApiError(response);

            // Returns an array of partial guild objects: [ { id: "...", name: "My Server", ... } ]
            return await response.json();
        }
    },

    // Operation 2: Get Channels
    "discord_get_channels_v1": {
        service: "discord",
        operation: "get_channels",
        ui: {
            type: "custom/apiNode",
            label: "Discord - Get Channels",
            description: "Retrieves a list of channels for a specific server (guild).",
            icon: "https://img.icons8.com/?size=100&id=30998&format=png&color=000000",
        },
        inputs: [
            {
                key: "guildId",
                label: "Server (Guild) ID",
                type: "string",
                mandatory: true,
                description: "The unique ID of the Discord server."
            }
        ],
        execute: async function (evaluatedInputs, environment) {
            const { guildId } = evaluatedInputs;
            const accessToken = environment.access_token;

            const response = await fetch(`${DISCORD_API_BASE}/guilds/${guildId}/channels`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bot ${process.env.DISCORD_BOT_TOKEN}`,
                    'Accept': 'application/json'
                }
            });

            await handleDiscordApiError(response);

            // Returns an array of channel objects: [ { id: "...", name: "general", type: 0, ... } ]
            return await response.json();
        }
    },

    // Operation 3: Send Message
    "discord_send_message_v1": {
        service: "discord",
        operation: "send_message",
        ui: {
            type: "custom/apiNode",
            label: "Discord - Send Message",
            description: "Sends a message to a specific text channel.",
            icon: "https://img.icons8.com/?size=100&id=30998&format=png&color=000000",
        },
        inputs: [
            {
                key: "channelId",
                label: "Channel ID",
                type: "string",
                mandatory: true,
                description: "The unique ID of the text channel."
            },
            {
                key: "content",
                label: "Message Content",
                type: "string",
                mandatory: true,
                description: "The text content of the message to send (max 2000 characters)."
            }
        ],
        execute: async function (evaluatedInputs, environment) {
            const { channelId, content } = evaluatedInputs;
            const accessToken = environment.access_token;

            const requestBody = {
                content: content
            };

            const response = await fetch(`${DISCORD_API_BASE}/channels/${channelId}/messages`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bot ${process.env.DISCORD_BOT_TOKEN}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            await handleDiscordApiError(response);

            // Returns the created message object
            return await response.json();
        }
    },
    "discord_get_connections_v1": {
        service: "discord",
        operation: "get_connections",
        ui: {
            type: "custom/apiNode",
            label: "Discord - Get Linked Accounts",
            description: "Retrieves third-party accounts linked to the user's Discord.",
            icon: "https://img.icons8.com/?size=100&id=30998&format=png&color=000000",
        },
        inputs: [],
        execute: async function (evaluatedInputs, environment) {
            const accessToken = environment.access_token;

            const response = await fetch(`${DISCORD_API_BASE}/users/@me/connections`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/json'
                }
            });

            await handleDiscordApiError(response);
            return await response.json();
        }
    }
};