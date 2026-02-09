import mongoose, { Schema, model, models } from 'mongoose';

const UserSchema = new Schema({
    socketId: {
        type: String,
        required: true,
        index: true,
    },
    name: {
        type: String,
        required: [true, 'Please provide a name'],
        maxlength: [20, 'Name cannot be more than 20 characters'],
    },
    avatarUrl: {
        type: String,
        default: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix', // Default avatar
    },
    stats: {
        gamesPlayed: { type: Number, default: 0 },
        wins: { type: Number, default: 0 },
    },
}, { timestamps: true });

export default models.User || model('User', UserSchema);
