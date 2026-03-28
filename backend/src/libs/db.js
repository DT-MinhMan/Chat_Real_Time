import mongoose from 'mongoose';


//Kết nối với mongoDB bằng mongoose
export const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGODB_CONNECTIONSTRING;

        if (!mongoUri) {
            throw new Error("MONGODB_CONNECTIONSTRING is missing");
        }

        await mongoose.connect(mongoUri);
        console.log("Connect to mongoDB successfully");
    } catch (error) {
        console.log("Error when try to connect mongoDB", error);
        process.exit(1);
    }
}
