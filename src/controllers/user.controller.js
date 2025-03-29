import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

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
    console.log(avatarLocalPath);
    console.log(coverImageLocalPath);

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
}) 

export  {registerUser}
