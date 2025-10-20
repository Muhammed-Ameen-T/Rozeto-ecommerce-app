import Cart from '../../model/cartSchema.js'
import Product from '../../model/productSchema.js'
import mongoose from 'mongoose'
import { successResponse, errorResponse } from '../../utils/helper/responseHandler.js'
import {HttpResCode} from '../../utils/constants/httpResponseCode.utils.js'

export const addToCart = async (req, res) => {
    try {
        const userId = req.session.user;
        if (!userId) {
            return res.status(HttpResCode.BAD_REQUEST).json({ message: 'User not logged in' });
        }

        const { productId, quantity = 1 } = req.body;
        const quantityNumber = parseInt(quantity);
        const product = await Product.findById(productId);

        if (!product) {
            return res.status(HttpResCode.NOT_FOUND).json({ message: 'Product not found' });
        }

        const price = product.salePrice;
        const totalPrice = quantityNumber * price;
        const MAX_QUANTITY_LIMIT = 5;

        let cart = await Cart.findOne({ userId });
        if (!cart) {
            if (quantityNumber > MAX_QUANTITY_LIMIT) {
                return res.status(HttpResCode.BAD_REQUEST).json({ success: false, message: 'You have reached the maximum buying limit for this product.' });
            }

            cart = new Cart({
                userId,
                products: [{ productId, quantity: quantityNumber, price, totalPrice }]
            });
        } else {
            const productIndex = cart.products.findIndex(p => p.productId.equals(productId));

            if (productIndex === -1) {
                if (quantityNumber > MAX_QUANTITY_LIMIT) {
                    return res.status(HttpResCode.BAD_REQUEST).json({ success: false, message: 'You have reached the maximum buying limit for this product.Decrease Quantity' });
                }

                cart.products.push({
                    productId,
                    quantity: quantityNumber,
                    price,
                    totalPrice
                });
            } else {
                const newQuantity = cart.products[productIndex].quantity + quantityNumber;

                if (newQuantity > MAX_QUANTITY_LIMIT) {
                    return res.status(HttpResCode.BAD_REQUEST).json({ success: false, message: 'You have reached the maximum buying limit for this product.Decrease Quantity' });
                }

                cart.products[productIndex].quantity = newQuantity;
                cart.products[productIndex].totalPrice = cart.products[productIndex].price * cart.products[productIndex].quantity;
            }
        }

        await cart.save();
        return res.status(200).json({ message: 'Product added to cart', success: true });
    } catch (error) {
        console.error('Error while adding product to cart:', error);
        return res.status(500).json({ message: 'An unexpected error occurred. Please try again later.Decrease Quantity' });
    }
};




export const loadCartPage = async (req, res) => {
    try {
        const userId = req.session.user;
        const cart = await Cart.findOne({ userId })
            .populate({
                path: 'products.productId',
                populate: { path: 'category' }
            });

        if (!cart || cart.products.length === 0) {
            return res.render('cartPage', { products: [] });
        }

        let totalOfferDiscount = 0;
        let totalDiscount = 0;
        const products = cart.products.map(item => {
            const product = item.productId;
            const offerDiscount = (product.offerPercentage * product.salePrice / 100) * item.quantity;
            totalOfferDiscount += offerDiscount;
            const discounts = (product.regularPrice - product.salePrice ) * item.quantity;
            totalDiscount +=discounts;

            return {
                _id: item._id,
                productId: item.productId._id,
                productName: product.productName,
                salePrice: product.regularPrice,
                quantity: item.quantity,
                totalPrice: item.totalPrice,
                productImages: product.productImages,
                stock: product.quantity,
                offerDiscount: offerDiscount,
                discount: totalDiscount
            };
        });

        const subtotal = cart.products.reduce((sum, item) => sum + (item.quantity * item.price), 0) - totalOfferDiscount;
        const tax = (subtotal * 10) / 100;
        const grandTotal = subtotal + tax;

        res.render('cartPage', {
            products,
            cart,
            subtotal,
            tax,
            grandTotal,
            totalOfferDiscount,
            totalDiscount
        });
    } catch (error) {
        console.error('Error while loading cart page:', error);
        res.redirect("/pagenotfound");
    }
};


export const removeFromCart = async (req, res) => {
    try {
        const { itemId } = req.body;
        const userId = req.session.user;
        await Cart.updateOne(
            { userId },
            { $pull: { products: { _id: new mongoose.Types.ObjectId(itemId) } } }
        );
        successResponse(res, {}, "Product removed from cart.")
    } catch (error) {
        errorResponse(res, error, "Failed to remove product from cart.");
    }
};


export const updateCartItem = async (req, res) => {
    const { productId, quantity } = req.body;
    try {
        const cart = await Cart.findOne({ "products._id": productId });
        if (cart) {
            const product = cart.products.find(p => p._id.toString() === productId);
            if (product) {
                const totalPrice = product.price * quantity;
                await Cart.findOneAndUpdate(
                    { "products._id": productId },
                    {
                        $set: {
                            "products.$.quantity": quantity,
                            "products.$.totalPrice": totalPrice
                        }
                    },
                    { new: true }
                );
                res.json({ success: true, totalPrice });
            } else {
                res.json({ success: false, message: 'Product not found in cart.' });
            }
        } else {
            res.json({ success: false, message: 'Cart item not found.' });
        }
    } catch (error) {
        console.error('Error updating cart item:', error);
        res.status(500).json({ success: false, message: 'Error updating cart item.' });
    }
};


export const cartTotal = async (req, res) => {
    try {
        const userId = req.session.user;
        const cart = await Cart.findOne({ userId });
        if (cart) {
            const subtotal = cart.products.reduce((sum, item) => sum + (item.quantity * item.price), 0);
            const tax = (subtotal * 10) / 100;
            const total = subtotal + tax;
            res.json({ success: true, subtotal, total, tax });
        } else {
            res.json({ success: false, message: 'Cart not found.' });
        }
    } catch (error) {
        console.error('Error fetching cart total:', error);
        res.status(500).json({ success: false, message: 'Error fetching cart total.' });
    }
};
