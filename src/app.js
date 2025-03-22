import express from "express"
import cookieParser from "cookie-parser"
import cors from "cors"

const app = express()

// CORS configuration should be before route declarations
app.use(cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000", // Provide fallback
    credentials: true

}))

app.use(express.json({limit : "16kb"}));

app.use(express.urlencoded({extended: true, limit : "16kb"}))
app.use(express.static("public"))

app.use(cookieParser())

//routes import

import userRouter from "./routes/user.routes.js"

//routes declaration
console.log("Mounting userRouter at /api/v1/users")
app.use("/api/v1/users",userRouter)
console.log("userRouter mounted successfully")

//achi practice toh yahi h ki users k pehle api aur uska version bhi ho
//url will look like http://localhost:8000/api/v1/users/register
export {app}