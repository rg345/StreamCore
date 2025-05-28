import mongoose, {isValidObjectId} from "mongoose"
import { Tweet } from "../models/tweet.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const createTweet = asyncHandler( async(req,res) => {
    const { content } = req.body;
    const ownerId = req.user?._id;

    if(!content){
        throw new ApiError(400,"Tweet can't be empty");
    }

    const newTweet = await Tweet.create({
        content,
        owner: ownerId,
    })

    if(!newTweet){
        throw new ApiError(400,"There was some error while creating the tweet");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,newTweet,"Tweet has been created successfully")
    )

})

const getUserTweets = asyncHandler( async(req,res) => {
    
    const { userId } = req.params;

    if(!isValidObjectId(userId)){
        throw new ApiError(400,"User Id provided is invalid");
    }

    const Tweets = await Tweet.find({
        owner: userId,
    }).sort({createdAt: -1});   

    //createdAt : -1, because we want the newest tweets at top, if 
    //you want the oldest tweets use createdAt: 1; (1 in place of -1);

    if(!tweets || tweets.length === 0){
        throw new ApiError(404, "No tweets are found for this user");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,Tweets,"Tweets are fetched successfully")
    )
});

const updateTweet = asyncHandler( async(req,res) => {

    const userId = req.user._id;

    const { tweetId }= req.params;
    const { content } = req.body;

    if(!isValidObjectId(tweetId)){
        throw new ApiError(400, "Tweet Id is invalid");
    }

    const tweet = await Tweet.findById(tweetId);

    if(!tweet){
        throw new ApiError(404,"Tweet not found");
    }

    if(tweet.owner.toString() !== userId.toString()){
        throw new ApiError(400, "You can only update your own tweet");
    }

    const updatedTweet = await Tweet.findByIdAndUpdate(
        tweetId,
        {
            $set: {
                content
            }
        },
        {
            new: true
        }
    )

    return res
    .status(200)
    .json(
        new ApiResponse(200,updatedTweet,"Tweet updated successfully")
    )

});

const deleteTweet = asyncHandler( async( req,res) => {

    const { tweetId } = req.params;

    const userId = req.user._id;

    if(!isValidObjectId(tweetId)){
        throw new ApiError(400, "Tweet with provided tweetId doesn't exist");
    }

    const tweet = await Tweet.findById(tweetId);

    if(!tweet){
        throw new ApiError(400, "Something went wrong while fetching the tweet")
    }

    if(tweet.owner.toString() !== userId.toString()){
        throw new ApiError(400, "You can only delete your own tweets");
    }

    const deletedTweet = await Tweet.findByIdAndDelete(tweetId);


    if(!deletedTweet){
        throw new ApiError(500,"There occured some error while deleting the tweet");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,deletedTweet,"Tweet is deleted successfully")
    )
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };