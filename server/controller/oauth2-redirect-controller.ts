import { Request, Response } from "express";
import passport, { use } from "passport";
import { GoogleConnection, NotionConnection, User } from "../models/user-model";
import { Types } from "mongoose";


const google_authenticate_callback = async (req: Request, res: Response) => {
    const code = req.query.code as string;
    console.log("Google Callback code: " + code);

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

        console.log("Google Token: " + JSON.stringify(tokenData));

        // 4. Use the Access Token to fetch the user's Discord profile
        const userResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
            headers: {
                authorization: `${tokenData.token_type} ${tokenData.access_token}`
            }
        });

        const userData = await userResponse.json();
        console.log("OpenID: " + JSON.stringify(userData));

        const absoluteExpiryTime = Date.now() + (tokenData.expires_in * 1000);


        if (userData && tokenData) {
            // 1. Find the User by EMAIL (since google_id is no longer on the User schema)
            let userInDB = await User.findOne({ email: userData.email });

            // 2. If User doesn't exist, create the base profile
            if (!userInDB) {
                userInDB = await User.create({
                    email: userData.email,
                    name: userData.name,
                    picture: userData.picture,
                });
            }

            // 3. Find if this specific Google connection already exists
            let googleConn = await GoogleConnection.findOne({
                userId: userInDB._id,
                google_id: userData.sub
            });

            if (googleConn) {
                // UPDATE existing connection
                googleConn.access_token = tokenData.access_token;
                googleConn.refresh_token = tokenData.refresh_token || googleConn.refresh_token;
                googleConn.access_token_expires_in = absoluteExpiryTime;
                googleConn.id_token = tokenData.id_token || googleConn.id_token;
                await googleConn.save();
            } else {
                // CREATE new connection
                googleConn = await GoogleConnection.create({
                    userId: userInDB._id,
                    google_id: userData.sub,
                    email: userData.email,
                    access_token: tokenData.access_token,
                    refresh_token: tokenData.refresh_token,
                    token_type: tokenData.token_type,
                    access_token_expires_in: absoluteExpiryTime,
                    id_token: tokenData.id_token,
                });

                // LINK it to the User's array!
                userInDB.google_connections.push(googleConn._id as Types.ObjectId);
                await userInDB.save();
            }


            // Generate your app's JWT to log the user into your frontend
            const appToken = userInDB.generateToken();
            // Success! You now have the user's profile and the access token.
            // In your workflow tool, you would save the 'tokenData.access_token' to your DB here.
            res.json({
                message: "Successfully logged in manually!",
                user: userData,
                tokens: tokenData,
                jwtToken: appToken
            });
        }
    } catch (error) {
        console.error('Error during OAuth flow:', error);
        res.status(500).send('Internal Server Error');
    }
};


const notion_authenticate_callback = async (req: Request, res: Response) => {
    const code = req.query.code as string;
    const userId = req.query.state as string;
    console.log("Notion Callback code: " + code);
    console.log("Notion Callback userId: " + userId);
    if (!code) {
        return res.status(400).send('No code provided');
    }
    if (!userId) return res.status(400).send('No user ID state provided');

    try {

        const encoded = Buffer.from(`${process.env.NOTION_CLIENT_ID}:${process.env.NOTION_CLIENT_SECRET}`).toString('base64');

        // 3. Exchange the code for an Access Token
        const tokenResponse = await fetch('https://api.notion.com/v1/oauth/token', {
            method: 'POST',
            headers: {
                Accept: "application/json",
                'Content-Type': 'application/json',
                Authorization: `Basic ${encoded}`,
            },
            body: JSON.stringify({
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: "http://localhost:5001/api/auth/notion/callback"
            })
        });

        const tokenData = await tokenResponse.json();
        if (tokenData.error) {
            return res.status(400).send('Failed to get token: ' + tokenData.error_description);
        }

        // The human owner's data is inside tokenData, NOT the /users/me endpoint (which is the bot)
        const notionOwner = tokenData.owner?.user;

        // 3. Verify the User exists in MongoDB
        const userInDB = await User.findById(userId);
        if (!userInDB) {
            return res.status(404).send('User not found in database');
        }

        // 4. Look for an existing Notion Connection for THIS user and THIS workspace
        let notionConn = await NotionConnection.findOne({
            userId: userInDB._id,
            workspace_id: tokenData.workspace_id    
        });

        if (notionConn) {
            // UPDATE: The user re-authorized the same workspace. Just update the tokens.
            notionConn.access_token = tokenData.access_token;
            notionConn.refresh_token = tokenData.refresh_token || notionConn.refresh_token; // Notion usually omits this
            notionConn.bot_id = tokenData.bot_id;
            notionConn.workspace_name = tokenData.workspace_name;
            await notionConn.save();
        } else {
            // CREATE: The user is authorizing a brand new workspace.
            notionConn = await NotionConnection.create({
                userId: userInDB._id,
                notion_user_id: notionOwner.id,
                workspace_id: tokenData.workspace_id,
                workspace_name: tokenData.workspace_name,
                bot_id: tokenData.bot_id,
                access_token: tokenData.access_token,
                refresh_token: tokenData.refresh_token || "no_refresh_token",
                token_type: tokenData.token_type || "bearer",
                name: notionOwner?.name,
                email: notionOwner?.person?.email
            });

            // LINK IT: Push the newly created NotionConnection ObjectId into the User's array
            userInDB.notion_connections.push(notionConn._id as Types.ObjectId);
            await userInDB.save();
        }

        // 5. Success! Redirect the user back to your frontend dashboard
        // res.redirect("http://localhost:5173/dashboard?integration=notion_success");

        res.json({
            message: "Successfully logged in notion!",
            tokens: tokenData,
        });

    } catch (error) {
        console.error('Error during OAuth flow:', error);
        res.status(500).send('Internal Server Error');
    }
}

export default { google_authenticate_callback, notion_authenticate_callback };