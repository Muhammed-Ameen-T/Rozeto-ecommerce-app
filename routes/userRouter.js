import express from 'express'
const router = express.Router();

import { loadLogin,loadSignup,loadHome,pagenotfound,signup,loadOtp,verifyotp,resendOtp,login ,logout} from '../controller/userController/userController.js';
import passport from 'passport';

// User GET REQUEST
router.get('/',loadHome)
router.get('/signup',loadSignup)
router.get('/login',loadLogin)
router.get('/pagenotfound',pagenotfound)
router.get('/load-otp',loadOtp)
router.get('/logout',logout)

router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/signup' }),
    (req, res) => {
        res.redirect('/');
    }
);
  

// User POST REQUEST
router.post('/signup',signup)
router.post('/verify-otp',verifyotp)
router.post('/resend-otp',resendOtp)
router.post('/login',login)






export default router;
