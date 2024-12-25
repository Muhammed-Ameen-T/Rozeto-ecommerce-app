import express from 'express';
import nodemailer from 'nodemailer';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import env from 'dotenv';
import User from '../../model/userSchema.js'
import bcrypt from 'bcryptjs';
import session from 'express-session';
import Product from '../../model/productSchema.js';
import Category from '../../model/categorySchema.js';
import Order from '../../model/orderSchema.js';
import moment from 'moment/moment.js';

env.config();


export const pageerror = async (req,res) => {
    res.render('adminPagenotfound')
}


export const adminDashData = async (req, res) => {
    try {
        const filterType = req.query.filterType || 'yearly';
        let filter = {};

        // Set filter based on filterType
        switch (filterType) {
            case 'daily':
                filter.createdAt = {
                    $gte: moment().startOf('day').toDate(),
                    $lt: moment().endOf('day').toDate(),
                };
                break;
            case 'weekly':
                filter.createdAt = {
                    $gte: moment().startOf('week').toDate(),
                    $lt: moment().endOf('week').toDate(),
                };
                break;
            case 'monthly':
                filter.createdAt = {
                    $gte: moment().startOf('month').toDate(),
                    $lt: moment().endOf('month').toDate(),
                };
                break;
            case 'yearly':
                filter.createdAt = {
                    $gte: moment().startOf('year').toDate(),
                    $lt: moment().endOf('year').toDate(),
                };
                break;
            default:
                filter.createdAt = {
                    $gte: moment().startOf('year').toDate(),
                    $lt: moment().endOf('year').toDate(),
                };
                break;
        }

        // Aggregate data
        const overallOrderAmount = await Order.aggregate([
            { $match: filter },
            { $group: { _id: null, totalAmount: { $sum: "$finalAmount" } } }
        ]);
        const overallDiscount = await Order.aggregate([
            { $match: filter },
            { $group: { _id: null, totalDiscount: { $sum: "$discount" } } }
        ]);
        const overallOfferDiscount = await Order.aggregate([
            { $match: filter },
            { $group: { _id: null, totalOfferDiscount: { $sum: "$offerDiscount" } } }
        ]);
        const overallCouponDiscount = await Order.aggregate([ 
            { $match: filter },
            { $group: { _id: null, totalCouponDiscount: { $sum: "$couponDiscount" } } } 
        ]); 
        const totalCouponDiscount = overallCouponDiscount.length > 0 ? overallCouponDiscount[0].totalCouponDiscount : 0;
        const totalAmount = overallOrderAmount.length > 0 ? overallOrderAmount[0].totalAmount : 0;
        const totalDiscount = overallDiscount.length > 0 ? overallDiscount[0].totalDiscount : 0;
        const totalOfferDiscount = overallOfferDiscount.length > 0 ? overallOfferDiscount[0].totalOfferDiscount : 0;
        const totalRevenue = totalAmount - totalDiscount - totalOfferDiscount - totalCouponDiscount;

        // Sales report and count
        const salesReport = await Order.find(filter);
        const salesCount = await Order.countDocuments(filter);

        // Order status counts
        const orderStatusCounts = await Order.aggregate([
            { $match: filter },
            { $group: { _id: "$orderStatus", count: { $sum: 1 } } }
        ]);
        const orderStatusMap = {
            Processing: 0,
            Collected: 0,
            Delivered: 0,
            Cancelled: 0,
            'Return Request': 0,
            Returned: 0
        };
        orderStatusCounts.forEach(status => {
            orderStatusMap[status._id] = status.count;
        });

        // Aggregate data for total sales, total orders, total revenue, total discounts, and total offer discounts
        const salesData = await Order.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: filterType === 'yearly' ? { year: { $year: "$createdAt" } } :
                         filterType === 'monthly' ? { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } } :
                         filterType === 'weekly' ? { week: { $week: "$createdAt" }, year: { $year: "$createdAt" } } :
                         { day: { $dayOfWeek: "$createdAt" }, year: { $year: "$createdAt" } },
                    totalSales: { $sum: "$finalAmount" },
                    totalOrders: { $sum: 1 },
                    totalDiscount: { $sum: "$discount" },
                    totalOfferDiscount: { $sum: "$offerDiscount" },
                    totalCouponDiscount: {$sum: "$couponDiscount"}
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1, "_id.week": 1, "_id.day": 1 } }
        ]);

        // Format sales data
        const formattedSalesData = salesData.map(item => ({
            period: filterType === 'yearly' ? item._id.year :
                    filterType === 'monthly' ? `${item._id.year}-${item._id.month}` :
                    filterType === 'weekly' ? `${item._id.year}-W${item._id.week}` :
                    `${item._id.year}-D${item._id.day}`,
            totalSales: item.totalSales,
            totalOrders: item.totalOrders,
            totalRevenue: item.totalSales - item.totalDiscount - item.totalOfferDiscount,
            totalDiscount: item.totalDiscount,
            totalOfferDiscount: item.totalOfferDiscount,
            totalCouponDiscount: item.totalCouponDiscount
        }));
        

        // Response with aggregated data
        res.json({
            totalAmount,
            totalDiscount,
            totalOfferDiscount,
            totalRevenue, // Include totalRevenue in the response
            salesReport,
            salesCount,
            orderStatusCounts: orderStatusMap,
            formattedSalesData
        });
    } catch (error) {
        console.error("Error fetching sales data:", error);
        res.status(500).json({ error: "An error occurred while fetching sales data." });
    }
};


