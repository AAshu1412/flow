import {Request,Response} from "express";
import passport, { use } from "passport";
import User from "../models/user-model";


const google_authenticate_callback = async (req: Request, res: Response) => {
    const code = req.query.code as string;
    console.log("Google Callback code: "+code);

    if (!code) {
        return res.status(400).send('No code provided');
    }

    try {
        // 3. Exchange the code for an Access Token
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                client_id: process.env.GOOGLE_CLIENT_ID as string,
                client_secret: process.env.GOOGLE_CLIENT_SECRET as string,
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: "http://localhost:5001/api/auth/google/callback"
            })
        });

        const tokenData = await tokenResponse.json();

        if (tokenData.error) {
            return res.status(400).send('Failed to get token: ' + tokenData.error_description);
        }

        console.log("Google Token: "+JSON.stringify(tokenData));

        // 4. Use the Access Token to fetch the user's Discord profile
        const userResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
            headers: {
                authorization: `${tokenData.token_type} ${tokenData.access_token}`
            }
        });

        const userData = await userResponse.json();
        console.log("OpenID: "+JSON.stringify(userData));

        const absoluteExpiryTime = Date.now() + (tokenData.expires_in * 1000);


        
        if (userData && tokenData) {
           const userInDB = await User.findOne({ google_id: userData.sub });

           if (userInDB) {
                userInDB.email = userData.email;
                userInDB.name = userData.name;
                userInDB.picture = userData.picture;
                
                userInDB.google_oauth = {
                    access_token: tokenData.access_token,
                    refresh_token: tokenData.refresh_token || userInDB.google_oauth.refresh_token,
                    token_type: tokenData.token_type,
                    access_token_expires_in: absoluteExpiryTime, // Save the absolute time
                    id_token: tokenData.id_token || userInDB.google_oauth.id_token,
                };
                
                await userInDB.save();
           } else {
                await User.create({
                    google_id: userData.sub,
                    email: userData.email,
                    name: userData.name,
                    picture: userData.picture,
                    google_oauth: {
                        access_token: tokenData.access_token,
                        refresh_token: tokenData.refresh_token,
                        token_type: tokenData.token_type,
                        access_token_expires_in: absoluteExpiryTime, // Save the absolute time
                        id_token: tokenData.id_token,
                    },
                });
           }
        }

        // 4. Generate your own app's JWT to log the user into your frontend
        const savedUser = await User.findOne({ google_id: userData.sub });
        const appToken = savedUser?.generateToken();
        // Success! You now have the user's profile and the access token.
        // In your workflow tool, you would save the 'tokenData.access_token' to your DB here.
        res.json({
            message: "Successfully logged in manually!",
            user: userData,
            tokens: tokenData
        });

    } catch (error) {
        console.error('Error during OAuth flow:', error);
        res.status(500).send('Internal Server Error');
    }
};

export default { google_authenticate_callback };