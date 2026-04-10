import mongoose from "mongoose";

const connectDb = async () => {
    try {
        // 1. Move inside the function to ensure env vars are injected
        const URI: string | undefined = process.env.MONGODB_URL;
        
        if (!URI) {
            throw new Error("MONGODB_URL is completely missing from K8s secrets!");
        }

        // 2. Add a 15-second buffer for K8s networking
        await mongoose.connect(URI, {
            serverSelectionTimeoutMS: 15000, 
        });
        
        console.log("Connection To Database is successful");
    }
    catch (error: any) {
        // 3. Log the ACTUAL error so we know why it's failing
        console.error("Database connection failed. Reason:", error.message);
        
        // 4. Exit with Code 1 so Kubernetes knows this was a crash!
        process.exit(1); 
    }
}

export default connectDb;
