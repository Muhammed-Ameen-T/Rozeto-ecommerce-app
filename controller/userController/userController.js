import express from 'express';
import nodemailer from 'nodemailer';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import env from 'dotenv';
import User from '../../model/userSchema.js'
import Product  from '../../model/productSchema.js'
import Wishlist  from '../../model/wishlistSchema.js'
import Cart from'../../model/cartSchema.js'
import Category from '../../model/categorySchema.js'
import Wallet from '../../model/walletSchema.js'
import Order from '../../model/orderSchema.js'
import {ProductOffer,CategoryOffer} from '../../model/offerSchema.js'
import bcrypt from 'bcryptjs';
import { successResponse, errorResponse } from '../../helper/responseHandler.js'
import session from 'express-session';
import { ifError } from 'assert';
env.config();

export const loadLogin = async (req, res) => {
    try {
        res.render('login');
    } catch (error) {
        console.error(error);
errorResponse({},)    }
};

export const loadSignup = async (req, res) => {
    try {
        if(!req.session.user&&!req.isAuthenticated()){
            console.log('signup loaded')   
            return res.render('userSignup');
        }else{
            res.redirect('/')
        }
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal server error");
    }
};

export const loadHome = async (req, res) => {
    try {
        const userId = req.session.user;
        const user = await User.findById(userId)
        
        // Fetch CategoryOffer with category information using populate
        const categoryOffers = await CategoryOffer.find().populate('categoryId');

        // Fetch ProductOffer
        const productOffers = await ProductOffer.find().populate('productId');

        // Fetch Best Sellers
        const bestSellers = await Order.aggregate([
            { $unwind: "$orderedItems" },
            { $group: { _id: "$orderedItems.product", totalSold: { $sum: "$orderedItems.quantity" } } },
            { $sort: { totalSold: -1 } },
            { $limit: 6 },
            { $lookup: { from: "products", localField: "_id", foreignField: "_id", as: "product" } },
            { $unwind: "$product" },
            { $lookup: { from: "categories", localField: "product.category", foreignField: "_id", as: "category" } },
            { $unwind: "$category" },
            { $project: { productName: "$product.productName", productImages: "$product.productImages", quantity: "$product.quantity", category: "$category.name", offerPercentage: "$product.offerPercentage",regularPrice: "$product.regularPrice",salePrice: "$product.salePrice" ,status:"$product.status"} }
        ]);
        const filteredBestSellers = bestSellers.filter(product => product.category);

        // Fetch New Arrivals
        const newArrivals = await Product.find({ isBlocked: false }).sort({ createdAt: -1 }).populate({ path: 'category', match: { isListed: true } });
        const filteredNewArrivals = newArrivals.filter(product => product.category);

        // Fetch Wishlist and Cart products for the user
        const wishlist = await Wishlist.findOne({ userId });
        const wishlistProductIds = wishlist ? wishlist.products.map(item => item.productId.toString()) : [];
        const cart = await Cart.findOne({ userId });
        const cartProductIds = cart ? cart.products.map(item => item.productId.toString()) : [];

        // Define default values for stockFilter, sort, and order
        const stockFilter = 'inStock'; // Default stock filter
        const sort = 'price'; // Default sorting criteria
        const order = 'asc'; // Default order

        // Render Homepage with all data
        res.render('home', {
            bestSellers: filteredBestSellers,
            newArrivals: filteredNewArrivals,
            wishlistProductIds,
            cartProductIds,
            categoryOffers,
            productOffers,
            stockFilter,
            sort,
            order,
            user
        });
    } catch (error) {
        console.error("Homepage not loading:", error);
        res.redirect("/pageNotfound");
    }
};

export const loadOtp = async (req,res) => {
    try {
        res.render("otp")
    } catch (error) {
        console.log("OTP Page Not Found");
        res.status(500).send("OTP Page Not Found" )
    }
}

export const pagenotfound = async (req,res) => {
    try {
        res.render('pagenotfound')
    } catch (error) {
        res.render("/pagenotfound")
        console.log('Page Not Found');
        res.status(404).send("Page Not Found")
    }
}


