import express from 'express'
const router = express.Router();

import { loadLogin,loadSignup,loadHome,pagenotfound,signup,loadOtp,verifyotp } from '../controller/userController/userController.js';

router.get('/',loadHome)
router.get('/signup',loadSignup)
router.get('/login',loadLogin)
router.get('/pagenotfound',pagenotfound)
router.post('/signup',signup)
router.get('/load-otp',loadOtp)
router.post('/verify-otp',verifyotp)

export default router;
