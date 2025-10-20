import mongoose from "mongoose";
const {Schema} = mongoose;
import crypto from 'crypto';



const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    }, 
    email: {
        type: String,
        required: true,
        unique: true
    },
    phone: {
        type: String,
        required: false,
        unique: false,
        sparse: true,
        default: null
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true,
    },
    password: {
        type: String,
        required: false
    },
    isBlocked: {
        type: Boolean,
        default: false
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    referralCode:{
        type:String,
        unique: true,
    },
    referredBy: {
        type: String 
    }
}, {timestamps:true});

// Function to generate referral code
function generateReferralCode(name) {
    const prefix = name.substring(0, 4).toUpperCase(); 
    const uniqueId = crypto.randomBytes(2).toString('hex'); 
    return `${prefix}${uniqueId}`;
}

// Pre-save middleware to set referral code
userSchema.pre('save', function (next) {
    if (!this.referralCode) {
        this.referralCode = generateReferralCode(this.name);
    }
    next();
});

const User = mongoose.model('User', userSchema);
export default User;