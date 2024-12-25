import Category from '../../model/categorySchema.js';
import User from '../../model/categorySchema.js';
import { login } from './adminController.js';
import Joi from 'joi'
import multer from 'multer';
import path from 'path';



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
        cb(null, path.join('.', 'public', 'uploads','categories')); // Corrected the path
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname); // Rename the file with the current timestamp
    }
});

// Initialize upload
export const upload = multer({ storage: storage });




export const addcategory = async (req, res) => {
    const schema = Joi.object({
        name: Joi.string().min(2).required(),
        description: Joi.string().min(10).required()
    });

    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }

    const { name, description } = req.body;

    try {
        const existingCategory = await Category.findOne({ name });
        if (existingCategory) {
            return res.status(400).json({ error: 'Category Already Exists' });
        }

        if (!req.file) {
            console.log('File not uploaded');
            return res.status(400).json({ error: 'Image file is required.' });
        }

        console.log('Uploaded File:', req.file); // Debugging log
        const image = req.file 
            ? req.file.filename 
            : 'default-category.png';

        const newCategory = new Category({ name, description, image });
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
            return res.status(400).json({ error: CategoryAlreadyExists })
        }

        const image = req.file 
        ? req.file.filename 
        : 'default-category.png';

        const updateCategory = await Category.findByIdAndUpdate(categoryId, {
            name: name,
            description: description,
            image:image
        }, { new: true })

        if (updateCategory) {
            res.json({ message: "Category updated successfully" })
            // res.redirect('/admin/cat-table')
        } else {
            res.status(404).json({ error: "Category not found" })
        }
    } catch (error) {
        console.error(error, "Error while updating category.");
        res.redirect("/admin/pageError")
    }
}



