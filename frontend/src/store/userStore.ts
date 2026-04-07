import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { SERVER_URL } from "../lib/constants";
import type { UserProfile, ServiceMenuCategory } from "../types/userType";
import type { APIResponse } from "../types/apiResponseType";
import { useJWTTokenStore } from "./jwtTokenStore";
import type { FrontendNodeProfile } from "../types/nodeType";

interface UserStoreState {
    isUserLoading: boolean;
    isMenuLoading: boolean;
    isProfileLoading: boolean;
    user: UserProfile | null;
    getUser: () => Promise<APIResponse<UserProfile>>;
    availableNodesMenu: ServiceMenuCategory[] | null;
    getAvailableNodesMenu: () => Promise<APIResponse<ServiceMenuCategory[]>>;
    nodeProfile: FrontendNodeProfile | null;
    nodeProfilesCache: Record<string, FrontendNodeProfile>;
    getNodeProfile: (service: string, operation: string) => Promise<APIResponse<FrontendNodeProfile | null>>;
    waitlistRequest: (email: string) => Promise<boolean>;
}

export const useUserStore = create<UserStoreState>()(
    devtools(
        (set, get) => ({
            isUserLoading: false,
            isMenuLoading: false,
            isProfileLoading: false,
            user: null,

            getUser: async (): Promise<APIResponse<UserProfile>> => {
                try {
                    set({ isUserLoading: true });
                    const token = useJWTTokenStore.getState().jwtToken;
                    if (!token) throw new Error("No token found");

                    const response = await fetch(`${SERVER_URL}/api/profile/user`, {
                        method: "GET",
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    });

                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }

                    const data = (await response.json()) as APIResponse<UserProfile>;
                    if (response.ok && data.status_response === 200 && data.data !== undefined) {
                        set({ user: data.data, isUserLoading: false });
                        return data;
                    }

                    throw new Error("Invalid user data received: " + data.error);
                } catch (error) {
                    console.error("Error fetching user:", error);
                    set({ isUserLoading: false });
                    throw error;
                }
            },
            availableNodesMenu: null,
            getAvailableNodesMenu: async (): Promise<APIResponse<ServiceMenuCategory[]>> => {
                try {
                    set({ isMenuLoading: true });
                    const token = useJWTTokenStore.getState().jwtToken;
                    if (!token) throw new Error("No token found");
                    const response = await fetch(`${SERVER_URL}/api/profile/nodes`, {
                        method: "GET",
                        headers: { Authorization: `Bearer ${token}` }
                    });

                    const data = (await response.json()) as APIResponse<ServiceMenuCategory[]>;

                    if (response.ok && data.status_response === 200 && data.data !== undefined) {
                        set({ availableNodesMenu: data.data, isMenuLoading: false });
                        return data;
                    }

                    throw new Error("Invalid menu data received: " + data.error);
                } catch (error) {
                    console.error("Error fetching nodes menu:", error);
                    set({ isMenuLoading: false });
                    throw error;
                }
            },
            nodeProfile: null,
            nodeProfilesCache: {},
            getNodeProfile: async (service: string, operation: string): Promise<APIResponse<FrontendNodeProfile>> => {
                const cacheKey = `${service}_${operation}`;

                const existingCache = get().nodeProfilesCache;
                if (existingCache[cacheKey]) {
                    return {
                        status_response: 200,
                        message: "Fetched from cache",
                        data: existingCache[cacheKey],
                    };
                }

                try {
                    set({ isProfileLoading: true });
                    const token = useJWTTokenStore.getState().jwtToken;
                    if (!token) throw new Error("No token found");
                    if (!service || !operation) throw new Error("Service and operation are required");
                    const response = await fetch(
                        `${SERVER_URL}/api/profile/nodeDetails`,
                        {
                            method: "POST",
                            headers: {
                                Authorization: `Bearer ${token}`,
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify({
                                service,
                                operation,
                            }),
                        }
                    );

                    const data = (await response.json()) as APIResponse<FrontendNodeProfile>;

                    if (response.ok && data.status_response === 200 && data.data !== undefined) {
                        set((state) => ({
                            nodeProfile: data.data,
                            nodeProfilesCache: {
                                ...state.nodeProfilesCache,
                                [cacheKey]: data.data!
                            },
                            isProfileLoading: false
                        }));
                        return data;
                    }

                    throw new Error("Invalid node profile data received: " + data.error);
                } catch (error) {
                    console.error("Error fetching node profile:", error);
                    set({ isProfileLoading: false });
                    throw error;
                }

            },
            waitlistRequest: async (email: string): Promise<boolean> => {
                try {
                    const response = await fetch(`${SERVER_URL}/api/waitlist/request`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            email
                        }),
                    });

                    if (response.status === 409) {
                        return true;
                    }

                    await response.json();
                    return false;
                } catch (error) {
                    console.error("Error requesting waitlist:", error);
                    return false;
                }
            },
        }),
        { name: "UserStore" }
    )
);