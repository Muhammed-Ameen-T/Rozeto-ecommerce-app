import express from 'express';
import nodemailer from 'nodemailer';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import env from 'dotenv';
import User from '../../model/userSchema.js'
import bcrypt from 'bcryptjs';
import session from 'express-session';
import { ifError } from 'assert';
env.config();

export const loadLogin = async (req, res) => {
    try {
        res.render('login');
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal server error");
    }
};

export const loadSignup = async (req, res) => {
    try {
        if(!req.session.user){
            console.log('signup loaded')   
            return res.render('userSignup');
        }else{
            res.redirect('/')
        }
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal server error");
    }
};


export const loadHome = async (req, res) => {
    try {
        const userId = req.session.user; 
        if (userId) {
            const userData = await User.findById(userId);
            if (!userData) {
                return res.status(404).send("User not found");
            }
            res.render("home", { user: userData });
        } else {
            res.render("home", { user: null }); 
        }
    } catch (error) {
        console.error("Error loading home page:", error);
        res.status(500).send("Home Page Not Found");
    }
};

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
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); 
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

        console.log('Storing OTP in session:', otp); 
        req.session.userOtp = otp;
        req.session.userData = { name, email, password };

        console.log('OTP Sent', otp);
        res.json({ success: true, message: 'OTP sent successfully' });

    } catch (error) {
        console.error('Error in signup route:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const resendOtp = async (req, res) => {
    try {
        // Check if user data exists in session
        if (!req.session.userData || !req.session.userData.email) {
            return res.status(400).json({ success: false, message: "Email not found in session" });
        }

        const { email } = req.session.userData;


        
        const otp = generateOtp();
        req.session.userOtp = otp; 

        
        const emailSent = await sendVerificationEmail(email, otp);
        if (emailSent) {
            console.log("Resend OTP:", otp);
            res.status(200).json({ success: true, message: "OTP resent successfully" });
        } else {
            res.status(500).json({ success: false, message: "Failed to resend OTP, please try again" });
        }
    } catch (error) {
        console.error("Error while resending OTP:", error);
        res.status(500).json({ success: false, message: "Internal server error while resending OTP" });
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
            res.json({ success: true, redirectUrl: '/login' });
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


export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const findUser = await User.findOne({ isAdmin: 0, email: email });

        if (!findUser) {
            return res.status(400).json({ message: "User not found, please register" });
        }

        if (findUser.isBlocked) {
            return res.status(400).json({ message: "User is blocked by Admin" });
        }

        const passwordMatch = await bcrypt.compare(password, findUser.password);
        if (!passwordMatch) {
            return res.status(400).json({ message: "Incorrect password" });
        }

        req.session.user = findUser._id;
        res.status(200).json({ message: "Login successful" });

        console.log("User logged in successfully");
    } catch (error) {
        console.log('Login error:', error);
        res.status(500).json({ message: "Login failed. Please try again later" });
    }
};

export const logout = async (req,res) => {
    try {
        req.session.destroy((err)=>{
            if(err){
                console.log("logout Error",err);
                return res.redirect("/pagenotfound")
            }
            return res.redirect('/login')
        })
    } catch (error) {
        console.log("Logout Error",error)
        res.redirect('/pagenotfound')
    }
}










































// export const resendOtp = async (req,res) => {
//     try {
//         const {email} = req.session.userData;
//         if (!email) {
//             return res.status(400).json({sucess:false,message:"Email not Found in Session"})
//         }

//         const otp = generateOtp();
//         req.session.userOtp = otp

//         const emailSent = await sendVerificationEmail(email,otp);
//         if (emailSent) {
//             console.log("Resend OTP: ",otp);
//             res.status(200).json({sucess:true,message:"OTP Resend Sucessfully"});
            
//         } else {
//             res.status(500).json({sucess:false,message:'Failed to Resend OTP, Please Try again'})
//         }
//     } catch (error) {
//         console.error('Error while Resending OTP',error)
//         res.status(500).json({sucess:false,message:'Internal Server Error While Resending OTP'})
//     }
// }


// app.use('   ', router);

