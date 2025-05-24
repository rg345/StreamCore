import mongoose,{isValidObjectId} from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video

    //Step 1: Get the video ID 
    const {videoId} = req.params
    

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid Video ID")
    }

    console.log("Video Id :" , videoId, "Type: ", typeof videoId )

    /*
    Step 2: Convert videoId to ObjectId
    - MongoDB stores IDs as ObjectId, so we need to convert videoId (string) to ObjectId format.
    - This ensures correct matching in the database.
  */

    const videoObjectId = new mongoose.Types.ObjectId(String(videoId));

    /*
    Step 3: Extract pagination details from query parameters
    - If the client sends ?page=2&limit=5, then:
      - page = 2 (fetch second page of comments)
      - limit = 5 (fetch 5 comments per page)
    - If no values are provided, default to page 1 and limit 10
  */
    const {page = 1, limit = 10} = req.query
    const comments = await Comment.aggregate([
        {
            $match: {
                video : videoObjectId
            },
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "TargetVideo",
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "ownner",
                foreignField: "_id",
                as: "commentOwner"
            }
        }
    ])



})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }