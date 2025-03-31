import {v2 as cloudinary} from "cloudinary"
import { log } from "console";
import dotenv from "dotenv"
dotenv.config({
    path : './.env'
})
import fs from "fs"


 // Configuration
 cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
 });


 const uploadOnCloudinary = async (localFilePath) =>{
    try {
        if(!localFilePath) return null;
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        ///file has been uploaded succesfully
        // log("File is uploaded on cloudinary");
        // log(response.url)
        log(response)
        fs.unlinkSync(localFilePath)
        return response
    } catch (error) {
        fs.unlinkSync(localFilePath)
        log("Error in uploading file: ", error)

        return null
    }
 }

 export {uploadOnCloudinary}