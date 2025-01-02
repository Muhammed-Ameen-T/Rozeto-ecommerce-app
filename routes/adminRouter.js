import express from 'express'
const router = express.Router();
import {adminDashPage,adminDashData,adminLogin,login,pageerror,logout,} from '../controller/adminController/adminController.js';
import {productInfo,toggleProductListing,getAddProduct,addProduct,getEditProduct,editProduct} from '../controller/adminController/productController.js';
import {userTable,toggleUserBlockStatus} from '../controller/adminController/userController.js';
import {catTable,getEditCategory,addcategory,blockCat,unblockCat,upload,EditCategory} from '../controller/adminController/categoryController.js';
import { orderInfo, orderDetails, updateOrderStatus } from '../controller/adminController/orderController.js';
import { addCoupon, loadCouponPage, toggleCoupon } from '../controller/adminController/couponController.js';
import {downloadSalesReportPDF, downloadSalesReportExcel, loadSalesReport } from '../controller/adminController/salesReportController.js';
import { loadProductOffer,deleteProductOffer,addProductoffer,toggleProductOffer, loadCategoryOffer, addCategoryOffer, deleteCategoryOffer,toggleCategoryOffer } from '../controller/adminController/offerController.js';


import { adminAuth } from '../middlewares/auth.js'

//Admin Dashboard
router.get('/',adminAuth,adminDashPage)
router.get('/adminDashData',adminAuth, adminDashData);


// Admin Authentication
router.get('/login',adminLogin)
router.post('/login',login)
router.get('/logout',logout)

// Admin Error Pages
router.get('/pageerror',pageerror)

// Product Management Routes
router.get('/products',adminAuth,productInfo)
router.get('/blockProduct',adminAuth,toggleProductListing)
router.get('/unblockProduct',adminAuth,toggleProductListing)
router.get('/addProduct',adminAuth,getAddProduct)
router.post('/addProduct',adminAuth, addProduct)
router.get('/editProduct/:id',adminAuth,getEditProduct)
router.post('/editProduct/:id',adminAuth,editProduct)


// User Management Routes
router.get('/user-table',adminAuth,userTable)
router.get('/toggleUser',adminAuth,toggleUserBlockStatus)

// Category Management Routes
router.get('/cat-table',adminAuth,catTable)
router.get('/editcat',adminAuth,getEditCategory)
router.put('/editcat/:id',upload.single('image'),EditCategory)
router.post('/addcat',upload.single('image'),addcategory)
router.get('/blockCat',adminAuth,blockCat)
router.get('/unblockCat',adminAuth,unblockCat)

//Order Management Routes
router.get('/orders',adminAuth,orderInfo)
router.get('/orderDetails',adminAuth,orderDetails)
router.post('/updateOrderStatus',adminAuth,updateOrderStatus)

// Coupon Management Routes
router.get('/coupon',adminAuth,loadCouponPage)
router.post('/addCoupon',adminAuth,addCoupon)
router.patch('/toggleCoupon/:couponId',adminAuth,toggleCoupon)

router.get('/salesReport',adminAuth,loadSalesReport)
router.get('/salesReport/excel',adminAuth,downloadSalesReportExcel)
router.get('/salesReport/pdf',adminAuth,downloadSalesReportPDF)

// Product Offer Routes 
router.get('/productOffers',adminAuth,loadProductOffer)
router.post('/addProductOffer',adminAuth,addProductoffer)
router.post('/toggleProductOffer/:id',adminAuth,toggleProductOffer)
router.delete('/deleteProductOffer/:id',adminAuth,deleteProductOffer)

// Category Offer Routes
router.get('/categoryOffers',adminAuth,loadCategoryOffer);
router.post('/addCategoryOffer',adminAuth,addCategoryOffer)
router.post('/toggleCategoryOffer/:id',adminAuth,toggleCategoryOffer)
router.delete('/deleteCategoryOffer/:id',adminAuth,deleteCategoryOffer)

export default router