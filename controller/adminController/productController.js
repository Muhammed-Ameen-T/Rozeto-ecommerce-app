import path from 'path'
import fs from 'fs'
import sharp from 'sharp'
import Product from '../../model/productSchema.js'
import Category from '../../model/categorySchema.js'
import User from '../../model/userSchema.js'
import multer from 'multer'
import upload from '../../middlewares/multer.js'
import {HttpResCode} from '../../utils/constants/httpResponseCode.utils.js';


export const productInfo = async (req, res) => {
    try {
        let search = "";
        if (req.query.search) {
            search = req.query.search;
        }
        let page = 1;
        if (req.query.page) {
            page = parseInt(req.query.page); 
        }
        const limit = 5;
        let sort = 'createdAt';
        let order = 'desc';
        if (req.query.sort) {
            sort = req.query.sort;
        }
        if (req.query.order) {
            order = req.query.order;
        }
        const sortOrder = order === 'asc' ? 1 : -1;
        const productsData = await Product.find({
            productName: { $regex: ".*" + search + ".*", $options: 'i' }
        })
            .populate('category')
            .sort({ [sort]: sortOrder })
            .limit(limit)
            .skip((page - 1) * limit)
            .exec();

        const count = await Product.find({
            productName: { $regex: ".*" + search + ".*", $options: 'i' }
        }).countDocuments();
        res.render('productList', {
            data: productsData,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            limit: limit,
            sort: sort,
            order: order
        });

    } catch (error) {
        console.error(error);
        res.redirect("/admin/pageError")
    }
}



export const toggleProductListing = async (req, res) => {
    try {
        const productId = req.query.id;
        const product = await Product.findById(productId);
        if (!product) {
            return res.redirect("/admin/pageError")
        }
        const newStatus = !product.isBlocked;
        await Product.updateOne({ _id: productId }, { $set: { isBlocked: newStatus } });
        // await Cart.updateMany(
        //     {}, 
        //     { $pull: { products: { productId } } } 
        // );
        res.redirect("/admin/products");
    } catch (error) {
        console.error(error, "Error while toggling product listing status.");
        res.redirect("/admin/pageError")
    }
};

export const getAddProduct = async (req, res) => {
    try {
        const categories = await Category.find({ isListed: true });
        res.render('addProduct', { categories: categories})
    } catch (error) {
        console.error(error);
        res.redirect("/admin/pageError")
    }
}

const uploadImages = upload.array('productImages', 10);
export const addProduct = async (req, res) => {
    try {
        uploadImages(req, res, async (err) => {
            if (err) {
                console.error(err);
                return res.status(HttpResCode.BAD_REQUEST).json({ error: "Error uploading files. Ensure File Must be PNG/JPG Format and Size below 10mb" });
            }
            if (!req.files || req.files.length === 0) {
                return res.status(HttpResCode.BAD_REQUEST).json({ error: "No files uploaded." });
            }
            const imagePaths = req.files.map(file => file.path);
            const imageURL = imagePaths.map(path => path.replace('public\\', ''));
            const existingProduct = await Product.findOne({ productName:{ $regex: new RegExp(`^${req.body.productName}$`, 'i') }  });
            if (existingProduct) {
                return res.status(HttpResCode.BAD_REQUEST).json({ error: 'product Already Exists' });
            }
            
            const newProduct = new Product({
                productName: req.body.productName,
                description: req.body.description,
                category: req.body.category,
                productImages: imageURL,
                status: req.body.status,
                regularPrice: req.body.regularPrice,
                salePrice: req.body.salePrice,
                quantity: req.body.quantity,
            });
            await newProduct.save();
            return res.json({ message: "Product added successfully" });
        });
    } catch (error) {
        console.error(error);
        res.redirect("/admin/pageError")
    }
};


export const getEditProduct = async (req, res) => {
    try {
        const productId = req.params.id
        const product = await Product.findById(productId)
        const categories = await Category.find({});
        res.render('editProduct', { categories: categories, product })
    } catch (error) {
        console.error(error);
        res.redirect("/admin/pageError")
    }
}


export const editProduct = async (req, res) => {
    try {
        const productId = req.params.id;
        uploadImages(req, res, async (err) => {
            if (err) {
                console.error(err);
                return res.status(HttpResCode.BAD_REQUEST).json({ error: "Error uploading files. Ensure File Must be PNG/JPG Format and Size below 10mb" });
            }
            const existingProduct = await Product.findById(productId);
            if (!existingProduct) {
                return res.status(HttpResCode.NOT_FOUND).json({ error: "Product not found" });
            }
            const AlreadyTakenName = await Product.findOne({ productName:{ $regex: new RegExp(`^${req.body.productName}$`, 'i') },_id: { $ne: productId }  });
            if (AlreadyTakenName) {
                return res.status(HttpResCode.BAD_REQUEST).json({ error: 'product Already Exists' });
            }
            let imageURL = [...existingProduct.productImages];

            if (req.body.removedImages && req.body.removedImages.length > 0) {
                const removedImages = Array.isArray(req.body.removedImages)
                    ? req.body.removedImages
                    : [req.body.removedImages];

                imageURL = imageURL.filter(img => !removedImages.includes(img));
            }
            if (req.files && req.files.length > 0) {
                const imagePaths = req.files.map(file => file.path);
                const newImageURLs = imagePaths.map(path => path.replace('public\\', ''));
                imageURL = imageURL.concat(newImageURLs);
            }
            imageURL = Array.isArray(imageURL) ? imageURL.flat() : [imageURL];
           
            const updateProduct = await Product.findByIdAndUpdate(productId, {
                productName: req.body.productName,
                description: req.body.description,
                category: req.body.category,
                productImages: imageURL,
                status: req.body.status,
                regularPrice: req.body.regularPrice,
                salePrice: req.body.salePrice,
                quantity: req.body.quantity,
            }, { new: true });
            // console.log('new updated data', updateProduct)
            if (updateProduct) {
                res.json({ message: "Product updated successfully" });
            } else {
                res.status(HttpResCode.NOT_FOUND).json({ error: "Product not found" });
            }

        });
    } catch (error) {
        console.error(error);
        res.redirect("/admin/pageError")
    }
};
