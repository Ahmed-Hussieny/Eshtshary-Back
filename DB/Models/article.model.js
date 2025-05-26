import mongoose from "mongoose";
import { model, Schema } from "mongoose";

const articleSchema = new Schema({
    title: {
        type: String,
        required: true,
        unique: true,
    },
    content: {
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
    link: {
        type: String
    },
}, {
    timestamps: true
});

const Article = mongoose.models.Article || model('Article', articleSchema);
export default Article;