import express from 'express'
const router = express.Router();
import passport from 'passport';

import { loadLogin,loadSignup,loadHome,pagenotfound,signup,loadOtp,verifyotp,resendOtp,login ,logout,loadMenu,addReview,deleteReview,loadSingleProduct,loadForgotPassword,verifyMail,loadOtpVerify,forgotresendOtp,loadNewPassword,forgotverifyOtp,resetPasswords} from '../controller/userController/userController.js';
import {loadUserProfile,editUserProfile,resetPassword,addAddress,loadEditAddressPage,editAddress,deleteAddress, loadUserAddress, loadUserOrders, loadUserChange} from '../controller/userController/profileController.js'
import {addToCart, loadCartPage,removeFromCart,cartTotal,updateCartItem} from '../controller/userController/cartController.js'
import { loadCheckout,placeOrder,orderSucess, validateCoupon, removeCoupon,createRazorpayOrder,handlePaymentSuccess,retryPayment, handlePaymentFailure } from '../controller/userController/checkoutController.js';
import { downloadInvoice, orderDetails, returnRequest ,cancelOrder} from '../controller/userController/orderController.js';
import { loadWishlist,removeFromWishlist,toggleWishlist } from '../controller/userController/wishlistController.js';
import { loadWallet } from '../controller/userController/walletController.js';
import { userAuth } from '../middlewares/auth.js';



// User Authentication
router.get('/signup',loadSignup)
router.get('/login',loadLogin)
router.get('/load-otp',loadOtp)
router.get('/logout',logout)
router.post('/signup',signup) 
router.post('/verify-otp',verifyotp)
router.post('/resend-otp',resendOtp)
router.post('/login',login)
router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/signup' }), 
    (req, res) => { 
        if (req.user) { 
            req.session.user = req.user._id; 
            req.session.userName = req.user.name; 
            res.redirect('/'); 
        } else { 
            res.redirect('/signup'); 
        } 
    } );

// HomePage
router.get('/',loadHome)

// Product Listing (menu)
router.get('/menu',loadMenu)
router.get('/productinfo',loadSingleProduct)
router.post('/addReview',addReview)
router.post('/deleteReview',deleteReview)

// Page Not Found
router.get('/pagenotfound',pagenotfound)

//forgot password
router.get('/forgotPassword', loadForgotPassword)
router.post('/verifyMail', verifyMail)
router.get('/loadOtpVerify',loadOtpVerify)
router.post('/verifyOtpForgotPassword', forgotverifyOtp)
router.post('/resendOtpForgotPassword', forgotresendOtp)
router.get('/loadNewPassword', loadNewPassword)
router.post('/resetPasswords',resetPasswords)

// User Profile
router.get('/profile',loadUserProfile)
router.get('/userAddresses',loadUserAddress)
router.get('/userOrders',loadUserOrders)
router.get('/userPassword',loadUserChange)
router.post('/editUserProfile/:id',editUserProfile)
router.post('/resetPassword', resetPassword)

//address management
router.post('/addAddress/:id', addAddress)
router.get('/loadEditAddressPage',loadEditAddressPage)
router.post('/editAddress/:id', editAddress)
router.delete('/deleteAddress/:id', deleteAddress)

// Cart Management
router.get('/loadCart',userAuth,loadCartPage)
router.post('/addProductToCart',userAuth,addToCart)
router.post('/removeFromCart',userAuth,removeFromCart)
router.post('/updateCartItem',userAuth,updateCartItem)
router.get('/cartTotal',userAuth,cartTotal)

// Checkout Page
router.get('/checkout',userAuth,loadCheckout)
router.post('/checkout',userAuth,loadCheckout)
router.post('/placeOrder',userAuth,placeOrder)
router.post('/coupon',userAuth,validateCoupon)
router.post('/removeCoupon',removeCoupon)
router.post('/create-razorpay-order',createRazorpayOrder)
router.post('/payment-success',userAuth,handlePaymentSuccess)
router.post('/payment-failure',userAuth,handlePaymentFailure)

// Order Page
router.get('/orderSuccess',userAuth,orderSucess)
router.get('/orderDetails',userAuth,orderDetails)
router.post('/cancelOrder',cancelOrder)
router.post('/returnOrder',returnRequest)
router.get('/downloadInvoice',userAuth,downloadInvoice)
router.post('/retryPayment',retryPayment)

// Wishlist Page
router.get('/wishlist',userAuth,loadWishlist)
router.post('/removeFromWishlist',removeFromWishlist)
router.post('/toggleWishlist',toggleWishlist)

// Wallet Page
router.get('/wallet',loadWallet)

export default router;
