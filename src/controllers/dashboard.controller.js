import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {Tweet} from "../models/tweet.model.js"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    // fetch userid, 

    const userId = req.user?._id;

    /*
    To Fetch total videos, will use countDocuments where owner of video is userId.
    */
   const totalVideos = await Video.countDocuments({owner : userId});

   if(totalVideos === null || totalVideos === undefined){
    throw new ApiError(
        500,
        "Something went wrong while loading videos."
    );
   }

   /*
        Fetching total Subscriber Counts, we will count Subscription documents where channel subscribed is userId. 
   */

    const totalChannelSubscribers = await Subscription.countDocuments({channel : userId});

    if(totalChannelSubscribers === null || totalChannelSubscribers === undefined){
        throw new ApiError(
            500,
            "Something went wrong while loading channel subscribers"
        );
    }

    /*
   Counting Total Likes Across All Videos Owned by the User
    - `Video.find({ owner: userId }).distinct("_id")`, stores the distinct id of those videos
      - Fetches all videos owned by the user and gets only their `_id`s (unique video IDs)
    - `$in: [array of video IDs]`
      - Finds all `Like` documents where `video` is in that array (videos owned by the user),
      - we will get all like documents for each video ID. and in last step
      - Counts them using `countDocuments()`
  */

    const totalVideoLikes = await Like.countDocuments({
        video: {
            $in : await Video.find({owner : userId}).distinct("_id")
        },
    });

    if(totalVideoLikes === null || totalVideoLikes === undefined){
        throw new ApiError(500,"Error while fetching likes across all videos");
    }

    /* 
        Fetch total Tweet Likes
        fetch all tweet documents with owner userID
    */

    const totalTweetLikes = await Like.countDocuments({
        tweet: {
            $in : await Tweet.find({owner : userId}).distinct("_id")
        },
    });
    
    if(totalTweetLikes === null || totalTweetLikes === undefined){
        throw new ApiError(
            500,
            "Something went wrong while loading total tweet likes"
        )
    };

    // fetch total comment likes

    const totalCommentLikes = await Like.countDocuments({
        comment: {
            $in : await Comment.find({owner : userId}).distinct("_id")
        },
    });

    if(totalCommentLikes === null || totalCommentLikes === undefined){
        throw new ApiError(
            500,
            "Something went wrong while loading total comment likes"
        );
    }

    /*
     Summing Up Total Views for All Videos Owned by the User
    - `$match: { owner: userId }` → Filters only videos owned by the user

    - ` in the $group:
      - `_id: null` means we're returning a single document and not grouping by any field
      - `$sum: "$views"` adds up all `views` field values across the matched videos
      
    - `totalViews[0]?.totalViews || 0`
      - MongoDB aggregation returns an array, so we access the first element (`totalViews[0]`)
  
  */

  /*
    
    Example: Suppose your videos have the following views:
    - Video A (101) → 1000 views
    - Video B (102) → 2500 views
    - Video C (103) → 4000 views
    
    How it works:
    1. `{ $match: { owner: userId } }`
       - Filters only YOUR videos in the `Video` collection.
    2. `{ $group: { _id: null, totalViews: { $sum: "$views" } } }`
       - Groups all matched videos into one result.
       - `$sum: "$views"` adds up all `views` fields → 1000 + 2500 + 4000 = 7500 Views.
  */

  const totalViews = await Video.aggregate([
    { $match: { owner: userId } },
    {
      $group: {
        _id: null,
        totalViews: { $sum: "$views" }, // Sum up the `views` field
      },
    },
  ]);

    if (totalViews === null || totalViews === undefined) {
    throw new ApiError(
      500,
      "Something went wrong while displaying total views"
    );
    }

  res.status(200).json(
    new ApiResponse(
      200,
      {
        totalVideos,
        totalChannelSubscribers,
        totalVideoLikes,
        totalTweetLikes,
        totalCommentLikes,
        totalViews: totalViews[0]?.totalViews || 0, // Default to 0 if no views are found
      },
      "Channel stats fetched successfully"
    )
  );

});

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    const userId = req.user?._id;

    const videos = await Video.find({
        owner: userId,
    }).sort({
        createdAt: -1, // Sorting videos in descending order (newest first)
    });

  // - This ensures that the client knows when a channel has no videos.
  if (!videos || videos.length === 0) {
    throw new ApiError(404, "No videos found for this channel");
  }

  res
    .status(200)
    .json(new ApiResponse(200, videos, "Channel videos fetched successfully"));
});

export {
    getChannelStats, 
    getChannelVideos
    }