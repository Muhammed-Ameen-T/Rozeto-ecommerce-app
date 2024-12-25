import mongoose from "mongoose";
const {Schema} = mongoose;

const walletSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    balance: {
        type: Number,
        required: true,
        default: 0,
    },
    transactions: [
        {
            amount: {
                type: Number,
                required: true
            },
            type: {
                type: String,
                enum: ['credit', 'debit'],
                required: true
            },
            description: {
                type: String
            },
            orderId:{
                type:mongoose.Schema.Types.ObjectId,
                ref:'Order',
                required:false
            },
            createdAt: {
                type: Date,
                default: Date.now
            }
        }
    ]
}, { timestamps: true });

const Wallet = mongoose.model('Wallet', walletSchema)
export default Wallet