import { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler( async(req,res) => {

    const videoId = req.params;

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid Video Id");
    }

    const userId = req.user._id;

    //check if user has already liked the video
    const existingLike = await Like.findOne({
        video : videoId,
        likedBy : userId
    });

    //toggle like logic

    if(exisitingLike){
        await Like.findByIdAndDelete(existingLike._id);
        return res
               .status(200)
               .json(new ApiResponse(200,{},"You have unliked the video"))
    }

    const likeVideo = await Like.create({
        video : videoId,
        likedBy: userId
    })

    return res
    .status(201)
    .json(new ApiResponse(201,{},"Video Liked Successfully"))

    //200 status code is for "Ok" => in above case successful deletion of like
    //201 is for creating new resource

});

const toggleCommentLike = asyncHandler( async (req,res) => {

    const commentId = req.params;
    const userId = req.user._id;

    if(!isValidObjectId(commentId)){
        throw new ApiError(400,"Invalid Comment Id");
    }
    
    const exisitingLike = await Like.findOne({
        comment : commentId,
        likedBy: userId
    })

    if(exisitingLike){
        await Like.findByIdAndDelete(existingLike._id);
        return res
        .status(200)
        .json(new ApiResponse(200, {},"Comment unliked Successfully"));
    }

    const likeComment = await Like.create({
        comment: commentId,
        likedBy: userId
    })

    return res
    .status(201)
    .json(new ApiResponse(201,{}, "Comment Liked Successfully"));

});

const toggleTweetLike = asyncHandler( async (req,res) => {

    const tweetId = req.params;
    
    const userId = req.user._id;

    if(!isValidObjectId(tweetId)){
        throw new ApiError(400, "Invalid input")
    }

    const existingLike = await Like.findOne({
        tweet: tweetId,
        likedBy: userId
    })


    if(exisitingLike){
        await Like.findByIdAndDelete(existingLike._id);
        return res
        .status(200)
        .json(new ApiResponse(200, {},"Comment unliked Successfully"));
    }

    const likeComment = await Like.create({
        tweet: tweetId,
        likedBy: userId
    })

    return res
    .status(201)
    .json(new ApiResponse(201,{}, "Comment Liked Successfully"));

});
const getLikedVideos = asyncHandler( async (req,res) => {

    const userId = req.user._id;

    /* 
    We are querying the Like model to find all the Like documents where userId matches with our specific
    user 
    why are we using $exists for video field, because we are checking whether video field is in their doc
    or not, because Like model is storing likes for multiple fields like video, tweet, comment
    */

    const likedVideos = await Like.find({

        likedBy: userId,
        video: {$exists: "true"}

    }).populate("video", "_id title url")

    //  Why use `.populate()`?
    //  - The `Like` model only stores a reference id to the liked video.
    //  - Using `.populate("video", "_id title url")` replaces that ID with actual video data.
    //  - This means the response includes useful info like `title` and `url`, not just an ID.

    return res
    .status(200)
    .json(
      new ApiResponse(200, likedVideos, "Liked videos fetched successfully")
    )

});

export {toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos};