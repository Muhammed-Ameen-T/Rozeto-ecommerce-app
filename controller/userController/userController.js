import express from 'express';
import nodemailer from 'nodemailer';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import env from 'dotenv';
import User from '../../model/userSchema.js'
import bcrypt from 'bcryptjs';
import session from 'express-session';
env.config();

export const loadLogin = async (req, res) => {
    try {
        res.render('userLogin');
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal server error");
    }
};

export const loadSignup = async (req, res) => {
    try {
        console.log('signup loaded')   
        res.render('userSignup');
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal server error");
    }
};


export const loadHome = async (req,res) => {
    try {
        res.render("home")
    } catch (error) {
        console.log("Home Page Not Found");
        res.status(500).send("Home Page Not Found" )
    }
}

export const loadOtp = async (req,res) => {
    try {
        res.render("otp")
    } catch (error) {
        console.log("OTP Page Not Found");
        res.status(500).send("OTP Page Not Found" )
    }
}

export const pagenotfound = async (req,res) => {
    try {
        res.render('pagenotfound')
    } catch (error) {
        res.render("/pagenotfound")
        console.log('Page Not Found');
        res.status(404).send("Page Not Found")
    }
}


function generateOtp() {
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // Ensuring 6-digit OTP
    console.log('Generated OTP:', otp); 
    return otp;
}


async function sendVerificationEmail(email, otp) {
    try {
        let transporter = nodemailer.createTransport({
            service: 'gmail',
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: process.env.NODEMAILER_EMAIL,
                pass: process.env.NODEMAILER_PASSWORD
            }
        });

        const info = await transporter.sendMail({
            from: process.env.NODEMAILER_EMAIL,
            to: email,
            subject: "Verify Your Account",
            text: `Your OTP is ${otp}`,
            html: `<b>Your OTP: ${otp}</b>`
        });

        console.log('Email sent: %s', info.messageId);
        return info.accepted.length > 0;
    } catch (error) {
        console.error('Error sending email: ', error);
        throw new Error('Failed to send verification email');
    }
}
 
const securePassword = async (password) => {
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        return hashedPassword;
    } catch (error) {
        console.error('Error securing password: ', error);
        throw new Error('Failed to secure password');
    }
};

export const signup = async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {     
            return res.status(400).json({ error: 'User with this email already exists' });
        }

        const otp = generateOtp();
        console.log('OTP before sending email:', otp);
        const emailSent = await sendVerificationEmail(email, otp);
        if (!emailSent) {
            return res.status(500).json({ error: 'Failed to send verification email' });
        }

        console.log('Storing OTP in session:', otp); // Log OTP storage
        req.session.userOtp = otp;
        req.session.userData = { name, email, password };

        console.log('OTP Sent', otp);
        res.json({ success: true, message: 'OTP sent successfully' });

    } catch (error) {
        console.error('Error in signup route:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const verifyotp = async (req, res) => {
    try {
        const { otp } = req.body;
        console.log('Received OTP:', otp);
        console.log('Session OTP:', req.session.userOtp); // Log session OTP

        if (otp === req.session.userOtp) {
            const user = req.session.userData;
            const hashedPassword = await securePassword(user.password);
            const newUser = new User({
                name: user.name,
                email: user.email,
                password: hashedPassword
            });
            await newUser.save();

            req.session.user = newUser._id;
            res.json({ success: true, redirectUrl: '/' });
            console.log('User Registered  Sucessfully')
        } else {
            res.status(400).json({ success: false, message: 'Invalid OTP, please try again' });
            req.session.userOtp=null
        }
    } catch (error) {
        console.error('Error verifying OTP:', error);
        res.status(500).json({ success: false, message: 'An error occurred' });
    }
};




// app.use('   ', router);

















