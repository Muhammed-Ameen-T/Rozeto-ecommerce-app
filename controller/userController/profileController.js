import express from 'express';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import User from '../../model/userSchema.js'
import Order from '../../model/orderSchema.js'
import addressSchema from '../../model/addressSchema.js'
import { successResponse, errorResponse } from '../../utils/helper/responseHandler.js'
import {HttpResCode} from '../../utils/constants/httpResponseCode.utils.js'
import env from 'dotenv';
import bcrypt from 'bcryptjs';


export const loadUserProfile = async (req,res) => {
    try {
        const userId = req.session.user
        const user = await User.findOne({ _id: userId })
        const orders = await Order.find({ userId }).sort({ createdAt: -1 }).populate('orderedItems.product')
        if (user) {            
            const addresses = await addressSchema.find({ userId: user._id })
            res.render('profile/index', { user ,userId,orders,addresses: addresses ? addresses : []}); 
        } else {
            res.redirect('/login')
        }
    } catch (error) {
        res.redirect('/pagenotfound')
        console.log(error)
    }
}

export const loadUserOrders = async (req,res) => {
    try {
        const userId = req.session.user
        const user = await User.findOne({ _id: userId })
        const orders = await Order.find({ userId }).sort({ createdAt: -1 }).populate('orderedItems.product')
        if (user) {            
            const addresses = await addressSchema.find({ userId: user._id })
            res.render('profile/orders', { user ,userId,orders,addresses: addresses ? addresses : []}); 
        } else {
            res.redirect('/login')
        }
    } catch (error) {
        res.redirect('/pagenotfound')
        console.log(error)
    }
}

export const loadUserAddress = async (req,res) => {
    try {
        const userId = req.session.user
        const user = await User.findOne({ _id: userId })
        const orders = await Order.find({ userId }).sort({ createdAt: -1 }).populate('orderedItems.product')
        if (user) {            
            const addresses = await addressSchema.find({ userId: user._id })
            res.render('profile/addresses', { user ,userId,orders,addresses: addresses ? addresses : []}); 
        } else {
            res.redirect('/login')
        }
    } catch (error) {
        res.redirect('/pagenotfound')
        console.log(error)
    }
}

export const loadUserChange = async (req,res) => {
    try {
        const userId = req.session.user
        const user = await User.findOne({ _id: userId })
        const orders = await Order.find({ userId }).sort({ createdAt: -1 }).populate('orderedItems.product')
        if (user) {            
            const addresses = await addressSchema.find({ userId: user._id })
            res.render('profile/changePassword', { user ,userId,orders,addresses: addresses ? addresses : []}); 
        } else {
            res.redirect('/login')
        }
    } catch (error) {
        res.redirect('/pagenotfound')
        console.log(error)
    }
}

export const editUserProfile = async (req, res) => {
    try {
        const userId = req.params.id;
        const { name, phone } = req.body;
        const existingUser = await User.findOne({ name: name, _id: { $ne: userId } });
        if (existingUser) {
            return res.status(HttpResCode.BAD_REQUEST).json({ error: 'Username is already taken.' });
        }
        await User.findByIdAndUpdate(userId, { name: name, phone: phone });
        req.session.userName = name;
        res.status(200).json({ message: 'Profile updated successfully.' });
    } catch (error) {
        console.error('Error updating user profile:', error);
        res.status(500).json({ error: 'Server Error' });
    }
};

export const resetPassword = async(req,res)=>{
    const { currentPassword, newPassword } = req.body;
    try {
        const user = await User.findById(req.session.user);
        if (!user) {
            return errorResponse(res, {}, 'User not found', HttpResCode.NOT_FOUND);
        }
    
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return errorResponse(res, {}, 'Current password is incorrect', HttpResCode.BAD_REQUEST);
        }
    
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedNewPassword;
        await user.save();
        return successResponse(res, {}, 'Password updated successfully');
    } catch (error) {
        console.log(error, 'Error while resetting password');
        res.redirect('/pagenotfound');
    }    
}

export const addAddress = async (req, res) => {
    try {
        const { addressType, name, phone, altPhone, locality, city, state, pincode, landMark, isActive } = req.body;
        const userId = req.params.id;

        if (isActive) {
            await addressSchema.updateMany({ userId }, { $set: { isActive: false } });
        }

        const newAddress = new addressSchema({
            userId,
            addressType,
            name,
            phone,
            altPhone,
            locality,
            city,
            state,
            pincode,
            landMark,
            isActive: isActive ? true : false
        });

        await newAddress.save();
        return successResponse(res, {}, 'Address added successfully!');
    } catch (error) {
        console.error('Error adding address:', error);  // Detailed logging
        return res.status(500).json({ message: 'An unexpected error occurred. Please try again later.' });
    }
};




export const loadEditAddressPage = async (req, res) => {
    try {
        const addressId = req.query.id;
        const address = await addressSchema.findById(addressId);
        if (!address) {
            return res.status(HttpResCode.NOT_FOUND).send('Address not found');
        }
        res.render('profile/editAddress', { address });
    } catch (error) {
        console.error("Error loading edit address page:", error);
        res.redirect('/pageNotfound');
    }
};

export const editAddress = async (req, res) => {
    try {
        const addressId = req.params.id;
        const userId = req.session.user;
        const { addressType, name, city, landMark, locality, state, pincode, phone, altPhone, isActive } = req.body;
        const updatedData = {
            addressType,
            name,
            city,
            landMark,
            locality,
            state,
            pincode,
            phone,
            altPhone,
            isActive: isActive ? true : false
        };
        console.log('new Data', updatedData)
        if (updatedData.isActive) {
            await addressSchema.updateMany({ userId: userId, _id: { $ne: addressId } }, { isActive: false });
        }
        const updatedAddress = await addressSchema.findByIdAndUpdate(addressId, updatedData, { new: true });
        if (!updatedAddress) {
            return res.status(HttpResCode.NOT_FOUND).send('Address not found');
        }
        return successResponse(res, {}, 'Address updated successfully!')
    } catch (error) {
        console.error("Error updating address:", error);
        res.redirect('/pagenotfound');
    }
};


export const deleteAddress = async (req, res) => {
    try {
        const addressId = req.params.id;
        const userId = req.session.user;
        const deletedAddress = await addressSchema.findOneAndDelete({ _id: addressId, userId: userId });
        if (!deletedAddress) {
            return res.status(HttpResCode.NOT_FOUND).json({ error: 'Address not found or you do not have permission to delete this address' });
        }
        res.status(200).json({ message: 'Address deleted successfully' });
    } catch (error) {
        console.error("Error deleting address:", error);
        res.redirect('/pagenotfound');
    }
}
