import mongoose from "mongoose";

export const connectDB = async () => {
  await  mongoose.connect(process.env.MONGO_DB_URL)
    try {
       console.log("DB connected ")
    } catch (error) {
       console.log(error);
       
    }
}

