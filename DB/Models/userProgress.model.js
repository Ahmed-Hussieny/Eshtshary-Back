import mongoose from "mongoose";

const userProgressSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    videoId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Video',
        required: true
    },
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    progress: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    completed: {
        type: Boolean,
        default: false
    },
    quizScore: {
        type: Number,
        default: 0
    },
    quizPassed: {
        type: Boolean,
        default: false
    },
    order: {
        type: Number,
        default: 0
    },
    lastWatchedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Compound index to ensure one progress record per user per video
userProgressSchema.index({ userId: 1, videoId: 1 }, { unique: true });

const UserProgress = mongoose.model('UserProgress', userProgressSchema);

export default UserProgress;