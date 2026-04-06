import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { SERVER_URL } from "../lib/constants";
import { useJWTTokenStore } from "./jwtTokenStore";

interface OAuthStoreState {
    loginWithGoogle: () => void;
    linkGoogleAccount: () => void; // 🌟 FIXED: Removed userId
    linkNotionAccount: () => void; // 🌟 FIXED: Removed userId
    linkDiscordAccount: () => void; // 🌟 FIXED: Removed userId
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