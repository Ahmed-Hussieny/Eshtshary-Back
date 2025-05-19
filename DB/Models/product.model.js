import mongoose, { model, Schema } from "mongoose";

const productSchema = new Schema({
    //* strings
    title:{
        type: String,
        required: true,
        trim: true
    },
    description:{
        type: String
    },
    slug:{
        type: String,
        required: true,
        trim: true
    },
    //* numbers
    priceEg:{
        type: Number,
        required: true
    },
    priceUsd:{
        type: Number,
        required: true
    },
    stock:{
        type: Number,
        required: true,
        default: 0,
        min:0
    },
    rate:{
        type: Number,
        default: 5,
        min:0,
        max:5
    },
    category:{
        type: String,
        required: true
    },
    //* arrays
    images:[{
        type: String,
        required: true
    }]
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
})

const Product = mongoose.models.Product || model('Product', productSchema);
export default Product;