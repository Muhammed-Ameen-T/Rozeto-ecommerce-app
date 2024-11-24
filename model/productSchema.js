import mongoose from "mongoose";
const {Schema} = mongoose;


const productSchema = new mongoose.Schema({
    productName: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true,
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        required: true,
    },
    variations: [
        {
            size: {
                type: String,
                enum: ["S", "M", "L"],
                required: true,
            },
            regularPrice: {
                type: Number,
                required: true,
            },
            salePrice: {
                type: Number,
                required: true,
            },
            quantity: {
                type: Number,
                required: true,
            }
        }
    ],
    productImages: {
        type: [String],
        required: true,
    },
    isBlocked: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ["Available", "Out of Stock", "Discontinued"],
        required: true,
        default: "Available"
    },
    offerPercentage:{
        type:Number,
        default:0
    },
    rating: {
        type: Number,
        default: 0,
    },
    reviews: [
        {
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
                required: true,
            },
            rating: {
                type: Number,
                required: true,
            },
            comment: {
                type: String,
                required: true,
            },
            createdAt: {
                type: Date,
                default: Date.now,
            },
        },
    ], 
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);
export default Product;