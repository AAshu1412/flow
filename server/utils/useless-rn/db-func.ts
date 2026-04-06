import { User } from "../../models/user-model";
import { Provider } from "../../types/node-type";
import { Types } from "mongoose";

/**
 * Fetches a user and their connected accounts.
 * @param userId - The ID of the user.
 * @param safeMode - If true (default), hides sensitive tokens and IDs. If false, returns all data.
 */
const getUserWithAllConnections = async (
    userId: string | Types.ObjectId,
    safeMode: boolean = true
) => {
    try {
        const googleSafeFields = '-google_id -access_token -refresh_token -token_type -access_token_expires_in -id_token';
        const notionSafeFields = '-notion_user_id -bot_id -access_token -refresh_token -token_type';
        const discordSafeFields = '-discord_user_id -access_token -token_type -refresh_token -access_token_expires_in';
        const telegramSafeFields = '-_id -userId -telegram_id -bot_token -auth_date -chat_id';

        let query = User.findById(userId);

        if (safeMode) {
            query = query
                .populate('google_connections', googleSafeFields)
                .populate('notion_connections', notionSafeFields)
                .populate('discord_connections', discordSafeFields)
                .populate('telegram_connections', telegramSafeFields);
        } else {
            query = query
                .populate('google_connections')
                .populate('notion_connections')
                .populate('discord_connections')
                .populate('telegram_connections');
        }

        const user = await query.exec();

        if (!user) throw new Error("User not found");

        return user;
    } catch (error) {
        console.error("Error fetching user pipeline:", error);
        return null;
    }
};


const getUserWithSpecificConnection = async (userId: string, email: string, provider: Provider) => {
    try {
        const populateField = `${provider}_connections`;

        const user = await User.findOne({ _id: userId, email: email })
            // .select(`email name ${populateField}`) // Only grab the needed fields
            .populate(populateField)
            .exec();

        return user;
    } catch (error) {
        console.error(`Error fetching user ${provider} pipeline:`, error);
        return null;
    }
}

export { getUserWithAllConnections, getUserWithSpecificConnection };