export const adminDashPage = async (req, res) => {
    try {
        const totalProductsCount = await Product.countDocuments();
        const totalUserCount = await User.countDocuments();
        const totalOrderCount = await Order.countDocuments();
        const totalCategoryCount = await Category.countDocuments();

        let filter = {};
        const filterType = req.query.filterType || 'yearly';
        const startDate = req.query.startDate ? new Date(req.query.startDate) : null;
        const endDate = req.query.endDate ? new Date(req.query.endDate) : null;
        switch (filterType) {
            case 'daily':
                filter.createdAt = {
                    $gte: moment().startOf('day').toDate(),
                    $lt: moment().endOf('day').toDate(),
                };
                break;
            case 'weekly':
                filter.createdAt = {
                    $gte: moment().startOf('week').toDate(),
                    $lt: moment().endOf('week').toDate(),
                };
                break;
            case 'yearly':
                filter.createdAt = {
                    $gte: moment().startOf('year').toDate(),
                    $lt: moment().endOf('year').toDate(),   
                };
                break;
            case 'custom':
                if (startDate && endDate) {
                    filter.createdAt = {
                        $gte: startDate,
                        $lt: endDate,
                    };
                }
                break;
            default:
                break;
        }
        //~~~~~~~~~    graph data for pie,single line ,poalr Area graphs   ~~~~~~~~~~~//
        const overallOrderAmount = await Order.aggregate([
            { $match: filter }, { $group: { _id: null, totalAmount: { $sum: "$finalAmount" } } }]);
        const overallDiscount = await Order.aggregate([
            { $match: filter }, { $group: { _id: null, totalDiscount: { $sum: "$discount" } } }]);
        const totalAmount = overallOrderAmount.length > 0 ? overallOrderAmount[0].totalAmount : 0;
        const totalDiscount = overallDiscount.length > 0 ? overallDiscount[0].totalDiscount : 0;
        const salesReport = await Order.find(filter)
        const salesCount = await Order.countDocuments(filter);
        const overallOfferDiscount = await Order.aggregate([
            { $match: filter },
            { $group: { _id: null, totalOfferDiscount: { $sum: "$offerDiscount" } } }
        ]);
        const overallCouponDiscount = await Order.aggregate([ 
            { $match: filter },
            { $group: { _id: null, totalCouponDiscount: { $sum: "$couponDiscount" } } } 
        ]);
        const totalCouponDiscount = overallCouponDiscount.length > 0 ? overallCouponDiscount[0].totalCouponDiscount : 0;

        const totalOfferDiscount = overallOfferDiscount.length > 0 ? overallOfferDiscount[0].totalOfferDiscount : 0;

        const totalRevenue = totalAmount - totalDiscount - totalOfferDiscount;


        const orderStatusCounts = await Order.aggregate([
            { $match: filter },
            { $group: { _id: "$orderStatus", count: { $sum: 1 } } }
        ]);
        const orderStatusMap = {
            Processing: 0,
            Collected: 0,
            Delivered: 0,
            Cancelled: 0,
            'Return Request': 0,
            Returned: 0
        };
        orderStatusCounts.forEach(status => {
            orderStatusMap[status._id] = status.count;
        });

        //~~~~~~~~~~~~     top selling product ,category and brand       ~~~~~~~~~~~//
        // top 5 best-selling products
        const topProducts = await Order.aggregate([
            { $match: filter },
            { $unwind: "$orderedItems" },
            { $group: { _id: "$orderedItems.product", totalSold: { $sum: "$orderedItems.quantity" } } },
            { $sort: { totalSold: -1 } },
            { $limit: 8 },
            { $lookup: { from: "products", localField: "_id", foreignField: "_id", as: "product" } },
            { $unwind: "$product" },
            { $project: { productName: "$product.productName", totalSold: 1,productDesc: "$product.description",productImages: "$product.productImages",productPrice: "$product.salePrice",productStatus: "$product.status",_id:"$product._id" } }
        ]);

        // top 5 best-selling categories
        const topCategories = await Order.aggregate([
            { $match: filter },
            { $unwind: "$orderedItems" },
            { $lookup: { from: "products", localField: "orderedItems.product", foreignField: "_id", as: "productDetails" } },
            { $unwind: "$productDetails" },
            { $group: { _id: "$productDetails.category", totalSold: { $sum: "$orderedItems.quantity" } } },
            { $sort: { totalSold: -1 } },
            { $limit: 5 },
            { $lookup: { from: "categories", localField: "_id", foreignField: "_id", as: "category" } },
            { $unwind: "$category" },
            { $project: { categoryName: "$category.name", totalSold: 1 , _id:"$category._id" ,image:"$category.image"} }
        ]);
        

        //~~~~~~~~~~~~~     Low stock productsss         ~~~~~~~~~~~~~~~~~~~//
        const lowStockProducts = await Product.aggregate([
            // Match products with quantity less than 20
            { 
                $match: { 
                    quantity: { $lt: 10 } 
                } 
            },
            // Project required fields
            { 
                $project: { 
                    productName: 1, 
                    quantity: 1 ,
                    status:1,
                    _id:1,
                    description:1,
                    productImages:1,
                    salePrice:1,
                } 
            },
            // Sort by quantity in ascending order
            { 
                $sort: { quantity: 1 } 
            }
        ]);
        

        res.render('adminDash', {
            totalUserCount,
            totalProductsCount,
            totalOrderCount,
            totalCategoryCount,
            salesCount,
            totalAmount,
            totalDiscount,
            salesReport,
            filterType,
            startDate,
            endDate,
            orderStatusMap,
            topProducts,
            topCategories,
            lowStockProducts,
            totalOfferDiscount,
            totalCouponDiscount,
            totalRevenue
        });
    } catch (error) {
        console.log('adminDash Error', error);
        res.render('error');
    }
};


export const adminLogin = async (req,res) => {
    try {
        if(!req.session.admin){
            res.render('adminLogin');
        }else{
            res.redirect("/admin")
        }
    } catch (error) {   
        console.log('adminLogin Error',error)
    }
}

export const login = async (req,res) => {
    try {
        const {email,password} = req.body;
        const admin = await User.findOne({email:email,isAdmin:true})
        if(admin){
            const passwordMatch = await bcrypt.compare(password,admin.password)
            if(passwordMatch){
                req.session.admin = true
                req.session.adminName = admin.email
                return res.redirect('/admin')
            }else{
                return res.render('adminLogin',{message:'Incorrect Password'})
            }
        }else{
            return res.render('adminLogin',{message:'Admin Not Found'})
        }
    } catch (error) {
        console.log('Admin Login Error',error)
        return res.render('error')
    }
}

export const logout = async (req,res) => {
    try {
        req.session.destroy((err)=>{
            if(err){
                console.log('Error While destroy Admin Session',err)
                res.redirect('/admin/pageerror')
            }
            res.redirect('/admin/login?logout')
        })
    } catch (error) {
        console.log(error, 'Error at admin logout');
        res.render('error')
    }
}


