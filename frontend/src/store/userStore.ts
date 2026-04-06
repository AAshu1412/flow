import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { SERVER_URL } from "../lib/constants";
import type { UserProfile, ServiceMenuCategory } from "../types/userType";
import type { APIResponse } from "../types/apiResponseType";
import { useJWTTokenStore } from "./jwtTokenStore";
import type { FrontendNodeProfile } from "../types/nodeType";

interface UserStoreState {
    user: UserProfile | null;
    getUser: () => Promise<APIResponse<UserProfile>>;
    availableNodesMenu: ServiceMenuCategory[] | null;
    getAvailableNodesMenu: () => Promise<APIResponse<ServiceMenuCategory[]>>;
    nodeProfile: FrontendNodeProfile | null;
    getNodeProfile: (service: string, operation: string) => Promise<APIResponse<FrontendNodeProfile>>;
}

export const useUserStore = create<UserStoreState>()(
    devtools(
        (set, get) => ({
            user: null,

            getUser: async (): Promise<APIResponse<UserProfile>> => {
                try {
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
                    if (response.ok && data.status_response === 200 && data.data) {
                        set({ user: data.data });
                        return data;
                    }

                    throw new Error("Invalid user data received: " + data.error);
                } catch (error) {
                    console.error("Error fetching user:", error);
                    throw error;
                }
            },
            availableNodesMenu: null,
            getAvailableNodesMenu: async (): Promise<APIResponse<ServiceMenuCategory[]>> => {
                try {
                    const token = useJWTTokenStore.getState().jwtToken;
                    if (!token) throw new Error("No token found");
                    const response = await fetch(
                        `${SERVER_URL}/api/profile/nodes`,
                        {
                            method: "GET",
                        }
                    );

                    const data = (await response.json()) as APIResponse<ServiceMenuCategory[]>;

                    if (response.ok && data.status_response === 200 && data.data) {
                        set({ availableNodesMenu: data.data });
                        return data;
                    }

                    throw new Error("Invalid email data received: " + data.error);
                } catch (error) {
                    console.error("Error adding email:", error);
                    throw error;
                }
            },
            nodeProfile: null,
            getNodeProfile: async (service: string, operation: string): Promise<APIResponse<FrontendNodeProfile>> => {
                try {
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

                    if (response.ok && data.status_response === 200 && data.data) {
                        set({ nodeProfile: data.data });
                        return data;
                    }

                    throw new Error("Invalid node profile data received: " + data.error);
                } catch (error) {
                    console.error("Error fetching node profile:", error);
                    throw error;
                }

            }

        }),
        { name: "UserStore" }
    )
);