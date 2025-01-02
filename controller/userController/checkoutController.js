import Cart from '../../model/cartSchema.js'
import Product from '../../model/productSchema.js'
import User from '../../model/userSchema.js'
import Address from '../../model/addressSchema.js'
import Order from '../../model/orderSchema.js'
import Coupon from '../../model/couponSchema.js'
import Wallet from '../../model/walletSchema.js'
import { successResponse, errorResponse } from '../../helper/responseHandler.js'
import env from 'dotenv';
import Razorpay from 'razorpay'
import shortid from 'shortid';
env.config();
const razorpay =  new Razorpay({
    key_id: process.env.RAZORPAY_ID_KEY,
    key_secret: process.env.RAZORPAY_SECRET_KEY 
});



export const loadCheckout = async (req, res) => {
    try {
        if (req.session.user) {
            const userId = req.session.user;

            const addresses = await Address.find({ userId: userId });
            const cart = await Cart.findOne({ userId: userId })
                .populate({
                    path: 'products.productId',
                    populate: { path: 'category' }
                });

            if (!cart) {
                return res.render('checkout', { products: [], addresses: addresses || [] });
            }

            let totalOfferDiscount = 0;
            const products = cart.products.map(item => {
                const product = item.productId;
                const offerDiscount = (product.offerPercentage * product.salePrice / 100) * item.quantity;
                totalOfferDiscount += offerDiscount;

                return {
                    _id: item._id,
                    productId: item.productId._id,
                    productName: product.productName,
                    salePrice: product.salePrice,
                    quantity: item.quantity,
                    totalPrice: item.totalPrice,
                    productImages: product.productImages,
                    stock: product.quantity,
                    offerDiscount: offerDiscount
                };
            });

            const subtotal = cart.products.reduce((sum, item) => sum + (item.quantity * item.price), 0) - totalOfferDiscount;
            const tax = (subtotal * 10) / 100;
            let grandTotal = subtotal + tax;
            let discountApplied = false;
            let couponDiscount = 0;

            // Check if there is a coupon in the session
            if (req.session.coupon) {
                const { code, discount } = req.session.coupon;
                couponDiscount = discount;
                grandTotal -= couponDiscount;
                discountApplied = true;
            }

            const wallet = await Wallet.findOne({ userId: userId });
            const walletBalance = wallet ? wallet.balance : 0;

            const coupons = await Coupon.find({
                expireOn: { $gte: new Date() },
                status: 'Active',
                usedBy: { $ne: userId }
            });

            res.render('checkout', {
                userId,
                products,
                cart,
                tax,
                subtotal,
                grandTotal,
                addresses: addresses || [],
                totalOfferDiscount,
                discountApplied,
                walletBalance,
                couponDiscount,
                coupons
            });
        } else {
            res.redirect('/login');
        }
    } catch (error) {
        console.log('Error while loading Checkout Page', error);
        res.redirect('/pagenotfound');
    }
};

export const validateCoupon = async (req, res) => {
    try {
        const { couponCode, userId, cartTotal } = req.body;

        if (req.session.coupon) { 
            return res.json({ isValid: false, errorMessage: 'Already Applied a Coupon! If you want Apply new Coupon Remove Existing One.' });
        }

        const today = new Date();

        if (!userId) {
            return res.status(400).json({ isValid: false, errorMessage: 'User ID is missing' });
        }

        if (!cartTotal || cartTotal <= 0) {
            return res.status(400).json({ isValid: false, errorMessage: 'Invalid cart total' });
        }

        const coupon = await Coupon.findOne({
            code: couponCode,
            expireOn: { $gte: today },
            status: 'Active',
            usedBy: { $ne: userId }
        });

        if (!coupon) {
            return res.json({ isValid: false, errorMessage: 'Invalid or expired coupon' });
        }

        if (cartTotal < coupon.minimumPrice) {
            return res.json({ isValid: false, errorMessage: 'Cart total is less than Minimum Purchase' });
        }

        // Save the coupon discount amount
        const couponDiscount = coupon.offerPrice;

        // Add user to usedBy array
        coupon.usedBy.push(userId);
        await coupon.save();

        // Store coupon details in session
        if (!req.session.coupon) {
            req.session.coupon = {};
        }
        req.session.coupon = {
            code: couponCode,
            discount: couponDiscount
        };

        res.json({ isValid: true, coupon, couponDiscount: couponDiscount });
    } catch (error) {
        console.error('Error validating coupon:', error);
        res.status(500).json({ isValid: false, errorMessage: 'Internal server error' });
    }
};


