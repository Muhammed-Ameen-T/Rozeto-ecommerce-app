import express from 'express';
import nodemailer from 'nodemailer';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const router = express.Router();

// Middleware to parse JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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


export const pagenotfound = async (req,res) => {
    try {
        res.render('pagenotfound')
    } catch (error) {
        res.render("/pagenotfound")
        console.log('Page Not FOund');
        res.status(404).send("Page Not Found")
    }
}


let userOtpMap = {}; // Temporary storage for OTPs

router.post("/generate-otp", (req, res) => {
    const { email } = req.body;

    // Validate input and generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000); // 6-digit OTP
    userOtpMap[email] = otp;

    // Send OTP via email
    const transporter = nodemailer.createTransport({
        service: "Gmail",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    transporter.sendMail({
        from: "no-reply@yourapp.com",
        to: email,
        subject: "Your OTP Code",
        text: `Your OTP is ${otp}`
    }, (err, info) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: "Failed to send OTP." });
        }
        res.json({ success: true });
    });
});

app.use('/api', router);