function generateOtp() {
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); 
    return otp;
}


async function sendVerificationEmail(email, otp) {
    try {
        let transporter = nodemailer.createTransport({
            service: 'gmail',
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: process.env.NODEMAILER_EMAIL,
                pass: process.env.NODEMAILER_PASSWORD
            }
        });

        const info = await transporter.sendMail({
            from: process.env.NODEMAILER_EMAIL,
            to: email,
            subject: "Verify Your Account",
            text: `Your OTP is ${otp}`,
            html: `<b>Your OTP: ${otp}</b>`
        });

        console.log('Email sent: %s', info.messageId);
        return info.accepted.length > 0;
    } catch (error) {
        console.error('Error sending email: ', error);
        throw new Error('Failed to send verification email');
    }
}
 
const securePassword = async (password) => {
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        return hashedPassword;
    } catch (error) {
        console.error('Error securing password: ', error);
        throw new Error('Failed to secure password');
    }
};

export const signup = async (req, res) => {
    const { name, email, password, referralCode } = req.body;

    try {
        // Check if user with the same email already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'User with this email already exists' });
        }

        let referredBy = null;

        // Validate the referral code if provided
        if (referralCode) {
            const referrer = await User.findOne({ referralCode });
            if (!referrer) {
                return res.status(400).json({ error: 'Invalid referral code' });
            }
            referredBy = referrer.referralCode;
        }

        // Generate and send OTP
        const otp = generateOtp();
        console.log('OTP before sending email:', otp);
        const emailSent = await sendVerificationEmail(email, otp);
        if (!emailSent) {
            return res.status(500).json({ error: 'Failed to send verification email' });
        }

        // Store OTP and user data in session
        console.log('Storing OTP in session:', otp);
        req.session.userOtp = otp;
        req.session.userData = { name, email, password, referredBy }; // Store referredBy in session

        console.log('OTP Sent', otp);
        res.json({ success: true, message: 'OTP sent successfully' });

    } catch (error) {
        console.error('Error in signup route:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const resendOtp = async (req, res) => {
    try {
        // Check if user data exists in session
        if (!req.session.userData || !req.session.userData.email) {
            return res.status(400).json({ success: false, message: "Email not found in session" });
        }

        const { email } = req.session.userData;


        
        const otp = generateOtp();
        req.session.userOtp = otp; 

        
        const emailSent = await sendVerificationEmail(email, otp);
        if (emailSent) {
            console.log("Resend OTP:", otp);
            res.status(200).json({ success: true, message: "OTP resent successfully" });
        } else {
            res.status(500).json({ success: false, message: "Failed to resend OTP, please try again" });
        }
    } catch (error) {
        console.error("Error while resending OTP:", error);
        res.status(500).json({ success: false, message: "Internal server error while resending OTP" });
    }
};


export const verifyotp = async (req, res) => {
    try {
        const { otp } = req.body;
        console.log('Received OTP:', otp);
        console.log('Session OTP:', req.session.userOtp); // Log session OTP

        if (otp === req.session.userOtp) {
            const user = req.session.userData;
            const hashedPassword = await securePassword(user.password);
            const newUser = new User({
                name: user.name,
                email: user.email,
                password: hashedPassword,
                referredBy: user.referredBy             
            });
            await newUser.save();

            // Create and initialize the wallet for the new user
            const newUserWallet = new Wallet({
                userId: newUser._id,
                balance: user.referredBy ? 50 : 0,
                transactions: user.referredBy ? [{
                    amount: 50,
                    type: 'credit',
                    description: 'Referral bonus'
                }] : []
            });

            await newUserWallet.save();

            // If referred, update the referrer's wallet
            if (user.referredBy) {
                const referrer = await User.findOne({ referralCode: user.referredBy });
                const referrerWallet = await Wallet.findOne({ userId: referrer._id });
                referrerWallet.balance += 50;
                referrerWallet.transactions.push({
                    amount: 50,
                    type: 'credit',
                    description: 'Referral bonus'
                });
                await referrerWallet.save();
            }

            req.session.user = newUser._id;
            res.json({ success: true, redirectUrl: '/login' });
            console.log('User Registered Successfully');
        } else {
            res.status(400).json({ success: false, message: 'Invalid OTP, please try again' });
            req.session.userOtp = null;
        }
    } catch (error) {
        console.error('Error verifying OTP:', error);
        res.status(500).json({ success: false, message: 'An error occurred' });
    }
};



export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const findUser = await User.findOne({ isAdmin: 0, email: email });

        if (!findUser) {
            return res.status(400).json({ message: "User not found, please register" });
        }

        if (findUser.isBlocked) {
            return res.status(400).json({ message: "User is blocked by Admin" });
        }

        const passwordMatch = await bcrypt.compare(password, findUser.password);
        if (!passwordMatch) {
            return res.status(400).json({ message: "Incorrect password" });
        }

        req.session.user = findUser._id;
        res.status(200).json({ message: "Login successful" });

        console.log("User logged in successfully");
    } catch (error) {
        console.log('Login error:', error);
        res.status(500).json({ message: "Login failed. Please try again later" });
    }
};

