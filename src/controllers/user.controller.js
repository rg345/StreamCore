import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { deleteFromCloudinary } from "../utils/cloudinaryRemove.js";
import jwt from "jsonwebtoken"

const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave : false});

        return {accessToken, refreshToken}

    } catch (error) {
        throw new ApiError(500, "Access and Refresh Token generation failed");
    }
}
const registerUser = asyncHandler( async (req,res) => {
    //1. get user details from frontend
    //2.validate the entries - fields should not be empty
    //3.check if user already exists? by username or email
    //4.check for images , avatar
    //5.upload them to cloudinary
    //6.create user object, kyuki mongoDB noSQL Database hai -> create entry in dB
    //7.remove password and refresh token field from response
    //8.check for user creation
    //9.return res

    // console.log(req.body)
    //1.
    const {username,fullname, email,password} = req.body;
    // console.log("username: ", username)
    // if(
    //     [username, fullname,email, password].some((field)=>
    //         field && field?.trim() === ""
    //     )
    // ){
    //     throw new ApiError(400, "All fields are required")
    // }
    if (![username, fullname, email, password].every(field => field && field.trim() !== "")) {
        throw new ApiError(400, "All fields are required");
    }

    const existedUser = await User.findOne(
        {
            $or: [{ email },{ username }]
        }
    )
    if(existedUser){
        console.log(existedUser.email);
        console.log(existedUser.username);
        throw new ApiError(409,"User with email or username already exists")
    }
    // else{
    //     // res.send(200,"Account created successfully");
    //     res.status(201).send("Account of the user is created successfully");
    // }
    
    // console.log(req.files);
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;
    //should also check whether coverImage is there or not
    //if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
    // coverImageLocalPath = req.files.coverImage[0].path}
    // console.log(avatarLocalPath);
    // console.log(coverImageLocalPath);

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar is required");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if(!avatar){
        console.error("❌ Avatar path is missing. Full req.files object:");
        console.log("✅ Full req.files object:", JSON.stringify(req.files, null, 2));

        throw new ApiError(400, "Avatar is required");
    }

   const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
        //jo jo nhi chahiye unke aage - minus sign lagao", jaise yahan passowrd aur token nhi chahiye
    )
    if(!createdUser){
        throw new ApiError(500,"Server error while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(201, createdUser, "User registered Successfully")
    )
});

const loginUser = asyncHandler( async (req,res) => {
    // fetch data from the req body
    // check if username, email already exists
    // find the user
    // password check
    // generate accecss and refresh token
    // send tokens in cookies

    const {username, email, password} = req.body;

    if(!(username || email)){
        throw new ApiError(400, "username or email is required")
    }

    const user = await User.findOne({
        $or : [{username}, {email}]
    })

    if(!user){
        throw new ApiError(404, "User doesn't exists")
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if(!isPasswordValid){
        throw new ApiError(401,"Password is incorrect")
    }

    const {accessToken,refreshToken} = await generateAccessAndRefreshToken(user._id);

    //the current access of user you have is from line 122, refreshTokenf for that user is empty for now, so at this point you decide whether on not to make a dB call, if it is expensive to do so, then update the above user only, or make the dB call

    const loggedInUser = await User.findById(user._id).select( "-password -refreshToken" )

    const options = {
        httpOnly : true,
        secure : true
    }

    //now return the response

    return res
    .status(200)
    .cookie("accessToken", accessToken,options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user : loggedInUser, accessToken, refreshToken,
            },
            "User login successfull"
        )
    ) 

})

const logOutUser = asyncHandler(async (req,res)=>{
    
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset : {
                refreshToken : undefined
            }
        },
        {
            new : true,
        }
    )
    const options = {
        httpOnly : true,
        secure : true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
        new ApiResponse(
            200,{}, "You have logged out Successfully")
    )

})

