import {Request,Response} from "express";
import passport from "passport";
import {User} from "../models/user-model";

// const google_authenticate = async (req: Request, res: Response) => {
//     try {
//         const response = await passport.authenticate('google');
//         console.log(response);

//         return res.status(200).json({status_response: 200, data: response });
//     }
//     catch (error: any) {
//         res.status(500).send({ status_response: 500, error: error.message });
//     }
// }

// const google_authenticate = passport.authenticate('google');


const google_authenticate = async (req: Request, res: Response) => {
    try {
        const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent("http://localhost:5001/api/auth/google/callback")}&response_type=code&include_granted_scopes=true&state=pass-through value&access_type=offline&prompt=consent&scope=profile%20email%20openid`;
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

        

        const url = `https://discord.com/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent("http://localhost:5001/api/auth/discord/callback")}&response_type=code&state=${userId}&scope=identify%20guilds%20email`;
    res.redirect(url);
    }
    catch (error: any) {
        res.status(500).send({ status_response: 500, error: error.message });
    }
}


export default { google_authenticate, notion_authenticate, discord_authenticate };