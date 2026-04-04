import User from "../models/user-model";
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