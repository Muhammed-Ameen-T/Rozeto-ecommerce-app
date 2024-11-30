import express from 'express'
const router = express.Router();
import {adminDash,adminLogin,login,pageerror,logout,} from '../controller/adminController/adminController.js';
import {productInfo,toggleProductListing,getAddProduct,addProduct,getEditProduct,editProduct} from '../controller/adminController/productController.js';
import {userTable,blockUser,unblockUser} from '../controller/adminController/userController.js';
import {catTable,getEditCategory,addcategory,blockCat,unblockCat,upload,EditCategory} from '../controller/adminController/categoryController.js';



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
router.get('/products',productInfo)
router.get('/blockProduct',toggleProductListing)
router.get('/unblockProduct',toggleProductListing)
router.get('/addProduct',getAddProduct)
router.post('/addProduct', addProduct)
router.get('/editProduct/:id',getEditProduct)
router.post('/editProduct/:id',editProduct)


// User Management Routes
router.get('/user-table',adminAuth,userTable)
router.get('/blockUser',blockUser)
router.get('/unblockUser',unblockUser)

// Category Management Routes
router.get('/cat-table',adminAuth,catTable)
router.get('/editcat',getEditCategory)
router.put('/editcat/:id',upload.single('image'),EditCategory)
router.post('/addcat',upload.single('image'),addcategory)
router.get('/blockCat',blockCat)
router.get('/unblockCat',unblockCat)


export default router