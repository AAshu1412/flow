import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { SERVER_URL } from "../lib/constants";
import { useJWTTokenStore } from "./jwtTokenStore";
import type { APIResponse } from "../types/apiResponseType";
import type { SaveWorkflowPayload, SaveWorkflowResult, WorkflowBlueprint, WorkflowExecutionPayload, WorkflowExecutionResult } from "../types/workflowType";

interface WorkflowStoreState {
    isExecuting: boolean;
    lastResult: WorkflowExecutionResult | null;
    execute_workflow: (payload: WorkflowExecutionPayload) => Promise<APIResponse<WorkflowExecutionResult>>;
    saveWorkflow: (payload: SaveWorkflowPayload) => Promise<APIResponse<SaveWorkflowResult>>;
    getAllWorkflows: () => Promise<APIResponse<WorkflowBlueprint[]>>;
    getWorkflowById: (id: string) => Promise<APIResponse<WorkflowBlueprint>>;
    getAllWorkflowIds: () => Promise<APIResponse<{ workflowId: string, name?: string, description?: string }[]>>;
}

export const useWorkflowStore = create<WorkflowStoreState>()(
    devtools(
        (set) => ({
            isExecuting: false,
            lastResult: null,

            execute_workflow: async (payload: WorkflowExecutionPayload) => {
                try {
                    // Turn on the loading spinner in the UI
                    set({ isExecuting: true, lastResult: null });

                    const token = useJWTTokenStore.getState().jwtToken;
                    if (!token) throw new Error("No token found");

                    // Slightly safer check: Ensure nodes actually exist and aren't empty
                    if (!payload.nodes || Object.keys(payload.nodes).length === 0) {
                        throw new Error("Cannot execute an empty workflow.");
                    }

                    const response = await fetch(
                        `${SERVER_URL}/api/workflow/execute`, // Make sure this matches your router (workflows vs workflow)
                        {
                            method: "POST",
                            headers: {
                                Authorization: `Bearer ${token}`,
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify(payload),
                        }
                    );

                    const data = (await response.json()) as APIResponse<WorkflowExecutionResult>;

                    if (response.ok && data.status_response === 200 && data.data !== undefined) {
                        set({ isExecuting: false, lastResult: data.data });
                        return data;
                    }

                    throw new Error(data.message || data.error || "Workflow execution failed.");
                } catch (error) {
                    console.error("Error executing workflow:", error);
                    set({ isExecuting: false });
                    throw error;
                }
            },
            saveWorkflow: async (payload: SaveWorkflowPayload) => {
                try {
                    const token = useJWTTokenStore.getState().jwtToken;
                    if (!token) throw new Error("No token found");

                    const response = await fetch(`${SERVER_URL}/api/workflow/save`, {
                        method: "POST",
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify(payload),
                    });

                    const data = (await response.json()) as APIResponse<SaveWorkflowResult>;
                    if (response.ok && data.status_response === 200 && data.data !== undefined) {
                        return data;
                    }
                    throw new Error(data.message || data.error || "Failed to save workflow");
                } catch (error) {
                    console.error("Error saving workflow:", error);
                    throw error;
                }
            },

            // 2. Get All Workflows (Hits /api/workflows/)
            getAllWorkflows: async () => {
                try {
                    const token = useJWTTokenStore.getState().jwtToken;
                    if (!token) throw new Error("No token found");

                    const response = await fetch(`${SERVER_URL}/api/workflow/`, {
                        method: "GET",
                        headers: { Authorization: `Bearer ${token}` },
                    });

                    // The backend returns an array of workflows
                    const data = (await response.json()) as APIResponse<WorkflowBlueprint[]>;
                    if (response.ok && data.status_response === 200 && data.data !== undefined) {
                        return data;
                    }
                    throw new Error(data.message || data.error || "Failed to fetch workflows");
                } catch (error) {
                    console.error("Error fetching workflow:", error);
                    throw error;
                }
            },

            // 3. Get Single Workflow (Hits /api/workflows/:id)
            getWorkflowById: async (id: string) => {
                try {
                    const token = useJWTTokenStore.getState().jwtToken;
                    if (!token) throw new Error("No token found");
                    if (!id) throw new Error("No workflow ID found");

                    const response = await fetch(`${SERVER_URL}/api/workflow/${id}`, {
                        method: "GET",
                        headers: { Authorization: `Bearer ${token}` },
                    });

                    // The backend returns a single workflow object
                    const data = (await response.json()) as APIResponse<WorkflowBlueprint>;
                    if (response.ok && data.status_response === 200 && data.data !== undefined) {
                        return data;
                    }
                    throw new Error(data.message || data.error || "Failed to fetch workflow");
                } catch (error) {
                    console.error("Error fetching workflow by id:", error);
                    throw error;
                }
            },
            
            getAllWorkflowIds: async () => {
                try {
                    const token = useJWTTokenStore.getState().jwtToken;
                    if (!token) throw new Error("No token found");

                    const response = await fetch(`${SERVER_URL}/api/workflow/all/ids`, {
                        method: "GET",
                        headers: { Authorization: `Bearer ${token}` },
                    });

                    const data = (await response.json()) as APIResponse<{ workflowId: string, name?: string, description?: string }[]>;
                    if (response.ok && data.status_response === 200 && data.data !== undefined) {
                        return data;
                    }
                    throw new Error(data.message || data.error || "Failed to fetch workflow ids");
                } catch (error) {
                    console.error("Error fetching workflow ids:", error);
                    throw error;
                }
            }
        }),
        { name: "WorkflowStore" }
    )
);