const refreshAccessToken = asyncHandler(async (req,res) => {
    const incomingRefreshToken = req.cookies.accessToken || req.body.accessToken

    if(!incomingRefreshToken){
        throw new ApiError(401,"Unauthorized request")
    }

   try {
     const decodedToken = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET);
 
     const user = await User.findById(decodedToken?._id)
 
     if(!user){
         throw new ApiError(401,"Invalid Refresh Token")
     }
 
     if(incomingRefreshToken !== user?.refreshToken){
         throw new ApiError(401,"Refresh Token is invalid or expired")
     }
 
     const options = {
         httpOnly: true,
         secure: true
     }
     const {accessToken,newRefreshToken} = await generateAccessAndRefreshToken(user._id);
 
     return res
     .status(200)
     .cookie("accessToken", accessToken, options)
     .cookie("refreshToken", newRefreshToken, options)
     .json(
         new ApiResponse(
             200,
             { accessToken, refreshToken : newRefreshToken},
             "accessToken refreshed"
         )
     )
   } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Refresh token")
   }
    //in cookie provide data as key value pairs , what field you want to store against what you are storing in that field.

})

const changeCurrentPassword = asyncHandler ( async (req,res) => {

    const {oldPassword,newPassword} = req.body;

    const user = await User.findById(req.user?._id);

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    if(!isPasswordCorrect){
        throw new ApiError(400, "Invalid Old Password");
    }

    user.password = newPassword;

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Your password is successfully changed"));

    
})

const getCurrentUser = asyncHandler ( async  (req,res) => {
// this function gets the current logged-in user details
    return res
    .status(200)
    .json(new ApiResponse(200, req.user, "User fetched successfully"));
})

const updateAccountDetails = asyncHandler( async (req,res) => {

    const {fullname, email} = req.body;

    if(!(fullname && email)){
        throw new ApiError(400, "All fields are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullname,
                email : email

            }
        },
        {
            new : true
        }
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Account Details Updated Successfully")
    )

})

const updateUserAvatar =asyncHandler ( async (req,res) => {
    const avatarLocalPath = req.file?.path

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is missing");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if(!avatar.url){
        throw new ApiError(400, "Error while uploading new avatar file on Cloudinary")
    }
    //cloudinary se complete object return ho rha hai hame keval uska url dB mai daalna h

    const oldAvatarLocalPath = req.user.avatar;

    const deleteOldFile = await deleteFromCloudinary(oldAvatarLocalPath);

    if(!deleteOldFile){
        throw new ApiError(400, "Error while deleting old avatar file from Cloudinary");
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:
            {
                avatar : avatar.url
            }
        },
        { new : true }
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Avatar Image Updated Successfully")
    )
})

const updateUserCoverImage =asyncHandler ( async (req,res) => {
    const coverImageLocalPath = req.file?.path

    if(!coverImageLocalPath){
        throw new ApiError(400, "Avatar file is missing");
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!coverImage.url){
        throw new ApiError(400, "Error while uploading new cover Image file on Cloudinary")
    }
   
    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:
            {
                coverImage : coverImage.url
            }
        },
        { new : true }
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Cover Image uploaded Successfully")
    )
})

const getUserChannelProfile = asyncHandler( async (req,res) => {
    const {username} = req.params

    if(!username?.trim()){
        throw new ApiError(400, "username is missing")
    }

    const channel = await User.aggregate([
        {
            $match: {
                username : username?.toLowerCase()
            }
        },
        {
            $lookup: {
                from : "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from : "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields :{
                subscribersCount : {
                    $size : "$subscribers",
                },
                channelSubscribedToCount : {
                    $size : "$subscribedTo"
                },
                isSubscribed : {
                    $cond : {
                        if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                username : 1,
                fullname : 1,
                subscribersCount: 1, 
                channelSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1
            }
        }
    ])

    if(!channel?.length){
        throw new ApiError(400, "Channel doesn't exist")
    }

    return res
    .statsu(200)
    .json(
        new ApiResponse(200, channel[0], "user channel fetched successfully")
    )
})

const getWatchHistory = asyncHandler( async (req,res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id : new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from : "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from : "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullname : 1, 
                                        avatar: 1,
                                        username: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                $first : "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(200, user[0].watchHistory, "User Watch History fetched successfully")
    )
})

export { 
    registerUser,
    loginUser,
    logOutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    deleteFromCloudinary,
    getUserChannelProfile,
    getWatchHistory
 }
