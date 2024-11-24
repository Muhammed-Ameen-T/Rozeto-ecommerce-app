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
        size: {
            type: String,
            enum: ["S", "M", "L"],
            required: true,
        },
        price: {
            type: Number,
            default: 0
        },
        variationID: {
            type: String,
            required: true
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
            required: true
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
        paymentId: { type: String },
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
    // couponId: {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: "Coupon",
    // },
    couponDiscount:{
        type: Number,
        required: false
    },
    expectedDeliveryDate: {
        type: Date, 
    }
}, { timestamps: true })

orderSchema.pre('save', function (next) {
    const deliveryDays = 7; 
    if (!this.expectedDeliveryDate) {
        this.expectedDeliveryDate = new Date(this.createdAt.getTime() + deliveryDays * 24 * 60 * 60 * 1000);
    }
    next();
});

const Order = mongoose.model("Order", orderSchema)
export default Order