export const removeCoupon = async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ success: false, errorMessage: 'User ID is missing' });
        }

        // Ensure the coupon details exist in the session
        if (!req.session.coupon || !req.session.coupon.code) {
            return res.status(400).json({ success: false, errorMessage: 'No coupon applied' });
        }

        const { code } = req.session.coupon;

        // Remove the userId from the usedBy field in the coupon document
        const result = await Coupon.updateOne(
            { code },
            { $pull: { usedBy: userId } }
        );

        if (result.nModified === 0) {
            return res.status(400).json({ success: false, errorMessage: 'Coupon not found or user ID not in usedBy array' });
        }

        // Clear the coupon details from the session
        req.session.coupon = null;

        res.json({ success: true });
    } catch (error) {
        console.error('Error removing coupon:', error);
        res.status(500).json({ success: false, errorMessage: 'Internal server error' });
    }
};



export const placeOrder = async (req, res) => {
    try {
        const {
            orderedItems,
            subtotal,
            tax,
            totalPrice,
            selectedAddressId,
            paymentMethod,
            discount
        } = req.body;

        // Ensure userId is retrieved from session
        const userId = req.session.user;
        if (!userId) {
            return res.status(400).json({ error: 'User not logged in' });
        }

        // Check address validity
        const address = await Address.findById(selectedAddressId);
        if (!address) {
            return res.status(404).json({ error: 'Address not found' });
        }

        // Validate stock for each ordered item
        for (let item of orderedItems) {
            const product = await Product.findById(item.productId);
            if (!product) {
                return res.status(404).json({ error: `Product with ID ${item.productId} not found` });
            }
            if (item.quantity > product.quantity) {
                return res.status(400).json({ error: `Insufficient stock for product: ${product.productName}` });
            }
        }

        // Determine if a coupon is applied and set related fields
        const couponDiscount = req.session.coupon ? req.session.coupon.discount : 0;
        const couponApplied = !!req.session.coupon;

        const products = await Product.find({ '_id': { $in: orderedItems.map(item => item.productId) } });
        // Calculate the total discount
        let totalDiscount = 0;
        let offerDiscount = 0;
        const orderProducts = orderedItems.map(item => {
            const product = products.find(p => p._id.toString() === item.productId);
            const productDiscount = (product.regularPrice - product.salePrice) * item.quantity;
            totalDiscount += productDiscount;
            const offerDiscounts = (product.offerPercentage * product.salePrice / 100) * item.quantity;
            offerDiscount+=offerDiscounts

            return {
                productId: item.productId,
                quantity: item.quantity,
                price: item.price
            };
        });

        const newOrder = new Order({
            userId: userId,
            orderedItems: orderedItems.map(item => ({
                product: item.productId,
                quantity: item.quantity,
                price: item.price,
            })),
            subtotal: subtotal,
            tax: tax,
            finalAmount: totalPrice,
            address: {
                addressType: address.addressType,
                name: address.name,
                locality: address.locality,
                city: address.city,
                landMark: address.landMark,
                state: address.state,
                pincode: address.pincode,
                phone: address.phone,
                altPhone: address.altPhone
            },
            paymentMethod,
            orderStatus: 'Processing',
            couponApplied: couponApplied,
            couponDiscount: couponDiscount,
            discount: totalDiscount,
            offerDiscount: offerDiscount,
            paymentStatus: paymentMethod === 'Wallet' ? 'Paid' : 'Pending' // Set initial payment status
        });

        await newOrder.save();

        if (paymentMethod === 'Wallet') {
            let wallet = await Wallet.findOne({ userId: userId });
            wallet.balance -= newOrder.finalAmount;
            wallet.transactions.push({
                amount: newOrder.finalAmount,
                type: 'debit',
                orderId: newOrder._id,
                description: `Purchase Products for order ID: ${newOrder.orderId}`
            });
            await wallet.save();
        }

        for (let item of orderedItems) {
            // Decrease the product quantity
            const updatedProduct = await Product.findByIdAndUpdate(
                item.productId,
                {
                    $inc: {
                        quantity: -item.quantity,
                        orderCount: item.quantity
                    }
                },
                { new: true }
            );

            if (updatedProduct.quantity <= 0) {
                await Product.findByIdAndUpdate(
                    item.productId,
                    { status: 'Out of Stock' }
                );
            }
        }

        // Clear the coupon session data
        delete req.session.coupon;
        await Cart.deleteOne({ userId: userId });

        // Send the order ID for order success page redirection
        res.status(201).json({
            success: true,
            message: 'Order placed successfully',
            orderId: newOrder._id
        });
    } catch (error) {
        console.error('Error placing order:', error);
        res.status(500).json({ error: 'Failed to place order' });
    }
};



