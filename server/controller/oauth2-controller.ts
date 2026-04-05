import { Request, Response } from "express";


// const google_authenticate = async (req: Request, res: Response) => {
//     try {
//         const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent("http://localhost:5001/api/auth/google/callback")}&response_type=code&include_granted_scopes=true&state=pass-through value&access_type=offline&prompt=consent&scope=profile%20email%20openid`;
//         res.redirect(url);
//     }
//     catch (error: any) {
//         res.status(500).send({ status_response: 500, error: error.message });
//     }
// }


// const discord_authenticate = async (req: Request, res: Response) => {
//     try {

//         // -- ASHU
//         // const userId = req.db_doc_id;
//         // -- ASHU 

//         

//         const url = `https://discord.com/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent("http://localhost:5001/api/auth/discord/callback")}&response_type=code&state=${userId}&scope=identify%20guilds%20email`;
//         res.redirect(url);
//     }
//     catch (error: any) {
//         res.status(500).send({ status_response: 500, error: error.message });
//     }
// }


export const google_authenticate = async (req: Request, res: Response) => {
    try {
        // 1. Define all required scopes in an array for better readability
        const scopes = [
            'openid',
            'email',
            'profile',
            // Gmail (Send Message, Get Thread, List Threads)
            'https://www.googleapis.com/auth/gmail.modify',
            // Google Docs (Create Document, Append Document, Get Document)
            'https://www.googleapis.com/auth/documents',
            // Google Drive (List Files, Find File IDs)
            'https://www.googleapis.com/auth/drive.readonly',
            // Google Forms (Create Form, Add Question, Get Details, List Responses)
            'https://www.googleapis.com/auth/forms.body',
            'https://www.googleapis.com/auth/forms.responses.readonly',
            // Google Meet (Create Space, Get Space, List Transcripts/Recordings)
            'https://www.googleapis.com/auth/meetings.space.created',
            'https://www.googleapis.com/auth/meetings.space.readonly',
            // Google Sheets (Append Row, Get Rows, Get Info)
            'https://www.googleapis.com/auth/spreadsheets'
        ];

        // 2. Join them with a space and encode them for the URL
        const scopeString = encodeURIComponent(scopes.join(' '));
        const redirectUri = encodeURIComponent("http://localhost:5001/api/auth/google/callback");

        // 3. Construct the final URL
        const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${redirectUri}&response_type=code&include_granted_scopes=true&state=pass-through%20value&access_type=offline&prompt=consent&scope=${scopeString}`;
        
        res.redirect(url);
    }
    catch (error: any) {
        res.status(500).send({ status_response: 500, error: error.message });
    }
}

const notion_authenticate = async (req: Request, res: Response) => {
    try {
        // -- ASHU
        // const userId = req.db_doc_id;
        // -- ASHU 

        

        const url = `https://api.notion.com/v1/oauth/authorize?owner=user&client_id=${process.env.NOTION_CLIENT_ID}&redirect_uri=${encodeURIComponent("http://localhost:5001/api/auth/notion/callback")}&response_type=code&state=${userId}`;
        res.redirect(url);
    }
    catch (error: any) {
        res.status(500).send({ status_response: 500, error: error.message });
    }
}

const discord_authenticate = async (req: Request, res: Response) => {
    try {
        // -- ASHU
        // const userId = req.db_doc_id;
        // -- ASHU 

        

        const scopes = [
            'identify', // Get basic user info
            'email',    // Get user email
            'guilds',   // Needed for Operation 1: Get the list of servers the user is in
            'bot'       // CRITICAL for Ops 2 & 3: Forces the user to invite your bot to their server
        ];

        const scopeString = encodeURIComponent(scopes.join(' '));
        const redirectUri = encodeURIComponent("http://localhost:5001/api/auth/discord/callback");

        // 3. Define the Bot Permissions your workflow needs
        // 1024 (View Channels) + 2048 (Send Messages) = 3072
        // Note: If you want to just give the bot Administrator rights to avoid issues, use '8'
        const permissions = 3072;

        const url = `https://discord.com/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID}&redirect_uri=${redirectUri}&response_type=code&state=${userId}&scope=${scopeString}&permissions=${permissions}`;
        
        res.redirect(url);
    }
    catch (error: any) {
        res.status(500).send({ status_response: 500, error: error.message });
    }
}


export default { google_authenticate, notion_authenticate, discord_authenticate };