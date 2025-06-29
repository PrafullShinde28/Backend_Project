//require('dotenv').config({path : './env'})

import dotenv from "dotenv";
import connectDB from "./db/connectDB.js";

dotenv.config({
    path : './env'
})


connectDB()
.then(()=>{
    application.listen(process.env.PORT || 8000 ,()=>{
        console.log(`server is runnning at port  :${process.env.PORT}`);
    })
})
.catch((err)=>{
console.log("MONGODB connection failed !!!");
})



/*
import express from "express";
const app = express()
( async()=>{
    try {
        await mongoose.connect(`${process.env.MONGODB_UPI}`)
        app.on("error",(error)=>{
            console.log("Error: ",error);
            throw error
        })

        app.listen(process.env.PORT,()=>{
            console.log(`App is listening on port ${process.env.PORT}`);
        })
    }
    catch(error){
        console.error("Error: ")
        throw err
    }
})()

*/