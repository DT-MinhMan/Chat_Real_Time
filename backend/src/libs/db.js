import mongoose from 'mongoose';


//Kết nối với mongoDB bằng mongoose
export const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_CONNECTIONSTRING
);
        console.log("Connect to mongoDB successfully");
    } catch (error) {
        console.log("Error when try to connect mongoDB", error);
        process.exit(1);
    }
}