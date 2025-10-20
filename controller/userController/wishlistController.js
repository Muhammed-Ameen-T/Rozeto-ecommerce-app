import Wishlist from '../../model/wishlistSchema.js'
import Product from '../../model/productSchema.js'; // Ensure the Product model is imported
import { successResponse, errorResponse } from '../../utils/helper/responseHandler.js'
import {HttpResCode} from '../../utils/constants/httpResponseCode.utils.js'


export const loadWishlist = async (req,res) => {
    try {
        const userId = req.session.user;
        const wishlist = await Wishlist.findOne({userId})
        .populate({
            path:'products.productId',
            populate:{path:'category'}
        })

        if (!wishlist) {
            return res.render('wishlist',{products:[],currentPage:1,totalPage:1})
        }
        const products = wishlist.products.map(item=>item.productId);
        const page =  parseInt(req.query.page) || 1;
        const pageSize = 3;
        const totalProducts = products.length;
        const totalPages = Math.ceil(totalProducts/pageSize);
        const paginatedProducts = products.slice((page-1)*pageSize, page*pageSize);
        res.render('wishlist',{
            products:paginatedProducts,
            currentPage:page,
            totalPages:totalPages
        })
    } catch (error) {
        console.error('Error while loading wishlist:', error);
        res.redirect("/pagenotfound")
    }
}

export const removeFromWishlist = async (req,res) => {
    try {
        const {productId}= req.body;
        const userId = req.session.user;
        await Wishlist.updateOne(
            {userId},
            {$pull:{products:{productId}}}
        );
        res.status(200).json({sucess:true, message: "Product Removed Sucessfully"});
    } catch (error) {
        res.status(500).json({sucess:false,message:'Failed to Remove Product From Wishlist.'})
    }
}

export const toggleWishlist = async (req, res) => {
    try {
        const userId = req.session.user;
        
        if (!userId) {
            return errorResponse(res, {}, "User not logged in", 401);
        }

        const { productId } = req.body;
        let wishlist = await Wishlist.findOne({ userId });

        if (!wishlist) {
            wishlist = new Wishlist({ userId, products: [{ productId }] });
            await wishlist.save();
            return successResponse(res, { inWishlist: true }, "Product Added to Wishlist.");
        }

        const productIndex = wishlist.products.findIndex(item => item.productId.toString() === productId);
        if (productIndex >= 0) {
            wishlist.products.splice(productIndex, 1);
            await wishlist.save();
            return successResponse(res, { inWishlist: false }, "Product Removed From Wishlist");
        } else {
            wishlist.products.push({ productId });
            await wishlist.save();
            return successResponse(res, { inWishlist: true }, "Product Added to Wishlist");
        }
    } catch (error) {
        console.error('Error Toggling Wishlist', error);
        return errorResponse(res, error, "Failed to Update Wishlist");
    }
};
