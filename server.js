// Packages Importing
import express from 'express';
import path from 'path';
import userRouter from './routes/userRouter.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import env from 'dotenv';

// Modules Importing
import connectDB from './config/db.js'

// External Eminities
env.config();
const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();

// Set view Engine as EJS
app.set('view engine','ejs') 
app.set('views', [path.resolve(__dirname, 'views/user'),path.resolve(__dirname, 'views/admin')]);

app.use(express.json())
app.use(express.urlencoded({extended:true}))
// Serving Static Files (Middlewares)

app.use(express.static(path.join(__dirname, 'public','userAssets')));
app.use(express.static(path.join(__dirname, 'public','adminAssets')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/admin', express.static(path.join(__dirname, 'admin')));
app.use('/user', express.static(path.join(__dirname, 'user')));

app.use('/',userRouter)


// DataBase Connection (MONGO DB)
connectDB()


// Listening PORT Number 
app.listen(process.env.PORT_NUMBER, () => {
    console.log(`Server running at http://localhost:${process.env.PORT_NUMBER}/loadSignup`);
});

 