export const logout = async (req,res) => {
    try {
        req.session.destroy((err)=>{
            if(err){
                console.log("logout Error",err);
                return res.redirect("/pagenotfound")
            }
            return res.redirect('/login')
        })
    } catch (error) {
        console.log("Logout Error",error)
        res.redirect('/pagenotfound')
    }
}

export const loadMenu = async (req, res) => {
    try {
        const userId = req.session.user;
        // Pagination
        const page = parseInt(req.query.page) || 1;
        const limit = 9;
        const skip = (page - 1) * limit;

        // Sorting
        let sort = req.query.sort || 'createdAt';
        let order = req.query.order === 'desc' ? -1 : 1;

        let sortCriteria = {};
        if (sort === 'popularity') {
            sortCriteria['orderCount'] = order;
        } else {
            sortCriteria[sort] = order;
        }

        const searchQuery = req.query.search || '';
        const stockFilter = req.query.stock || '';
        const categoryFilter = req.query.category || '';

        let query = { isBlocked: false };
        if (searchQuery) {
            query.productName = { $regex: searchQuery, $options: 'i' };
        }
        if (stockFilter) {
            query.status = stockFilter;
        }
        if (categoryFilter) {
            query.category = categoryFilter;
        }

        // Fetch sorted products
        const products = await Product.find(query)
            .populate({ path: 'category', match: { isListed: true } })
            .skip(skip)
            .limit(limit)
            .sort(sortCriteria); // Apply sorting

        // Count total products matching the filters for pagination
        const totalProductsCount = await Product.countDocuments(query);
        const totalPages = Math.ceil(totalProductsCount / limit);

        // Calculate start and end product indexes for display
        const startProduct = skip + 1;
        const endProduct = Math.min(skip + products.length, totalProductsCount);

        const categories = await Category.find({ isListed: true });
        const wishlist = await Wishlist.findOne({ userId });
        const wishlistProductIds = wishlist ? wishlist.products.map(item => item.productId.toString()) : [];

        const cart = await Cart.findOne({ userId });
        const cartProductIds = cart ? cart.products.map(item => item.productId.toString()) : [];

        res.render('menu', {
            products,
            currentPage: page,
            totalPages,
            totalProductsCount,
            limit,
            sort,
            order: req.query.order || 'asc',
            startProduct,
            endProduct,
            searchQuery,
            wishlistProductIds,
            cartProductIds,
            categories,
            stockFilter,
            categoryFilter,
            noDataFound: products.length === 0,
        });
    } catch (error) {
        console.log(error, 'ShopPage not loading');
        res.redirect("/pagenotfound");
    }
};

