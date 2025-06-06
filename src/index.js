import dotenv from "dotenv"
// import mongoose from "mongoose"
// import {DB_NAME} from "./constants.js"
// import express from "express"
import connectDB  from "./db/index.js"
import {app} from "./app.js"
dotenv.config({
    path : './.env'
})


let port = process.env.PORT;
   
connectDB()
.then(()=>{
    app.on("error", (err)=>{
        console.log("Error in running the server" , err);
    })
    app.listen(port, ()=>{
        console.log(`server is running on port ${port}`)
    })
})
.catch((err)=>{
    console.log("MongoDB connection failed", err);
})


// ;( async () => {
    
//     try{
//         await mongoose.connect(`${process.env.MONGO_DB_URI}/${DB_NAME}`)
//         app.on("error", (error)=>{
//             console.log("Error :",error);
//             throw error
//         });

//         app.listen(process.env.PORT, ()=> {
//             console.log(`App is listening on port ${process.env.PORT}`)
//         })
//     }catch(error){
//         console.error("Error in connecting database : " , error)
//     }
// })()
