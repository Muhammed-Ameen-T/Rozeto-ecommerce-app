import mongoose from "mongoose";
const { Schema } = mongoose;

const couponSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true
    },
    expireOn: {
        type: Date,
        required: true
    },
    offerPrice: {
        type: Number,
        required: true
    },
    minimumPrice: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['Active', 'Inactive', 'Expired'],
        default: 'Active'
    },
    usedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }]
}, {
    timestamps: true
});

const Coupon = mongoose.model("Coupon", couponSchema);
export default Coupon;
