export interface NodeUI {
    type: string;
    label: string;
    description: string;
    icon: string;
}

export interface NodeInputOption {
    label: string;
    value: string;
}

export interface NodeInput {
    key: string;
    label: string;
    type: 'string' | 'number' | 'boolean' | 'select';
    mandatory: boolean;
    description?: string;
    options?: NodeInputOption[]; // Only exists if type is 'select'
    defaultValue?: string | number | boolean;
}

export interface AvailableAccount {
    connectionId: string;
    label: string;      // e.g., "Ashutosh's Notion" or "Vibe"
    identifier: string; // e.g., "1490477776954724625"
}

// This represents the "data" object in your JSON
export interface FrontendNodeProfile {
    templateId: string;
    service: string;
    operation: string;
    ui: NodeUI;
    inputs: NodeInput[];
    availableAccounts: AvailableAccount[];
}