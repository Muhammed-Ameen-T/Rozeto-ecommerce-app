import mongoose from "mongoose";
const {Schema} = mongoose;

const addressSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    addressType: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    locality: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true
    },
    landMark: {
        type: String,
    },
    state: {
        type: String,
        required: true
    },
    pincode: {
        type: Number,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    altPhone: {
        type: String
    },  
    isActive: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

const Address = mongoose.model('Address', addressSchema);
export default Address;