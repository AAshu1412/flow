import { Request, Response } from "express";
import passport, { use } from "passport";
import { DiscordConnection, GoogleConnection, NotionConnection, User } from "../models/user-model";
import { Types } from "mongoose";


// const google_authenticate_callback = async (req: Request, res: Response) => {
//     const code = req.query.code as string;
//     const state = req.query.state as string;
//     console.log("Google Callback code: " + code);

//     if (!code) {
//         return res.status(400).send('No code provided');
//     }

//     try {
//         const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/x-www-form-urlencoded'
//             },
//             body: new URLSearchParams({
//                 client_id: process.env.GOOGLE_CLIENT_ID as string,
//                 client_secret: process.env.GOOGLE_CLIENT_SECRET as string,
//                 grant_type: 'authorization_code',
//                 code: code,
//                 redirect_uri: "http://localhost:5001/api/auth/google/callback"
//             })
//         });

//         const tokenData = await tokenResponse.json();

//         if (tokenData.error) {
//             return res.status(400).send('Failed to get token: ' + tokenData.error_description);
//         }

//         console.log("Google Token: " + JSON.stringify(tokenData));

//         const userResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
//             headers: {
//                 authorization: `${tokenData.token_type} ${tokenData.access_token}`
//             }
//         });

//         const userData = await userResponse.json();
//         console.log("OpenID: " + JSON.stringify(userData));

//         const absoluteExpiryTime = Date.now() + (tokenData.expires_in * 1000);


//         if (userData && tokenData) {
//             let userInDB = await User.findOne({ email: userData.email });

//             if (!userInDB) {
//                 userInDB = await User.create({
//                     email: userData.email,
//                     name: userData.name,
//                     picture: userData.picture,
//                 });
//             }

//             let googleConn = await GoogleConnection.findOne({
//                 userId: userInDB._id,
//                 google_id: userData.sub
//             });

//             if (googleConn) {
//                 googleConn.access_token = tokenData.access_token;
//                 googleConn.refresh_token = tokenData.refresh_token || googleConn.refresh_token;
//                 googleConn.access_token_expires_in = absoluteExpiryTime;
//                 googleConn.id_token = tokenData.id_token || googleConn.id_token;
//                 googleConn.scope = tokenData.scope || googleConn.scope;
//                 await googleConn.save();
//             } else {
//                 googleConn = await GoogleConnection.create({
//                     userId: userInDB._id,
//                     google_id: userData.sub,
//                     email: userData.email,
//                     access_token: tokenData.access_token,
//                     refresh_token: tokenData.refresh_token,
//                     token_type: tokenData.token_type,
//                     access_token_expires_in: absoluteExpiryTime,
//                     scope: tokenData.scope,
//                     id_token: tokenData.id_token,
//                 });

//                 // link it to the user's array
//                 userInDB.google_connections.push(googleConn._id as Types.ObjectId);
//                 await userInDB.save();
//             }


//             const appToken = userInDB.generateToken();
//             res.json({
//                 message: "Successfully logged in manually!",
//                 user: userData,
//                 tokens: tokenData,
//                 jwtToken: appToken
//             });
//         }
//     } catch (error) {
//         console.error('Error during OAuth flow:', error);
//         res.status(500).send('Internal Server Error');
//     }
// };


