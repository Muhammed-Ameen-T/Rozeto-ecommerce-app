import express from 'express'
const router = express.Router();

import { loadLogin,loadSignup,loadHome,pagenotfound } from '../controller/userController/userController.js';

router.get('/',loadHome)
router.get('/loadSignup',loadSignup)
router.get('/loadLogin',loadLogin)
router.get('/pagenotfound',pagenotfound)

export default router;
