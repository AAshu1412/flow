import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { SERVER_URL } from "../lib/constants";
import { useJWTTokenStore } from "./jwtTokenStore";
import type { APIResponse } from "../types/apiResponseType";

interface OAuthStoreState {
    loginWithGoogle: () => void;
    linkGoogleAccount: (userId: string) => void;
    linkNotionAccount: (userId: string) => void;
    linkDiscordAccount: (userId: string) => void;
}

export const useOAuthStore = create<OAuthStoreState>()(
    devtools(
        (set) => ({
            
          
            // 🌟 NEW: OAuth Handlers
            loginWithGoogle: () => {
                // No userId = Primary Login
                window.location.href = `${SERVER_URL}/api/auth/google`;
            },
            
            linkGoogleAccount: (userId: string) => {
                // Appending userId allows the backend to link the new account to this user
                window.location.href = `${SERVER_URL}/api/auth/google?userId=${userId}`;
            },

            linkNotionAccount: (userId: string) => {
                window.location.href = `${SERVER_URL}/api/auth/notion?userId=${userId}`;
            },

            linkDiscordAccount: (userId: string) => {
                window.location.href = `${SERVER_URL}/api/auth/discord?userId=${userId}`;
            }
        }),
        { name: "OAuthStore" }
    )
);