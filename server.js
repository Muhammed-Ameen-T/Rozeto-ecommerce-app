import express from 'express'
let app = express()

app.get('/',(req,res)=>{
    res.send('Hello Welcome to Home Page')
})

app.listen(3030,()=>{
    console.log("https://localhost:3030");
})