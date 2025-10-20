import mongoose from "mongoose";
import { v4 as uuidv4 } from 'uuid';
const { Schema } = mongoose; // Destructuring Schema from mongoose

// ... rest of your code
const generateOrderId = () => {
    const uuid = uuidv4().replace(/[^0-9]/g, '').slice(0, 16);
    return `#OD${uuid}`;
}

const orderSchema = new mongoose.Schema({
    orderId: {
        type: String,
        default: generateOrderId,
        unique: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    orderedItems: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true
        },
        quantity: {
            type: Number,
            required: true
        },
        price: {
            type: Number,
            default: 0
        },
        status: { 
            type: String, required: true, 
            default: 'Processing', 
            enum: ['Processing', 'Cancelled', 'Return Request', 'Returned'] 
        }, 
        requestReason: { 
            type: String 
        }
    }],
    subtotal: {
        type: Number,
        required: true
    },
    tax: {
        type: Number,
        required: true
    },
    discount: {
        type: Number,
        default: 0
    },
    finalAmount: {
        type: Number,
        required: true
    },
    address: {
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
        }
    },
    paymentMethod: {
        type: String,
        enum: ['COD', 'Wallet', 'Card', 'RazorPay'],
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ['Paid', 'Pending'],
        default: 'Pending'
    },
    razorpay: {
        paymentId: { 
            type: String,
            default: 'Nill'
        },
        orderId: { type: String }
    },
    orderStatus: {
        type: String,
        required: true,
        default: 'Processing',
        enum: ['Processing', 'Collected', 'Delivered', 'Cancelled', 'Return Request', 'Returned']
    },
    couponApplied: {
        type: Boolean,
        default: false
    },
    couponDiscount:{
        type: Number,
        required: false
    },
    offerDiscount:{
        type: Number,
        required: false
    },
    orderReason:{
        type:String
    },
    

}, { timestamps: true })



const Order = mongoose.model("Order", orderSchema)
export default Order