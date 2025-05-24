import mongoose, { Schema, model } from "mongoose";

const testSchema = new Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    image: { type: String, required: true },
    time: { type: String, required: true },
    type: { type: String, required: true },
    questions: [{
        question: { type: String, required: true },
        options: [{
            option: { type: String, required: true },
            points: { type: Number, required: true }
        }]
    }],
    results: [{
        from: { type: Number, required: true },
        to: { type: Number, required: true },
        description: { type: String, required: true },
    }],
    totalPoints: { type: Number, required: true },
},{
    timestamps: true
});

const Test = mongoose.models.Test || model("Test", testSchema);

export default Test;