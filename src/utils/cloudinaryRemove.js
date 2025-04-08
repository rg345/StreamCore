import {v2 as cloudinary} from "cloudinary"
import dotenv from "dotenv"
dotenv.config({
    path : './.env'
})

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const deleteFromCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath) return null;

        // Extract the public ID from the local file path
        const publicId = localFilePath.split("/").pop().split(".")[0];
        const response = await cloudinary.uploader.destroy(publicId,{resource_type: "auto"});

        if(response){
            console.log("File deleted from cloudinary successfully");
            return response;

        }else{
            console.log("File not deleted from cloudinary")
            return null;
        }
    } catch (error) {
        console.log("Error while delteing file from cloudinary: ", error)
        return null;
    }
}

export {deleteFromCloudinary};