import express from 'express';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import env from 'dotenv';
import User from '../../model/userSchema.js'
import session from 'express-session';
env.config();

export const productTable = async (req,res) => {
    try {
        res.render('products-list')
    } catch (error) {
        console.log(error, 'Error at Product table');
        res.render('error')
    }
}
