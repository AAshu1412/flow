import { gmailNodes } from "./gmail_node";
import { discordNodes } from "./discord";
import { notionNodes } from "./notion";
import {googleSheetsNodes} from "./googleSheets";
import {googleDocsNodes} from "./googleDocs";
import {googleDriveNodes} from "./googleDrive";
import {googleFormsNodes} from "./googleForms";
import {googleMeetNodes} from "./googleMeet";
import {geminiNodes} from "./gemini";
import {coreNodes} from "./general_node";
import { NodeDefinition } from "../types/node-type";
// import { Types } from "mongoose";
// import { GoogleConnection, NotionConnection, DiscordConnection } from "../models/user-model";
// import { FrontendNodeProfile, AvailableAccount, BackendNodeProfile, ServiceName, AnyOperation } from "../types/node-type";
// import { getValidGoogleAccessToken, getValidNotionToken, getValidDiscordToken } from "../utils/oauth-token-refresh";

export const allNodesRegistry: Record<string, NodeDefinition> = {
    ...gmailNodes,
    ...discordNodes,
    ...notionNodes,
    ...googleSheetsNodes,
    ...googleDocsNodes,
    ...googleDriveNodes,
    ...googleFormsNodes,
    ...googleMeetNodes,
    ...geminiNodes,
    ...coreNodes,
};


