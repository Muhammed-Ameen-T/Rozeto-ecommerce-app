import mongoose from "mongoose";
import env from "dotenv";
env.config()

const connectDB =  async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI)
        console.log("DB Connected");
    } catch (error) {
        console.log(error)
        process.exit(1);
    }
}

export default connectDB;