const google_authenticate_callback = async (req: Request, res: Response) => {
    const code = req.query.code as string;
    const state = req.query.state as string; // 🌟 This will be "login" or the actual userId
    
    console.log("Google Callback code: " + code);

    if (!code) {
        return res.status(400).send('No code provided');
    }

    try {
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: process.env.GOOGLE_CLIENT_ID as string,
                client_secret: process.env.GOOGLE_CLIENT_SECRET as string,
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: "http://localhost:5001/api/auth/google/callback"
            })
        });

        const tokenData = await tokenResponse.json();
        if (tokenData.error) return res.status(400).send('Failed to get token: ' + tokenData.error_description);

        const userResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
            headers: { authorization: `${tokenData.token_type} ${tokenData.access_token}` }
        });

        const userData = await userResponse.json();
        const absoluteExpiryTime = Date.now() + (tokenData.expires_in * 1000);

        if (userData && tokenData) {
            let userInDB;

            // 🌟 LOGIC BRANCH: Login vs Linking Account
            if (state && state !== "login") {
                // LINKING: Find the user who clicked "Add Account" in their dashboard
                userInDB = await User.findById(state);
                if (!userInDB) return res.status(404).send('Original user not found in database');
            } else {
                // PRIMARY LOGIN: Find or create the master user account
                userInDB = await User.findOne({ email: userData.email });
                if (!userInDB) {
                    userInDB = await User.create({
                        email: userData.email,
                        name: userData.name,
                        picture: userData.picture,
                    });
                }
            }

            // Create or update the specific Google Connection
            let googleConn = await GoogleConnection.findOne({
                userId: userInDB._id,
                google_id: userData.sub
            });

            if (googleConn) {
                googleConn.access_token = tokenData.access_token;
                googleConn.refresh_token = tokenData.refresh_token || googleConn.refresh_token;
                googleConn.access_token_expires_in = absoluteExpiryTime;
                googleConn.id_token = tokenData.id_token || googleConn.id_token;
                googleConn.scope = tokenData.scope || googleConn.scope;
                await googleConn.save();
            } else {
                googleConn = await GoogleConnection.create({
                    userId: userInDB._id,
                    google_id: userData.sub,
                    email: userData.email,
                    access_token: tokenData.access_token,
                    refresh_token: tokenData.refresh_token,
                    token_type: tokenData.token_type,
                    access_token_expires_in: absoluteExpiryTime,
                    scope: tokenData.scope,
                    id_token: tokenData.id_token,
                });

                userInDB.google_connections.push(googleConn._id as Types.ObjectId);
                await userInDB.save();
            }

            // Generate the JWT for the frontend
            const appToken = userInDB.generateToken();

            // 🌟 REDIRECT TO FRONTEND (Change localhost:3000 to your actual frontend URL)
            // The React app will read the token from the URL and save it to Zustand
            res.redirect(`http://localhost:3000/auth-success?token=${appToken}`);
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

        const tokenStatusResponse = await fetch('https://api.notion.com/v1/oauth/introspect', {
            method: 'POST',
            headers: {
                'Notion-Version': '2026-03-11',
                'Content-Type': 'application/json',
                Authorization: `Basic ${encoded}`,
            },
            body: JSON.stringify({ token: tokenData.access_token })
        });

        const tokenStatus = await tokenStatusResponse.json();


        const notionOwner = tokenData.owner?.user;

        const userInDB = await User.findById(userId);
        if (!userInDB) {
            return res.status(404).send('User not found in database');
        }

        let notionConn = await NotionConnection.findOne({
            userId: userInDB._id,
            workspace_id: tokenData.workspace_id
        });

        if (notionConn) {
            notionConn.access_token = tokenData.access_token;
            notionConn.refresh_token = tokenData.refresh_token || notionConn.refresh_token; // Notion usually omits this
            notionConn.bot_id = tokenData.bot_id;
            notionConn.workspace_name = tokenData.workspace_name;
            notionConn.scope = tokenStatus.scope;
            await notionConn.save();
        } else {
            notionConn = await NotionConnection.create({
                userId: userInDB._id,
                notion_user_id: notionOwner.id,
                workspace_id: tokenData.workspace_id,
                workspace_name: tokenData.workspace_name,
                bot_id: tokenData.bot_id,
                access_token: tokenData.access_token,
                refresh_token: tokenData.refresh_token || "no_refresh_token",
                token_type: tokenData.token_type || "bearer",
                scope: tokenStatus.scope,
                name: notionOwner?.name,
                email: notionOwner?.person?.email
            });

            // link it: Push the newly created NotionConnection ObjectId into the User's array
            userInDB.notion_connections.push(notionConn._id as Types.ObjectId);
            await userInDB.save();
        }


        res.json({
            message: "Successfully logged in notion!",
            tokens: tokenData,
            tokenStatus: tokenStatus
        });

    } catch (error) {
        console.error('Error during OAuth flow:', error);
        res.status(500).send('Internal Server Error');
    }
}


const discord_authenticate_callback = async (req: Request, res: Response) => {

    const code = req.query.code as string;
    const userId = req.query.state as string;
    console.log("Discord Callback code: " + code);
    console.log("Discord Callback userId: " + userId);
    if (!code) {
        return res.status(400).send('No code provided');
    }
    if (!userId) return res.status(400).send('No user ID state provided');



    try {

        const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                client_id: process.env.DISCORD_CLIENT_ID as string,
                client_secret: process.env.DISCORD_CLIENT_SECRET as string,
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: "http://localhost:5001/api/auth/discord/callback"
            })
        });

        const tokenData = await tokenResponse.json();

        if (tokenData.error) {
            return res.status(400).send('Failed to get token: ' + tokenData.error_description);
        }

        const userResponse = await fetch('https://discord.com/api/users/@me', {
            headers: {
                authorization: `${tokenData.token_type} ${tokenData.access_token}`
            }
        });

        const userData = await userResponse.json();




        if (userData && tokenData) {
            if (!tokenData.guild) {
                return res.status(400).send('No server selected. Please authorize the bot for a specific server.');
            }

            const absoluteExpiryTime = Date.now() + (tokenData.expires_in * 1000);

            const userInDB = await User.findById(userId);
            if (!userInDB) {
                return res.status(404).send('User not found in database');
            }

            let discordConn = await DiscordConnection.findOne({
                userId: userInDB._id,
                guild_id: tokenData.guild.id
            });

            if (discordConn) {
                discordConn.access_token = tokenData.access_token;
                discordConn.refresh_token = tokenData.refresh_token || discordConn.refresh_token;
                discordConn.access_token_expires_in = absoluteExpiryTime;
                discordConn.scope = tokenData.scope || discordConn.scope;

                discordConn.discord_user_id = userData.id;
                discordConn.username = userData.username;
                discordConn.global_name = userData.global_name;
                discordConn.email = userData.email;
                discordConn.guild_name = tokenData.guild.name;
                discordConn.guild_icon = tokenData.guild.icon;
                await discordConn.save();
            } else {
                discordConn = await DiscordConnection.create({
                    userId: userInDB._id,
                    discord_user_id: userData.id,
                    username: userData.username,
                    global_name: userData.global_name,
                    email: userData.email,
                    access_token: tokenData.access_token,
                    refresh_token: tokenData.refresh_token,
                    token_type: tokenData.token_type,
                    access_token_expires_in: absoluteExpiryTime,
                    scope: tokenData.scope,
                    guild_id: tokenData.guild.id,
                    guild_name: tokenData.guild.name,
                    guild_icon: tokenData.guild.icon
                });

                userInDB.discord_connections.push(discordConn._id as Types.ObjectId);
                await userInDB.save();
            }

            res.json({
                message: "Successfully logged in discord!",
                user: userData,
                tokens: tokenData
            });
        }

    } catch (error) {
        console.error('Error during OAuth flow:', error);
        res.status(500).send('Internal Server Error');
    }

}

export default { google_authenticate_callback, notion_authenticate_callback, discord_authenticate_callback };