import User from '../../model/categorySchema.js';
import Category from '../../model/categorySchema.js';
import Product from '../../model/productSchema.js';
import Coupon from '../../model/couponSchema.js';
import { successResponse, errorResponse } from '../../helper/responseHandler.js';
import cron from 'node-cron';

export const loadCouponPage = async (req, res) => {
    try {
        let search = req.query.search || "";
        const page = parseInt(req.query.page) || 1;
        const limit = 5;
        const skip = (page - 1) * limit;
        const coupons = await Coupon.find({ code: { $regex: ".*" + search + ".*", $options: "i" } })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        const totalCoupons = await Coupon.countDocuments({ code: { $regex: ".*" + search + ".*", $options: "i" } });
        const totalPages = Math.ceil(totalCoupons / limit);

        res.render('coupon/couponList', {
            coupons,
            currentPage: page,
            totalPages,
            totalCoupons,
            limit
        });
    } catch (error) {
        console.error('Error loading coupon listing page:', error);
        res.redirect("/admin/pageError");
    }
};

export const addCoupon = async (req, res) => {
    try {
        const { code, expireOn, usageLimit, offerPrice, minimumPrice } = req.body;
        
        // Ensure the expiry date is parsed correctly and compared with today's date
        const today = new Date().setHours(0, 0, 0, 0); // Sets the current date to start of the day
        const expiryDate = new Date(expireOn).setHours(0, 0, 0, 0); // Sets expiry date to start of the day

        const status = expiryDate <= today ? 'Expired' : 'Active';

        const existingCoupon = await Coupon.findOne({ code }); 
        if (existingCoupon) { 
            return res.status(400).send('Coupon code already exists.'); 
        }

        const newCoupon = new Coupon({
            code,
            expireOn,
            usageLimit,
            offerPrice,
            minimumPrice,
            status
        });

        await newCoupon.save();
        res.redirect('/admin/coupon');
    } catch (error) {
        console.error('Error adding coupon:', error);
        res.redirect("/admin/pageError");
    }
};


export const toggleCoupon = async (req, res) => {
    try {
        const { couponId } = req.params;

        const coupon = await Coupon.findById(couponId);
        if (!coupon) {
            return res.status(404).send('Coupon not Found');
        }
        
        // Toggle between 'Active' and 'Inactive'
        coupon.status = coupon.status === 'Active' ? 'Inactive' : 'Active';
        await coupon.save();
        successResponse(res, {}, `Coupon has been ${coupon.status}`);
    } catch (error) {
        console.error('Error toggling coupon status:', error);
        res.redirect("/admin/pageError");
    }
};

const updateExpiredCoupons = async () => {
    try {
        const today = new Date().setHours(0, 0, 0, 0);
        await Coupon.updateMany({ expireOn: { $lte: today }, status: 'Active' }, { status: 'Expired' });
    } catch (error) {
        console.error('Error updating expired coupons:', error);
    }
};

// Schedule to update expired coupons daily at midnight
cron.schedule('0 0 * * *', updateExpiredCoupons);

// Initial call to update expired coupons
updateExpiredCoupons();
