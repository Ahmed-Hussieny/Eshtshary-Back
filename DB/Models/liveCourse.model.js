import mongoose, { model, Schema } from "mongoose";

const liveCourseSchema = new Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    image: {
        type: String,
        required: true,
    },
    priceEGP: {
        type: Number,
        required: true,
    },
    priceUSD: {
        type: Number,
        required: true,
    },
    sessions:[
        {
            title: {
                type: String,
                required: true,
            },
            description: {
                type: String,
                required: true,
            },
            date: {
                type: Date,
                required: true,
            },
            time: {
                type: String,
                required: true,
            },
            link: {
                type: String,
                default: "",
            },
        }
    ],
    enrolledUsers: [
        {
            type: Schema.Types.ObjectId,
            ref: "User",
        }
    ],
    enrolledUsersCount: {
        type: Number,
        default: 0,
    },
}, {
    timestamps: true,
});

const LiveCourse = mongoose.models.LiveCourse || model("LiveCourse", liveCourseSchema);
export default LiveCourse;