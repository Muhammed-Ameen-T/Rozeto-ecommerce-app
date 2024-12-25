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
    regularPrice: {
        type: Number,
        required: false,
    },
    salePrice: {
        type: Number,
        required: false,
    },
    quantity: {
        type: Number,
        required: false,
    },
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
    orderCount: {
        type: Number,
        default: 0 
    }
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);
export default Product;









