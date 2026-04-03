import mongoose from "mongoose";

const URI: string = process.env.MONGODB_URL as string;

const connectDb = async () => {
    try {
        await mongoose.connect(URI);
        console.log("Connection To Database is successful");
    }
    catch (error) {
        console.error("database connection failed");
        process.exit(0);

    }
}

export default connectDb;