const mongoose = require("mongoose");

URI = process.env.MONGODB_URL;

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

module.exports = connectDb;