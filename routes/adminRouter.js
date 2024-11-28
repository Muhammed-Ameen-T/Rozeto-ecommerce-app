import express from 'express'
const router = express.Router();
import {adminDash,adminLogin,login,pageerror,logout,} from '../controller/adminController/adminController.js';
import {productTable} from '../controller/adminController/productController.js';
import {userTable,blockUser,unblockUser} from '../controller/adminController/userController.js';
import {catTable,addCat,addcategory,blockCat,unblockCat} from '../controller/adminController/categoryController.js';



import { adminAuth } from '../middlewares/auth.js'

//Admin Dashboard
router.get('/',adminAuth,adminDash)

// Admin Authentication
router.get('/login',adminLogin)
router.post('/login',login)
router.get('/logout',logout)

// Admin Error Pages
router.get('/pageerror',pageerror)


// Product Management Routes
router.get('/product-table',productTable)


// User Management Routes
router.get('/user-table',adminAuth,userTable)
router.get('/blockUser',blockUser)
router.get('/unblockUser',unblockUser)

// Category Management Routes
router.get('/cat-table',adminAuth,catTable)
router.get('/add-cat',addCat)
router.post('/addcat',addcategory)
router.get('/blockCat',blockCat)
router.get('/unblockCat',unblockCat)



export default router