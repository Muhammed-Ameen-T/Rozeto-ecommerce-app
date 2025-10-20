import User from '../../model/categorySchema.js';
import Order from '../../model/orderSchema.js';
import Wallet from '../../model/walletSchema.js';
import Product from '../../model/productSchema.js';
import { successResponse, errorResponse } from '../../utils/helper/responseHandler.js'
import {HttpResCode} from '../../utils/constants/httpResponseCode.utils.js'


export const orderInfo = async (req,res) => {
    try {
        const page =  parseInt(req.query.page) ||1;
        const limit = 5;
        const skip = (page -1) * limit;
        const orders = await Order.find()
        .sort({ createdAt: -1 })
        .populate('userId') 
        .populate({
            path: 'orderedItems.product', 
            model: 'Product' 
        })
        .skip(skip)
        .limit(limit);
         const totalOrders = await Order.countDocuments({})
        const totalPages =  Math.ceil(totalOrders/limit);
        res.render('order/orderList',{
            orders,
            currentPage:page,
            totalPages,
            limit
        })
    } catch (error) {
        console.error('Error while loading order listing page:', error);
        res.redirect("/admin/pageError")   
    }
}

export const orderDetails = async (req,res) => {
    try {
        const orderId = req.query.orderId;
        const order = await Order.findById(orderId).populate('orderedItems.product');
        if (!order) {
            return res.redirect("/admin/apagenotfound")
        }
        res.render('order/orderDetailed', {
            order,
        });
    } catch (error) {
        console.error('Error while loading order detail page', error);
        res.redirect("/admin/pageError")
    }
}

export const updateOrderStatus = async (req,res) => {
    try {
        const {orderId,newStatus} = req.body;
        const validStatuses = ['Processing','Collected','Delivered','Cancelled','Return Request','Returned'];
        if (!validStatuses.includes(newStatus)) {
            return errorResponse(res, 'Invalid status', HttpResCode.BAD_REQUEST);
        }
        const order = await Order.findById(orderId);
        if (!order) {
            return errorResponse(res, 'Order not found', HttpResCode.NOT_FOUND);
        }
        order.orderStatus = newStatus;

        if (newStatus === 'Cancelled' || newStatus === 'Returned') {
            for(const item of order.orderedItems){
                const product =  await Product.findById(item.product);
                if (product) {
                    product.quantity+=item.quantity;
                    await product.save()
                }
            }

            if (order.paymentStatus == 'Paid') {
                let wallet = await Wallet.findOne({userId: order.userId})
                if (!wallet) {
                    wallet = new Wallet({
                        userId: order.userId,
                        balance: 0,
                        transaction: []
                    })
                }
                wallet.balance += order.finalAmount;
                wallet.transactions.push({
                    amount: order.finalAmount,
                    type: 'credit',
                    orderId : order._id,
                    description : `${newStatus} order amount for Order ID: ${order.orderId}`
                });
                await wallet.save();
            }

        }else if(newStatus==='Delivered' || newStatus==='Returned'){
            order.paymentStatus='Paid'
        }

        if(newStatus==='Returned'){
            order.paymentStatus='Paid'
        }

        await order.save();
        return successResponse(res, 'Order status updated successfully');
    } catch (error) {
        console.error('Error updating order status:', error);
        res.redirect("/admin/pageError")
    }
}