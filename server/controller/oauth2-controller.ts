import {Request,Response} from "express";
import passport from "passport";

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

export default { google_authenticate };