import mongoose,{ isValidObjectId } from "mongoose"
import { Subscription } from "../models/subscription.model"
import { ApiError } from "../utils/ApiError"
import { ApiResponse } from "../utils/ApiResponse"
import { asyncHandler } from "../utils/asyncHandler"


const toggleSubscription = new asyncHandler( async( req,res) => {
    const { channelId } = req.params;

    const subscriberId = req.user?._id;

    if(!isValidObjectId(channelId)){
        throw new ApiError(400, "Channel ID is invalid")
    }

    if (subscriberId.toString() === channelId.toString()) {
        throw new ApiError(400, "You cannot subscribe to your own channel");
    }

    const existingSubscription = await Subscription.findOne({
        channel : channelId,
        subscriber: subscriberId 
    });

    if(existingSubscription){

        await Subscription.findByIdAndDelete(existingSubscription._id);
        return res
        .status(200)
        .json(
            new ApiResponse(200, {}, "Unsubscribed Successfully")
        )
    }

    await Subscription.create({
        channel : channelId,
        subscriber: subscriberId
    });

    return res
    .status(200)
    .json(
        new ApiResponse(200,{}, "Channel Subscribed Successfully")
    )
})

const getUserChannelSubscribers = new asyncHandler( async( req,res) => {

    const channelId = req.user._id;

    if(!isValidObjectId(channelId)){
        throw new ApiError(400, "Channel Id is invalid");
    }

    const subscriberDocs = await Subscription.find({
        channel : channelId
    }).populate("subscriber", "_id name email");

    if(!subscriberDocs){
        throw new ApiError(404,"This channel doesn't have any subscribers");
    }


    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            subscriberDocs,
            "User Channel Subsribers fetched Successfully"
        )
    )

    //     Alternative ways to fetch subscribers?
    //    - `Subscription.find({ channel: channelId }).lean()`: Returns a plain JavaScript object instead of a Mongoose document.
   
})

const getSubscribedChannels = asyncHandler(async (req,res) => {

    const subscriberId = req.user._id;

    const subscribedChannels = await Subscription.find({
        subscriber: subscriberId 
    }).populate("channel", "_id name email");

    if(!subscribedChannels || subscribedChannels.length === 0){
        throw new ApiError(404, "No subscribed Channels found")
    }

     /*  Why are we checking `subscribedChannels.length === 0`?
     - `.find()` always returns an array. If empty, that means no subscriptions exist.
     - Without this check, the user might receive an empty array instead of a proper message.
     */

    return res
    .status(200)
    .json(
        new ApiResponse(200, subscribedChannels, "Subscribed Channels fetched successfully")
    )
});


export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };