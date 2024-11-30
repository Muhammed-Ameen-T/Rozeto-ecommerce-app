// Packages Importing
import express from 'express';
import path from 'path';
import userRouter from './routes/userRouter.js';
import adminRouter from './routes/adminRouter.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import env from 'dotenv';
import session from 'express-session';
import nocache from 'nocache'

// Modules Importing
import connectDB from './config/db.js'
import { nextTick } from 'process';
import passport from './config/passport.js';
import { handle404, handleErrors } from './middlewares/errorMiddleware.js'; // Import middleware

// External Eminities
env.config();
const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();

// Set view Engine as EJS
app.set('view engine','ejs') 
app.set('views', [path.resolve(__dirname, 'views/user'),path.resolve(__dirname, 'views/admin')]);

// parse incoming request bodies.
app.use(express.json())
app.use(express.urlencoded({extended:true})) 
// Session management middleware
app.use(session({
    secret:process.env.SESSION_SECRET,
    resave:false,
    saveUninitialized:true,
    cookie:{
        secure:false,
        httpOnly:true,
        maxAge:72*60*60*1000
    }
}))

// passport Middleware
app.use(passport.initialize());
app.use(passport.session());

// cache Control Middleware
app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store'); 
    next(); 
});

// Serving Static Files (Middlewares)
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public','userAssets')));
app.use(express.static(path.join(__dirname, 'public','adminAssets')));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads/categories')));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads/products')));



// Serve Staic Files To the Specific Routes
app.use('/admin', express.static(path.join(__dirname, 'admin')));
app.use('/user', express.static(path.join(__dirname, 'user')));
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// State The Routes
app.use('/',userRouter)
app.use('/admin',adminRouter)

// Cache Control Middleware
app.use(nocache());


// Catch-All Middleware for 404 Errors
app.use(handle404);

// Global Error Handling Middleware
app.use(handleErrors);

// DataBase Connection (MONGO DB)
connectDB()

// Getting PORT Number From env
let PORT = process.env.PORT_NUMBER
// Listening PORT Number 
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});

