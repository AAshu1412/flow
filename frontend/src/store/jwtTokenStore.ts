import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { JWT_TOKEN_KEY } from "../lib/constants";

export const isTokenExpired = (token: string): boolean => {
  try {
    const payloadBase64 = token.split('.')[1];
    const decodedJson = atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(decodedJson);

    if (payload.exp && Math.floor(Date.now() / 1000) >= payload.exp) {
      return true;
    }

    if (payload.iat && payload.userAccessTokensExpiresIn) {
      // Decode when GitHub token expires based on the issued at time.
      const githubExpiration = payload.iat + payload.userAccessTokensExpiresIn;
      if (Math.floor(Date.now() / 1000) >= githubExpiration) {
        return true;
      }
    }

    return false;
  } catch (e) {
    return true;
  }
};

interface JWTTokenStoreState {
  jwtToken: string | null;
  storeTokenInLS: (token?: string) => void;
  isAuthenticated: () => boolean;
  clearToken: () => void;
}

export const useJWTTokenStore = create<JWTTokenStoreState>()(
  devtools(
    (set) => ({
      jwtToken: localStorage.getItem(JWT_TOKEN_KEY) || null,

      storeTokenInLS: (token?: string) => {
        if (token) {
          localStorage.setItem(JWT_TOKEN_KEY, token);
          set({ jwtToken: token });
        }
      },

      clearToken: () => {
        localStorage.removeItem(JWT_TOKEN_KEY);
        set({ jwtToken: null });
      },

      isAuthenticated: () => {
        return !!localStorage.getItem(JWT_TOKEN_KEY);
      },
    }),
    { name: "JWTTokenStore" }
  )
);