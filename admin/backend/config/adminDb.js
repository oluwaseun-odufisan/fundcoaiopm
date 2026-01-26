import mongoose from 'mongoose';

export const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB connected successfully for admin backend');
    } catch (err) {
        console.error('MongoDB connection error:', err.message);
        process.exit(1);
    }
};