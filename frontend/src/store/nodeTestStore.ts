import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { SERVER_URL } from "../lib/constants";
import { useJWTTokenStore } from "./jwtTokenStore";
import type { APIResponse } from "../types/apiResponseType";

interface NodeTestStoreState {
    isTesting: boolean;
    testResult: any | null;
    node_test: (service: string, operation: string, selectedAccounts: string, inputs: Record<string, any>) => Promise<APIResponse<any>>;
}

export const useNodeTestStore = create<NodeTestStoreState>()(
    devtools(
        (set) => ({
            isTesting: false,
            testResult: null,

            node_test: async (service: string, operation: string, selectedAccounts: string, inputs: Record<string, any> = {}) => {
                try {
                    set({ isTesting: true, testResult: null });

                    const token = useJWTTokenStore.getState().jwtToken;
                    if (!token) throw new Error("No token found");
                    if (!service || !operation) throw new Error("Service and operation are required");

                    const response = await fetch(
                        `${SERVER_URL}/api/node_test/test`,
                        {
                            method: "POST",
                            headers: {
                                Authorization: `Bearer ${token}`,
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify({
                                service,
                                operation,
                                selectedAccounts,
                                inputs,
                            }),
                        }
                    );

                    const data = (await response.json()) as APIResponse<any>;

                    if (response.ok && data.status_response === 200 && data.data !== undefined) {
                        set({ isTesting: false, testResult: data.data });
                        return data;
                    }

                    throw new Error(data.error || data.message || "Invalid node test data received");
                } catch (error) {
                    console.error("Error fetching node test:", error);
                    set({ isTesting: false });
                    throw error;
                }
            }
        }),
        { name: "NodeTestStore" }
    )
);