import { Types } from "mongoose";
import { DiscordConnection, GoogleConnection, NotionConnection, User } from "../models/user-model";


export const getValidGoogleAccessToken = async (userId: string | Types.ObjectId, connectionEmail: string): Promise<string | null> => {

    const googleConn = await GoogleConnection.findOne({
        userId: userId,
        email: connectionEmail
    });

    if (!googleConn || !googleConn.access_token) {
        throw new Error(`Google account ${connectionEmail} is not connected.`);
    }

    const now = Date.now();
    // Add a 1-minute buffer (60000ms)
    const isExpired = now >= (googleConn.access_token_expires_in - 60000);

    if (!isExpired) {
        return googleConn.access_token;
    }

    console.log(`Google Access token expired for ${connectionEmail}. Refreshing silently...`);

    try {
        const response = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: process.env.GOOGLE_CLIENT_ID as string,
                client_secret: process.env.GOOGLE_CLIENT_SECRET as string,
                grant_type: 'refresh_token',
                refresh_token: googleConn.refresh_token
            })
        });

        const data = await response.json();

        if (data.error) {
            console.error("Failed to refresh Google token:", data);
            throw new Error("Refresh token invalid. User must re-authenticate.");
        }

        googleConn.access_token = data.access_token;
        googleConn.access_token_expires_in = Date.now() + (data.expires_in * 1000);
        if (data.id_token) googleConn.id_token = data.id_token;

        await googleConn.save();

        return googleConn.access_token;

    } catch (error) {
        console.error("Error refreshing Google token:", error);
        return null;
    }
};

export const getValidNotionToken = async (userId: string | Types.ObjectId, workspaceId: string): Promise<string | null> => {
    const notionConn = await NotionConnection.findOne({
        userId: userId,
        workspace_id: workspaceId
    });

    if (!notionConn || !notionConn.access_token) {
        throw new Error("Notion workspace is not connected to this user.");
    }

    const encoded = Buffer.from(`${process.env.NOTION_CLIENT_ID}:${process.env.NOTION_CLIENT_SECRET}`).toString('base64');

    try {
        const tokenStatusResponse = await fetch('https://api.notion.com/v1/oauth/introspect', {
            method: 'POST',
            headers: {
                'Notion-Version': '2026-03-11',
                'Content-Type': 'application/json',
                Authorization: `Basic ${encoded}`,
            },
            body: JSON.stringify({ token: notionConn.access_token })
        });

        const tokenStatus = await tokenStatusResponse.json();

        if (tokenStatus.active) {
            return notionConn.access_token;
        }

        console.log(`Notion token expired for workspace ${workspaceId}. Refreshing...`);

        const refreshResponse = await fetch("https://api.notion.com/v1/oauth/token", {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: `Basic ${encoded}`,
            },
            body: JSON.stringify({
                grant_type: "refresh_token",
                refresh_token: notionConn.refresh_token,
            }),
        });

        const refreshData = await refreshResponse.json();

        if (refreshData.error) {
            throw new Error("Refresh token invalid. User must re-authorize this workspace.");
        }

        notionConn.access_token = refreshData.access_token;

        if (refreshData.refresh_token) {
            notionConn.refresh_token = refreshData.refresh_token;
        }

        await notionConn.save();

        return notionConn.access_token;

    } catch (error) {
        console.error("Failed to refresh Notion token:", error);
        return null;
    }
};


export const getValidDiscordToken = async (userId: string | Types.ObjectId, guildId: string): Promise<string | null> => {

    const discordConn = await DiscordConnection.findOne({
        userId: userId,
        guild_id: guildId
    });


    if (!discordConn || !discordConn.access_token) {
        throw new Error(`Discord server connection ${guildId} is not connected or missing token.`);
    }
    const now = Date.now();
    // 2. Add a 1-minute buffer (60000ms) to prevent expiring mid-request
    const isExpired = now >= (discordConn.access_token_expires_in - 60000);

    if (!isExpired) {
        return discordConn.access_token;
    }

    console.log(`Discord Access token expired for ${discordConn.username}. Refreshing silently...`);

    try {
        const response = await fetch('https://discord.com/api/oauth2/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: process.env.DISCORD_CLIENT_ID as string,
                client_secret: process.env.DISCORD_CLIENT_SECRET as string,
                grant_type: 'refresh_token',
                refresh_token: discordConn.refresh_token
            })
        });

        const data = await response.json();

        if (data.error) {
            console.error("Failed to refresh Discord token:", data);
            throw new Error("Refresh token invalid or revoked. User must re-authenticate.");
        }

        discordConn.access_token = data.access_token;
        discordConn.access_token_expires_in = Date.now() + (data.expires_in * 1000);

        discordConn.refresh_token = data.refresh_token || discordConn.refresh_token;
        discordConn.scope = data.scope || discordConn.scope;

        await discordConn.save();

        return discordConn.access_token;

    } catch (error) {
        console.error("Error refreshing Discord token:", error);
        return null;
    }
};

