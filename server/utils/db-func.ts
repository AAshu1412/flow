import {User} from "../models/user-model";
import { Provider } from "../types/user-type";

const getUserWithAllConnections = async (userId: string) => {
    try {
        const user = await User.findById(userId)
            .populate('google_connections')
            .populate('notion_connections')
            .populate('discord_connections')
            .populate('telegram_connections')
            .exec(); // Execute the query

        if (!user) throw new Error("User not found");
        
        return user;
    } catch (error) {
        console.error("Error fetching user pipeline:", error);
        return null;
    }
};

const getUserWithSpecificConnection = async (userId: string, email:string, provider: Provider) => {
    try {
        const populateField = `${provider}_connections`;
        
        const user = await User.findOne({_id:userId, email:email})
            // .select(`email name ${populateField}`) // Only grab the needed fields
            .populate(populateField)
            .exec();

        return user;
    } catch (error) {
        console.error(`Error fetching user ${provider} pipeline:`, error);
        return null;
    }
}

export {getUserWithAllConnections, getUserWithSpecificConnection};
