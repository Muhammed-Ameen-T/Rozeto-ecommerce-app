import Category from '../../model/categorySchema.js';
import User from '../../model/categorySchema.js';
import { login } from './adminController.js';
import Joi from 'joi'


export const catTable = async (req, res) => {
    try {
        let search = req.query.search || "";
        const page = parseInt(req.query.page, 10) || 1;
        const limit = 4;
        const skip = (page - 1) * limit;

        const categoryData = await Category.find({})
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalCategories = await Category.countDocuments();
        const totalPages = Math.ceil(totalCategories / limit);
        res.render('categoryTable', {
            cat: categoryData,
            currentPage: page,
            totalPages: totalPages,
            totalCategories: totalCategories,search:search
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

        const newCategory = new Category({ name, description });
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