export const loadSingleProduct = async (req, res) => {
    try {
        const userId = req.session.user;
        const ProductID = req.query.id;

        // Fetch the single product with its category and reviews populated
        const singleProduct = await Product.findOne({ _id: ProductID })
            .populate('category')
            .populate({ path: 'reviews.user', select: 'name' });

        if (!singleProduct) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Fetch related products from the same category
        let relatedProducts = await Product.find({
            category: singleProduct.category._id,
            _id: { $ne: ProductID } // Exclude the current product
        }).populate('category').limit(5); // Adjust the limit as needed

        // If not enough related products, fetch additional products from other categories
        if (relatedProducts.length < 5) {
            const additionalProducts = await Product.find({
                _id: { $ne: ProductID, $nin: relatedProducts.map(p => p._id) }
            }).populate('category').limit(5 - relatedProducts.length);
            relatedProducts = relatedProducts.concat(additionalProducts);
        }

        // Fetch the user's wishlist and cart
        const wishlist = await Wishlist.findOne({ userId });
        const wishlistProductIds = wishlist ? wishlist.products.map(item => item.productId.toString()) : [];

        const cart = await Cart.findOne({ userId });
        const cartProductIds = cart ? cart.products.map(item => item.productId.toString()) : [];
        let productQuantityInCart = 0;

        // Calculate average rating
        const averageRating = singleProduct.reviews.length 
            ? (singleProduct.reviews.reduce((sum, review) => sum + review.rating, 0) / singleProduct.reviews.length).toFixed(1)
            : 0;

        // Check if the product is already in the cart
        if (cart) {
            const cartProduct = cart.products.find(item => item.productId.toString() === ProductID);
            if (cartProduct) {
                productQuantityInCart = cartProduct.quantity;
            }
        }

        res.render('productinfo', {
            singleProduct,
            relatedProducts,
            wishlistProductIds,
            cartProductIds,
            productQuantityInCart,
            averageRating,
            reviewCount: singleProduct.reviews.length,
            reviews: singleProduct.reviews,
            userId
        });
    } catch (error) {
        console.log(error, 'Product detailed page is not loading');
        res.redirect("/pageNotfound");
    }
};



//?--------------------------------------------------------------------------
//!---------------         User Product Review            -----------------//
//?--------------------------------------------------------------------------

export const addReview = async (req, res) => {
    const { productId, rating, comment } = req.body;
    const userId = req.session.user; // Assuming user is logged in and session has user ID

    console.log('User ID from session:', userId);

    try {
        // Check if user is logged in
        const user = await User.findById(userId);
        if (!user) {
            console.log('User not found.');
            return res.status(403).json({
                success: false,
                message: 'Please login first.'
            });
        }

        // Check if product exists
        const product = await Product.findById(productId);
        if (!product) {
            console.log('Product not found.');
            return res.status(404).json({
                success: false,
                message: 'Product not found.'
            });
        }

        // Check if user has already reviewed the product
        const existingReview = product.reviews.find(review => review.user.toString() === userId);
        if (existingReview) {
            console.log('Review already exists for this user and product.');
            return res.status(403).json({
                success: false,
                message: 'You have already reviewed this product.'
            });
        }

        // Check if user has purchased the product by examining the orderedItems array
        const purchase = await Order.findOne({
            userId,
            'orderedItems.product': productId,
            orderStatus: { $in: ['Delivered', 'Return Request', 'Returned'] }
        });

        if (!purchase) {
            console.log('No purchase record found for this user and product.');
            return res.status(403).json({
                success: false,
                message: 'You can only review products you have purchased (Delivered).'
            });
        }

        // Add the new review
        product.reviews.push({
            user: userId,
            rating: parseInt(rating, 10),
            comment,
        });

        // Update average rating
        const totalRating = product.reviews.reduce((sum, review) => sum + review.rating, 0);
        product.rating = (totalRating / product.reviews.length).toFixed(1);

        await product.save();
        res.status(200).json({ success: true, message: 'Review submitted successfully.' });
    } catch (error) {
        console.error('Error adding review:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add review. Please try again later.'
        });
    }
};



