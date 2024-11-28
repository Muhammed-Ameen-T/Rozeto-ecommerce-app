import express from 'express';
import nodemailer from 'nodemailer';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import env from 'dotenv';
import User from '../../model/userSchema.js'
import bcrypt from 'bcryptjs';
import session from 'express-session';
env.config();


export const pageerror = async (req,res) => {
    res.render('adminPagenotfound')
}

export const adminDash = async (req,res) => {
    if(req.session.admin){
        try {
            res.render('adminDash')
        } catch (error) {
            console.log('adminDash Error',error)
            res.render('error')
        }
    }
}

export const adminLogin = async (req,res) => {
    try {
        if(!req.session.admin){
            res.render('adminLogin');
        }else{
            res.redirect("/admin")
        }
    } catch (error) {
        console.log('adminLogin Error',error)
    }
}

export const login = async (req,res) => {
    try {
        const {email,password} = req.body;
        const admin = await User.findOne({email:email,isAdmin:true})
        if(admin){
            const passwordMatch = await bcrypt.compare(password,admin.password)
            if(passwordMatch){
                req.session.admin = true
                req.session.adminName = admin.email
                return res.redirect('/admin')
            }else{
                return res.render('adminLogin',{message:'Incorrect Password'})
            }
        }else{
            return res.render('adminLogin',{message:'Admin Not Found'})
        }
    } catch (error) {
        console.log('Admin Login Error',error)
        return res.render('error')
    }
}

export const logout = async (req,res) => {
    try {
        req.session.destroy((err)=>{
            if(err){
                console.log('Error While destroy Admin Session',err)
                res.redirect('/admin/pageerror')
            }
            res.redirect('/admin/login?logout')
        })
    } catch (error) {
        console.log(error, 'Error at admin logout');
        res.render('error')
    }
}


