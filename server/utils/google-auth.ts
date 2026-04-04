import { Types } from "mongoose";
import {NotionConnection, User} from "../models/user-model";
import { IUser } from "../types/user-type";


export const getValidGoogleAccessToken = async (userId: string): Promise<string | null> => {
    const user = await User.findById(userId);
    
    if (!user || !user.google_oauth || !user.google_oauth.access_token) {
        throw new Error("User has not connected Google");
    }

    const now = Date.now();
    // Add a 1-minute buffer (60000ms) so the token doesn't expire exactly mid-request
    const isExpired = now >= (user.google_oauth.access_token_expires_in - 60000);

    if (!isExpired) {
        // Token is still good! Return it immediately.
        return user.google_oauth.access_token;
    }

    console.log(`Access token expired for ${user.email}. Refreshing silently...`);

    try {
        const response = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: process.env.GOOGLE_CLIENT_ID as string,
                client_secret: process.env.GOOGLE_CLIENT_SECRET as string,
                grant_type: 'refresh_token',
                refresh_token: user.google_oauth.refresh_token // Use the saved refresh token
            })
        });

        const data = await response.json();

        if (data.error) {
            console.error("Failed to refresh token:", data);
            // This usually means the user revoked access in their Google Security settings
            throw new Error("Refresh token invalid. User must re-authenticate.");
        }

        user.google_oauth.access_token = data.access_token;
        user.google_oauth.access_token_expires_in = Date.now() + (data.expires_in * 1000);
        if (data.id_token) user.google_oauth.id_token = data.id_token;

        await user.save();

        return user.google_oauth.access_token;

    } catch (error) {
        console.error("Error refreshing token:", error);
        return null;
    }
};


export const getValidNotionToken = async (userId:  string | Types.ObjectId, workspaceId: string): Promise<string | null> => {
    // 1. Query the dedicated Notion collection using BOTH user and workspace IDs
    const notionConn = await NotionConnection.findOne({ 
        userId: userId, 
        workspace_id: workspaceId 
    });
    
    if (!notionConn || !notionConn.access_token) {
        throw new Error("Notion workspace is not connected to this user.");
    }

    const encoded = Buffer.from(`${process.env.NOTION_CLIENT_ID}:${process.env.NOTION_CLIENT_SECRET}`).toString('base64');

    try {
        // 2. Check if the token is still active via the Introspect endpoint
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

        // 3. If it is active, return the token immediately!
        if (tokenStatus.active) {
            return notionConn.access_token;
        }

        console.log(`Notion token expired for workspace ${workspaceId}. Refreshing...`);

        // 4. If inactive, use the refresh token to get a new one
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

        // 5. Update the specific Connection document with the new tokens
        notionConn.access_token = refreshData.access_token;
        
        // Notion might not return a new refresh token every time, so keep the old one if missing
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