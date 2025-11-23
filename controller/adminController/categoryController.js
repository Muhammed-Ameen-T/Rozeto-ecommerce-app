import Category from '../../model/categorySchema.js';
import User from '../../model/categorySchema.js';
import { login } from './adminController.js';
import Joi from 'joi'
import multer from 'multer';
import path from 'path';
import fs from 'fs'; // Required for directory creation and file cleanup
import {HttpResCode} from '../../utils/constants/httpResponseCode.utils.js';

// --- IMPORTING CLOUDINARY HELPERS ---
import { uploadImage, deleteImage } from '../../utils/helper/cloudinaryHelper.js';


export const catTable = async (req, res) => {
    try {
        let search = req.query.search || "";
        const page = parseInt(req.query.page, 10) || 1;
        const limit = 4;
        const skip = (page - 1) * limit;

        const categoryData = await Category.find({
            name: { $regex: search, $options: 'i' }
        })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalCategories = await Category.countDocuments({
            name: { $regex: search, $options: 'i' }
        });

        const totalPages = Math.ceil(totalCategories / limit);

        res.render('categoryTable', {
            cat: categoryData,
            currentPage: page,
            totalPages: totalPages,
            totalCategories: totalCategories,
            search: search
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error', message: error.message });
    }
};


export const addCat = async (req, res) => {
    try {
        res.render('addCategory');
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error', message: error.message });
    }
};



// Set storage engine
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Define the target temporary directory
        const tempDir = path.join('.', 'public', 'temp_uploads','categories'); 

        // FIX FOR ENOENT ERROR: Create the directory recursively if it doesn't exist
        fs.mkdir(tempDir, { recursive: true }, (err) => {
            if (err) {
                console.error('Error creating temporary upload directory:', err);
                return cb(err); // Pass the error to Multer
            }
            // If successful (or already exists), proceed with storage
            cb(null, tempDir);
        });
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname); // Rename the file with the current timestamp
    }
});

// Initialize upload middleware
export const upload = multer({ storage: storage });




export const addcategory = async (req, res) => {
    const schema = Joi.object({
        name: Joi.string().min(2).required(),
        description: Joi.string().min(10).required()
    });

    const { error } = schema.validate(req.body);
    if (error) {
        // Cleanup temporary file if validation fails
        if (req.file) {
            fs.unlink(req.file.path, (err) => { if(err) console.error('Cleanup Error:', err) });
        }
        return res.status(HttpResCode.BAD_REQUEST).json({ error: error.details[0].message });
    }

    const { name, description } = req.body;
    let imageUrl = null;

    try {
        const existingCategory = await Category.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
        if (existingCategory) {
            // If category exists, clean up the temp uploaded file.
            if (req.file) { 
                fs.unlink(req.file.path, (err) => { if(err) console.error('Cleanup Error:', err) });
            }
            return res.status(HttpResCode.BAD_REQUEST).json({ error: 'Category Already Exists' });
        }

        if (!req.file) {
            // Handle case where image is required
            return res.status(HttpResCode.BAD_REQUEST).json({ error: 'Image file is required.' });
        }

        // --- CLOUDINARY UPLOAD ---
        // Upload the temporary file to Cloudinary. uploadImage handles local cleanup.
        imageUrl = await uploadImage(req.file.path);
        // -------------------------

        const newCategory = new Category({ 
            name, 
            description, 
            image: imageUrl // Store the Cloudinary URL
        });
        await newCategory.save();

        return res.json({ message: 'New Category Added Successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal Server Error', message: error.message });
    }
};

export const blockCat = async (req,res) => {
    try {
        const categoryId = req.query.id;
        await Category.findByIdAndUpdate(categoryId,{isListed:false}); 
        res.redirect('/admin/cat-table')
    } catch (error) {
        console.log('Error while Unlisting',error);
        res.status(500).send('Internal Server Error');
    }
}

export const unblockCat = async (req,res) => {
    try {
        const categoryId = req.query.id;
        await Category.findByIdAndUpdate(categoryId,{isListed:true}); 
        res.redirect('/admin/cat-table')
    } catch (error) {
        console.log('Error while Unlisting',error);
        res.status(500).send('Internal Server Error');
    }
}



export const getEditCategory = async (req, res) => {
    try {
        const categoryId = req.query.id
        const category = await Category.findOne({ _id: categoryId })
        res.render("updateCategory", { category: category })
    } catch (error) {
        console.error(error, "Error while loading edit Category page.");
        res.redirect("/admin/apagenotfound")
    }
}

export const EditCategory = async (req, res) => {
    try {
        const categoryId = req.params.id
        const { name , description } = req.body

        const existingCategory = await Category.findOne({ name:{ $regex: new RegExp(`^${name}$`, 'i') }  })
        if (existingCategory && existingCategory._id.toString() !== categoryId) {
            // If name is taken, clean up the temp uploaded file.
            if (req.file) {
                 fs.unlink(req.file.path, (err) => { if(err) console.error('Cleanup Error:', err) });
            }
            return res.status(HttpResCode.BAD_REQUEST).json({ error: 'Category Already Exists' })
        }

        const categoryToUpdate = await Category.findById(categoryId);
        if (!categoryToUpdate) {
             if (req.file) {
                 fs.unlink(req.file.path, (err) => { if(err) console.error('Cleanup Error:', err) });
            }
            return res.status(HttpResCode.NOT_FOUND).json({ error: "Category not found" });
        }
        
        let newImageUrl = categoryToUpdate.image; // Start with the existing image URL

        // --- CLOUDINARY UPDATE ---
        if (req.file) {
            // 1. Upload the new image. uploadImage handles temporary local file cleanup.
            newImageUrl = await uploadImage(req.file.path);
            
            // 2. Delete the old image from Cloudinary
            if (categoryToUpdate.image) {
                await deleteImage(categoryToUpdate.image);
            }
        }
        // -------------------------

        const updateCategory = await Category.findByIdAndUpdate(categoryId, {
            name: name,
            description: description,
            image: newImageUrl // Store the new Cloudinary URL (or the old one)
        }, { new: true })

        if (updateCategory) {
            res.json({ message: "Category updated successfully" })
        } else {
            res.status(HttpResCode.NOT_FOUND).json({ error: "Category not found" })
        }
    } catch (error) {
        console.error(error, "Error while updating category.");
        res.redirect("/admin/pageError")
    }
}