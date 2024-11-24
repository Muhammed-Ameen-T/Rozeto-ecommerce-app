import mongoose from "mongoose";
const {Schema} = mongoose;

const ProductOfferSchema = new mongoose.Schema({
    offerName: {
        type: String,
        required: true
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    productName: {
        type: String
    },
    offerPercentage: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });


const categoryOfferSchema = new mongoose.Schema({
    offerName: {
        type: String,
        required: true
    },
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        required: true,
    },
    categoryName: {
        type: String,
        required: true
    },
    offerPercentage: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });


const ProductOffer = mongoose.model('ProductOffer', ProductOfferSchema);
const CategoryOffer = mongoose.model('CategoryOffer', categoryOfferSchema);


export default { ProductOffer, CategoryOffer };