export const deleteReview = async (req, res) => {
    const { productId, reviewId } = req.body;
    const userId = req.session.user; // Assuming user is logged in and session has user ID

    try {
        const product = await Product.findById(productId);

        // Find the review and ensure it's by the logged-in user
        const reviewIndex = product.reviews.findIndex(review => review._id.toString() === reviewId && review.user.toString() === userId);
        if (reviewIndex === -1) {
            return res.status(404).send('Review not found or you do not have permission to delete this review');
        }

        // Remove the review
        product.reviews.splice(reviewIndex, 1);

        // Update average rating
        const totalRating = product.reviews.reduce((sum, review) => sum + review.rating, 0);
        product.rating = product.reviews.length ? (totalRating / product.reviews.length).toFixed(1) : 0;

        await product.save();

        res.status(200).send('Review deleted successfully');
    } catch (error) {
        console.error('Error deleting review:', error);
        res.status(500).send('Failed to delete review');
    }
};



//?--------------------------------------------------------------------------
//!---------------          User Forgot Password          -----------------//
//?--------------------------------------------------------------------------



export const loadForgotPassword = async (req, res) => {
    try {
        res.render('forgotPassword/emailverify')
    } catch (error) {
        console.log(error, 'page not found');
        res.redirect("/pagenotfound")
    }
}


export const verifyMail = async (req, res) => {
    const email = req.body.email;
    try {
        const user = await User.findOne({ email: email });
        if (user) {
            req.session.user = user._id
            req.session.userName = user.name
            res.redirect('/loadOtpVerify')
        } else {
            res.redirect('/forgotPassword?invalid')
        }
    } catch (error) {
        console.log(error, 'page not found');
        res.redirect("/pagenotfound")
    }
}

export const loadOtpVerify = async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.session.user })
        req.session.email = user.email
        const email = user.email
        const otp = generateOtp();
        const emailSent = await sendVerificationEmail(email, otp);
        if (!emailSent) {
            return res.json("email-error")
        }
        req.session.userOtp = otp;
        res.render('forgotPassword/otpverify')
        console.log('OTP Sent', otp);
    } catch (error) {
        console.log(error, 'otp verify page loading error');
        res.redirect('/pagenotfound');
    }
}

export const forgotverifyOtp = async (req, res) => {
    try {
        const { otp } = req.body
        console.log(otp)
        if (otp === req.session.userOtp) {
            res.json({ success: true, redirectUrl: "/loadNewPassword" })
        } else {
            res.status(400).json({ success: false, message: "Invalid OTP ,Please try again" })
        }
    } catch (error) {
        console.error("Error Verifying OTP", error)
        res.status(500).json({ success: false, message: "An error occured " })
    }
}

export const forgotresendOtp = async (req, res) => {
    try {
        const email = req.session.email
        if (!email) {
            return res.status(400).json({ success: false, message: "Email not found in session" })
        }
        const otp = generateOtp();
        req.session.userOtp = otp;
        const emailSent = await sendVerificationEmail(email, otp);

        if (emailSent) {
            console.log('Resend OTP :', otp)
            res.status(200).json({ success: true, message: "OTP Resend Successfully" })
        } else {
            res.status(500).json({ success: false, message: "Failed to resend OTP. Please try again." })
        }
    } catch (error) {
        console.error("Error resending otp", error)
        res.status(500).json({ success: false, message: "Internal server error,Please try again" })
    }
}


export const loadNewPassword = async (req, res) => {
    try {
        res.render('forgotPassword/changepassword')
    } catch (error) {
        console.log(error, 'page not found');
        res.redirect('/pagenotfound');
    }
}

// Example resetPassword function
export const resetPasswords = async (req, res) => {
    try {
        const { newPassword } = req.body;

        // Ensure session user ID is available
        if (!req.session.user) {
            return res.status(400).json({ success: false, message: 'User ID is missing in session' });
        }

        const user = await User.findById(req.session.user);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Ensure newPassword is provided
        if (!newPassword) {
            return res.status(400).json({ success: false, message: 'New password is required' });
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();

        return res.status(200).json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
        console.error('Error while resetting password:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
