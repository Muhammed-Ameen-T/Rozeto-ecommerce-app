// Packages Importing
import express from 'express';
import path from 'path';
import userRouter from './routes/userRouter.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import env from 'dotenv';
import session from 'express-session';
import nocache from 'nocache'

// Modules Importing
import connectDB from './config/db.js'
import { nextTick } from 'process';

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
// cache Control Middleware
app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store'); 
    next(); 
});

// Serving Static Files (Middlewares)
app.use(express.static(path.join(__dirname, 'public','userAssets')));
app.use(express.static(path.join(__dirname, 'public','adminAssets')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/admin', express.static(path.join(__dirname, 'admin')));
app.use('/user', express.static(path.join(__dirname, 'user')));
app.use('/',userRouter)



// Catch-all for undefined routes
app.use((req, res, next) => {
    const error = new Error('Page Not Found');
    error.status = 404;
    next(error); 
});

// Error-handling middleware
app.use((error, req, res, next) => {
    const status = error.status || 500;
    res.status(status);

    // Render a custom error page for 404 or other errors
    if (status === 404) {
        res.render('pagenotfound', { errorMessage: error.message });
    } else {
        console.log('Something went wrong on the server!');
    }
});


// DataBase Connection (MONGO DB)
connectDB()

// Getting PORT Number From env
let PORT = process.env.PORT_NUMBER
// Listening PORT Number 
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
