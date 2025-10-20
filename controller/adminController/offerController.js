import Category from '../../model/categorySchema.js';
import Product from '../../model/productSchema.js'
import {ProductOffer,CategoryOffer} from '../../model/offerSchema.js'
import { successResponse, errorResponse } from '../../utils/helper/responseHandler.js'
import {HttpResCode} from '../../utils/constants/httpResponseCode.utils.js'
import { toggleProductListing } from './productController.js';


// Product offer management

export const loadProductOffer = async (req,res) => {
    try {
        let search = req.query.search || "";
        const page = parseInt(req.query.page) ||1;
        const limit = 5;
        const skip = (page-1)* limit;
        const productOffers = await ProductOffer.find({offerName:{$regex: ".*" + search + ".*", $options: "i"}}).sort({createdAt:-1})
           .skip(skip)
           .limit(limit);
        const totalProductOffers = await ProductOffer.countDocuments({ offerName: { $regex: ".*" + search + ".*", $options: "i" } })
        const totalPages = Math.ceil(totalProductOffers/limit);
        const products = await Product.find({}).sort({ productName: 1 });
        res.render('offer/productOffer',{
            productOffers,
            currentPage:page,
            totalPages,
            totalProductOffers,
            limit,
            products
        })
    } catch (error) {
        console.error('Error loading product offers:', error);
        res.redirect("/admin/apagenotfound")
    }
}



export const addProductoffer = async (req, res) => {
    const { offerName, productId, offerPercentage } = req.body;
    try {
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(HttpResCode.NOT_FOUND).json({ success: false, message: 'Product not found' });
        }

        const newOffer = new ProductOffer({
            offerName,
            productId,
            offerPercentage,
            productName: product.productName
        });

        await newOffer.save();

        product.offerPercentage = offerPercentage;
        await product.save();

        // Send a success response with data
        res.status(200).json({
            success: true,
            message: 'Product offer added successfully',
            data: {
                offer: newOffer,
                product: product
            }
        });
    } catch (error) {
        console.error('Error adding product offer:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const toggleProductOffer = async (req,res) => {
    const offerId = req.params.id;
    try {
        const offer = await ProductOffer.findById(offerId);
        if (!offer) {
            return res.status(HttpResCode.NOT_FOUND).send('Offer not found');
        }
        const productId = offer.productId
        const product = await Product.findById(productId);
        if (offer.isActive) {
            product.offerPercentage=0
            await product.save()
        }else{
            product.offerPercentage = offer.offerPercentage
            await product.save()

            const otherOffers = await ProductOffer.find({productId, _id:{$ne: offer._id}})
            for(let offer of otherOffers){
                offer.isActive = false;
                await offer.save()
            }
        }
        offer.isActive = !offer.isActive;
        await offer.save();
        res.redirect('/admin/productOffers');
    } catch (error) {
        console.error('Error toggling offer status:', error);
        res.redirect("/admin/apagenotfound")
    }
}

export const deleteProductOffer = async (req, res) => {
    const offerId = req.params.id;
    try {
        const offer = await ProductOffer.findByIdAndDelete(offerId);
        const productId = offer.productId
        const product = await Product.findById(productId);
        product.offerPercentage = 0
        await product.save()
        if (!offer) {
            return errorResponse(res, 'Offer not found');
        }
        successResponse(res, {}, "Product Offer deleted successfully")
    } catch (error) {
        console.error('Error deleting offer:', error);
        res.redirect("/admin/pageError")
    }
};



// Category offer management    

export const loadCategoryOffer = async (req,res) => {
    try {
        let search = req.query.search || "";
        let page = parseInt(req.query.page) || 1;
        const limit = 5;
        const skip = (page-1) * limit;
        const categoryOffers = await CategoryOffer.find({offerName:{$regex: ".*" + search + ".*", $options:"i"}}).sort({createdAt:-1})
            .skip(skip)
            .limit(limit)
        const totalCategoryOffer = await CategoryOffer.countDocuments({offerName:{$regex: ".*" + search + ".*", $options: "i"}})
        const totalPages = Math.ceil(totalCategoryOffer/limit);
        const category = await Category.find({}).sort({ name: 1 })
        res.render('offer/categoryOffer',{
            totalPages,
            currentPage:page,
            totalCategoryOffer,
            categoryOffers,
            limit,
            category
        })
    } catch (error) {
        console.log('Error loading Category Offers',error);
        res.redirect("/admin/apagenotfound")
    }
}

export const addCategoryOffer = async (req,res) => {
    const {offerName,offerPercentage,categoryId} = req.body;
    try {
        const category = await Category.findById(categoryId);
        if (!category) {
            return res.status(HttpResCode.NOT_FOUND).send('Category Not Found');
        }
        const newOffer = new CategoryOffer({
            offerName,
            categoryName:category.name,
            offerPercentage,
            categoryId
        });
        await newOffer.save();

        category.offerPercentage = offerPercentage

        await category.save()
        const productInThisCategory = await Product.find({category:categoryId});
        for(let product of productInThisCategory){
            product.offerPercentage = offerPercentage;
            await product.save()
        }
        res.status(200).json({
            success: true,
            message: 'Category offer added successfully',
            data: {
                offer: newOffer,
                category: category
            }
        });
    } catch (error) {
        console.log('Error while Adding New CategoryOffer',error),
        res.redirect('/admin/apagenotfound')
    }   
}

export const toggleCategoryOffer = async (req,res) => {
    const offerId = req.params.id
    try {
        const offer = await CategoryOffer.findById(offerId)
        if (!offer) {
            res.status(HttpResCode.NOT_FOUND).send('Offer Not Found');
        }
        const categoryId=offer.categoryId
        const category = await Category.findById(categoryId);
        const productsInThisCategory = await Product.find({category: categoryId})
        if (offer.isActive) {
            category.offerPercentage=0
            await category.save();

            for(let product of productsInThisCategory){
                product.offerPercentage = 0
                await product.save()
            }
        }else{
            category.offerPercentage = offer.offerPercentage
            await category.save()
            const otherOffers = await CategoryOffer.find({categoryId, _id: {$ne: offer._id}});
            for(let offer of otherOffers){
                offer.isActive = false;
                await offer.save()
            }

            for(let product of productsInThisCategory){
                product.offerPercentage=offer.offerPercentage
                await product.save()
            }
        }
        offer.isActive = !offer.isActive;
        await offer.save();
        res.redirect('/admin/categoryOffers');
    } catch (error) {
        console.error('Error toggling offer status:', error);
        res.redirect("/admin/apagenotfound");
    }
}

export const deleteCategoryOffer = async (req,res) => {
    const offerId = req.params.id;
    try {
        const offer = await CategoryOffer.findByIdAndDelete(offerId)
        const categoryId = offer.categoryId
        const category = await Category.findById(categoryId);
        const productInThisCategory = await Product.find({category:categoryId})
        category.offerPercentage=0
        await category.save()
        for (let product of productInThisCategory){
            product.offerPercentage = 0
            await product.save()
        }
        if (!offer) {
            return errorResponse(res, 'Offer not found');
        }
        successResponse(res, {}, "CategoryOffer Deleted SucessFully")
    } catch (error) {
        console.error('Error deleting category offer:', error);
    }
}