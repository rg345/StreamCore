import { ApiResponse } from "../utils/ApiResponse.js"
import { ApiError } from "../utils/ApiError.js"
import { asyncHandler } from "../utils/asyncHandler.js"

//this controller is to check whether the service is running smoothly or not

const healthCheck = asyncHandler( async (req,res) =>{
    try {
        return res
               .status(200)
               .json(
                new ApiResponse(200, { status : "Ok"}, "Service is running normally")
               )
    } catch (error) {
        throw new ApiError(500, "Service Down, HealthCheck Failed");
    }
})

export {healthCheck};