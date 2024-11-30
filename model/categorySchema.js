import mongoose from "mongoose";
const {Schema} = mongoose;

const categorySchema = new mongoose.Schema({
    name:{
        type:String,
        required:true,
        unique:true
    },
    description:{
        type:String,
        required:true,

    },
    isListed:{
        type:Boolean,
        default:true

    },
    offerPercentage:{
        type:Number,
        default:0
    },
    image:{
        type:String,
        required:true,
    },
}, { timestamps: true });


const Category = mongoose.model("Category",categorySchema)
export default Category