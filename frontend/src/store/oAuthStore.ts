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
            
          
             loginWithGoogle: () => {
                // Primary login requires no token
                window.location.href = `${SERVER_URL}/api/auth/google`;
            },
            
            linkGoogleAccount: () => {
                const token = useJWTTokenStore.getState().jwtToken;
                // Pass the token so authMiddleware can verify it!
                window.location.href = `${SERVER_URL}/api/auth/google?token=${token}`;
            },

            linkNotionAccount: () => {
                const token = useJWTTokenStore.getState().jwtToken;
                window.location.href = `${SERVER_URL}/api/auth/notion?token=${token}`;
            },

            linkDiscordAccount: () => {
                const token = useJWTTokenStore.getState().jwtToken;
                window.location.href = `${SERVER_URL}/api/auth/discord?token=${token}`;
            }
        }),
        { name: "OAuthStore" }
    )
);