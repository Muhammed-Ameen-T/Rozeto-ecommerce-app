import Product from '../../model/productSchema.js'
import Order from '../../model/orderSchema.js'
import Wallet from '../../model/walletSchema.js'
import { successResponse, errorResponse } from '../../helper/responseHandler.js'
import pdf from 'html-pdf'
import path from 'path'
import ejs from 'ejs'


export const orderDetails = async (req,res) => {
    try {
        const orderId =  req.query.orderId;
        const order = await Order.findById(orderId).populate('orderedItems.product');
        if(!order){
            return res.redirect('/pagenotfound');
        }
        res.render('order/orderDetails',{order})
    } catch (error) {
        console.error('Error while loading order detail page', error);
        res.redirect("/pagenotFound");
    }
}


export const cancelOrder =  async (req, res) => {
    try {
        const { orderId, reason } = req.body;  // Include reason in destructuring
        const order = await Order.findById(orderId);
        if (!order) {
            return errorResponse(res, 'Order not found', 404);
        }
        if (order.orderStatus === 'Cancelled') {
            return errorResponse(res, 'Order is already cancelled', 400);
        }
        order.orderStatus = 'Cancelled';
        order.orderReason = reason; // Store the cancellation reason

        await order.save();

        for (const item of order.orderedItems) {
            const product = await Product.findById(item.product);
            if (product) {
                product.quantity += item.quantity;
                await product.save();
            }
        }

        if (order.paymentStatus === 'Paid') {
            let wallet = await Wallet.findOne({ userId: order.userId });
            if (!wallet) {
                wallet = new Wallet({
                    userId: order.userId,
                    balance: 0,
                    transactions: []
                });
            }
            wallet.balance += order.finalAmount;
            wallet.transactions.push({
                amount: order.finalAmount,
                type: 'credit',
                orderId: order._id,
                description: `Cancelled order amount for Order ID: ${order.orderId}`
            });
            await wallet.save();
        }

        return successResponse(res, {}, 'Order cancelled successfully');
    } catch (error) {
        console.error('Error while cancelling order:', error);
        return errorResponse(res, 'Failed to cancel order', 500);
    }
};

export const returnRequest = async (req, res) => {
    try {
        const { orderId, reason } = req.body; // Destructure reason from request body
        const order = await Order.findById(orderId);
        
        if (!order) {
            return errorResponse(res, 'Order Not Found', 404);
        }
        
        if (order.orderStatus === 'Returned') {
            return errorResponse(res, 'Order is Already Returned', 400);
        }

        order.orderStatus = 'Return Request';
        order.orderReason = reason; // Store the reason for the return

        await order.save();

        return successResponse(res, {}, 'Order return request successful');
    } catch (error) {
        console.error('Error while processing return request:', error);
        return errorResponse(res, 'Failed to process return request', 500);
    }
};




import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const downloadInvoice = async (req, res) => {
    try {
        const orderId = req.query.orderId;
        const order = await Order.findById(orderId).populate('orderedItems.product');
        if (!order) {
            return res.redirect("/pagenotfound");
        }

        // Adjust the path relative to current directory
        const filePath = path.join(__dirname, '../../views/user/order/orderInvoice.ejs');
        console.log('Resolved file path:', filePath);

        const html = await ejs.renderFile(filePath, { order });

        const options = {
            format: 'A4',
            border: {
                top: '1cm',
                right: '1cm',
                bottom: '1cm',
                left: '1cm'
            }
        };

        pdf.create(html, options).toStream((err, stream) => {
            if (err) {
                console.error('Error while generating PDF:', err);
                return res.redirect("/pagenotfound");
            }
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=Invoice_${order._id}.pdf`);
            stream.pipe(res);
        });

    } catch (error) {
        console.error('Error while downloading invoice:', error);
        res.redirect("/pagenotfound");
    }
};

