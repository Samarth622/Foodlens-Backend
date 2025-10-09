import mongoose from "mongoose";

const tempUserSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Please add a name'],
        },
        email: {
            type: String,
            required: [true, 'Please add an email'],
            unique: true,
        },
        password: {
            type: String,
            required: [true, 'Please add a password'],
        },
        gender: {
            type: String,
            required: [true, 'Please specify a gender'],
            enum: ['male', 'female', 'other'],
        },
        otp: {
            type: String,
            required: true,
        },
        expireAt: {
            type: Date,
            default: Date.now,
            index: { expires: '10m' },
        },
    },
    {
        timestamps: true, 
    }
);

export default mongoose.model('TempUser', tempUserSchema);