import express from "express"
import cookieParser from "cookie-parser"

import cors from "cors"

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true

}))

app.use(express.json({limit : "16kb"}));

app.use(express.urlencoded({extended: true, limit : "16kb"}))
app.use(express.static("public"))

app.use(cookieParser())

//routes import

import userRouter from "./routes/user.routes.js"

//routes declaration
app.use("/api/v1/users",userRouter)


//achi practice toh yahi h ki users k pehle api aur uska version bhi ho

//url will look like http://localhost:8000/users/login
export {app}