import { model, Model, Schema } from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { IUser, IGoogleConnection, INotionConnection, IDiscordConnection, ITelegramConnection  } from "../types/user-type";
import { email } from "zod";


// const userSchema = new Schema({
//     google_id: {
//         type: String,
//         require: true,
//     },
//     notion_user_id:{
//         type: String,
//         require: false,
//     },
//     email: {
//         type: String,
//         require: true,
//     },
//     name: {
//         type: String,
//         require: true,
//     },
//     picture: {
//         type: String,
//         require: true,
//     },
//     google_oauth: {
//         access_token: {
//             type: String,
//             require: true,
//         },
//         refresh_token: {
//             type: String,
//             require: true,
//         },
//         token_type: {
//             type: String,
//             require: true,
//         },
//         access_token_expires_in: {
//             type: Number,
//             require: true,
//         },
//         id_token: {
//             type: String,
//             require: true,
//         },
//     },
//     notion_oauth:{

//          access_token: {
//             type: String,
//             require: true,
//         },
//         refresh_token: {
//             type: String,
//             require: true,
//         },
//         token_type: {
//             type: String,
//             require: true,
//         },
//         user_id:{
//             type: String,
//             require: true,
//         },
//         workspace_id: {
//             type: String,
//             require: true, 
//         },
//         workspace_name: {
//             type: String,
//             require: false,
//         },
//         bot_id: {
//             type: String,
//             require: false,
//         },
//         email:{
//             type: String,
//             require: false,
//     },
//     name: {
//         type: String,
//         require: false,
    
//     },
    
// }
// })

const googleSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    google_id: { type: String, required: true },
    email: { type: String, required: true }, // Which specific Google account is this?
    access_token: { type: String, required: true },
    refresh_token: { type: String, required: true },
    token_type: { type: String, required: true },
    access_token_expires_in: { type: Number, required: true }, // Absolute timestamp
    id_token: { type: String, required: true },
}, { timestamps: true });

const notionSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    notion_user_id: { type: String, required: true },
    workspace_id: { type: String, required: true },
    workspace_name: { type: String, required: false }, // e.g., "Ashutosh's Notion"
    bot_id: { type: String, required: false },
    access_token: { type: String, required: true },
    refresh_token: { type: String, required: true }, // Notion rarely uses this
    token_type: { type: String, required: true },
    name: { type: String, required: false },
    email: { type: String, required: false },
}, { timestamps: true });

const discordSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    discord_user_id: { type: String, required: true },
    username: { type: String, required: true },
    access_token: { type: String, required: true },
    refresh_token: { type: String, required: true },
    access_token_expires_in: { type: Number, required: true }, // Absolute timestamp
    // Optional: If they connected a specific server/guild to a workflow
    guild_id: { type: String, required: false }, 
}, { timestamps: true });

const telegramSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    telegram_id: { type: String, required: true },
    username: { type: String, required: false },
    first_name: { type: String, required: true },
    auth_date: { type: Number, required: true },
    // If you are storing a bot token for the automation to send messages:
    bot_token: { type: String, required: false }, 
    chat_id: { type: String, required: false }
}, { timestamps: true });

const userSchema = new Schema({
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    picture: { type: String, required: false },
    
    // Arrays of references to their connected accounts
    google_connections: [{ type: Schema.Types.ObjectId, ref: 'GoogleConnection' }],
    notion_connections: [{ type: Schema.Types.ObjectId, ref: 'NotionConnection' }],
    discord_connections: [{ type: Schema.Types.ObjectId, ref: 'DiscordConnection' }],
    telegram_connections: [{ type: Schema.Types.ObjectId, ref: 'TelegramConnection' }],
}, { timestamps: true });


userSchema.methods.generateToken = function () {
    try {
        const secret = process.env.JWT_SECRET_KEY!; 
        if (!secret) throw new Error('JWT_SECRET_KEY missing');
        return jwt.sign(
            // Keep the JWT payload small and fast!
            { userId: this._id.toString(), email: this.email }, 
            secret,
            { expiresIn: "30d" }
        );
    } catch (error) {
        console.error(error);
    }
};


const User: Model<IUser> = model<IUser>('User', userSchema);
const GoogleConnection = model<IGoogleConnection>('GoogleConnection', googleSchema);
const NotionConnection = model<INotionConnection>('NotionConnection', notionSchema);
const DiscordConnection = model<IDiscordConnection>('DiscordConnection', discordSchema);
const TelegramConnection = model<ITelegramConnection>('TelegramConnection', telegramSchema);


export  {User, GoogleConnection, NotionConnection, DiscordConnection, TelegramConnection} ;