export const orderSucess = async (req, res) => {
    try {
        const orderId = req.query.orderId;
        const order = await Order.findOne({ _id: orderId })
        if (!order) {
            throw new Error('Order not found');
        }
        res.render('order/orderSucess', { order,orderId });
    } catch (error) {
        console.error('Error while loading order success page', error);
        res.redirect("/pagenotfound");
    }
};



const PAYMENT_STATUS = {
    PENDING: 'Pending',
    PAID: 'Paid',
    FAILED: 'Failed',
};

const findOrderById = async (orderId) => {
    const order = await Order.findById(orderId);
    if (!order) {
        throw new Error('Order not found');
    }
    return order;
};

export const createRazorpayOrder = async (req, res) => {
    try {
        const { totalPrice, orderId } = req.body;
        const orderOptions = {
            amount: Math.round(totalPrice * 100), // Amount in paise
            currency: 'INR',
            payment_capture: 1,
        };

        const razorpayOrder = await razorpay.orders.create(orderOptions);

        const order = await findOrderById(orderId);
        order.razorpayOrderId = razorpayOrder.id;
        order.paymentStatus = PAYMENT_STATUS.PENDING;
        await order.save();

        res.status(200).json({
            success: true,
            order: razorpayOrder,
            key_id: process.env.RAZORPAY_KEY_ID,
            user: req.session.userName,
        });
    } catch (error) {
        console.error('Error creating Razorpay order:', error.message);
        res.status(500).json({
            success: false,
            message: `Failed to create Razorpay order: ${error.message}`,
        });
    }
};

export const handlePaymentSuccess = async (req, res) => {
    try {
        const { paymentId, razorpayOrderId, orderId } = req.body;
        const order = await findOrderById(orderId);

        order.paymentStatus = PAYMENT_STATUS.PAID;
        order.razorpay = {
            paymentId,
            orderId: razorpayOrderId,
        };

        await order.save();

        res.status(200).json({
            success: true,
            message: 'Order placed successfully',
            orderId: order._id,
        });
    } catch (error) {
        console.error('Error handling payment success:', error.message);
        res.status(500).json({
            success: false,
            message: `Failed to process payment: ${error.message}`,
        });
    }
};

export const handlePaymentFailure = async (req, res) => {
    try {
        const { orderId } = req.body;
        if (!orderId) {
            return res.status(400).json({
                success: false,
                message: 'Order ID is required'
            });
        }

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        order.paymentStatus = 'Pending';
        order.razorpay.paymentId= 'Nill'
        await order.save();

        res.status(200).json({
            success: true,
            message: 'Order placed but payment failed. Please try again.',
            orderId: order._id,
        });
    } catch (error) {
        console.error('Error handling payment failure:', error.message);
        res.status(500).json({
            success: false,
            message: `Failed to update payment status: ${error.message}`
        });
    }
};


export const retryPayment = async (req, res) => {
    try {
        const { orderId } = req.body;
        if (!orderId) {
            console.error('Order ID is required for retrying payment');
            return res.status(400).json({
                success: false,
                message: 'Order ID is required'
            });
        }

        const order = await Order.findById(orderId);
        if (!order) {
            console.error(`Order with ID ${orderId} not found`);
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        const orderOptions = {
            amount: Math.round(order.finalAmount * 100), // Amount in paise
            currency: 'INR',
            payment_capture: 1,
        };

        const razorpayOrder = await razorpay.orders.create(orderOptions);
        if (!razorpayOrder) {
            console.error('Failed to create Razorpay order');
            return res.status(500).json({
                success: false,
                message: 'Failed to create Razorpay order'
            });
        }

        order.razorpayOrderId = razorpayOrder.id;
        order.paymentStatus = 'Pending';
        await order.save();

        res.status(200).json({
            success: true,
            order: razorpayOrder,
            key_id: process.env.RAZORPAY_KEY_ID,
            user: req.session.userName,
        });
    } catch (error) {
        console.error('Error retrying payment:', error.message);
        res.status(500).json({
            success: false,
            message: `Failed to retry payment: ${error.message}`,
        });
    }
};

