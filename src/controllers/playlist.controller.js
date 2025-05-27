import mongoose,{ isValidObjectId } from "mongoose"
import { Playlist } from "../model/playlist.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const createPlaylist = asyncHandler( async(req,res) => {
    
    const {name, description} = req.body;

    //check if name or description are empty

    if(!name || !description){
        throw new ApiError(400,"name and description are required");
    }

    const playlist = await Playlist.create({
        owner : req.user?._id,
        name,
        description 
    });
    
    if(!playlist){
        throw new ApiError(500, "Error while creating playlist")
    };

    return res
    .status(200)
    .json(
        new ApiResponse(200,playlist, "Playlist has been created successfully")
    )

});

const getUserPlaylists = new asyncHandler( async (req,res) => {
    const { userId } = req.params;

    //diff between fetching userId from req.user._id and req.params is that, in params you can pass the userId of any user, for example in this case we might want to get the playlist created by some other user, while req.user._id is used in a jwt decoded session, we can only use this when we know that the user is currently logged in and we are fetching some details of the user itself

    const playlists = await Playlist.find({
        owner: userId
    })

    // If no playlists exist for the user, return a 404 error.
  if (!playlists || playlists.length === 0) {
    throw new ApiError(404, "Playlist not found");
  }

  /*
    Send a success response with the retrieved playlists.
    - The `playlists` array contains all playlists belonging to the user.
  */
  return res
    .status(200)
    .json(
      new ApiResponse(200, playlists, "User playlists fetched successfully")
    );

})

const getPlaylistById = new asyncHandler( async (req,res) => {
    const {playlistId} = req.params;

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "playlistId provided is invalid")
    };

    const playlist = await Playlist.findById( playlistId).populate("videos");

    if(!playlist){
        throw new ApiError(404, "Playlist not found");
    };

    return res
    .status(200)
    .json(
        new ApiResponse(200, playlist, "Playlist fetched successfully")
    )
})

const addVideoToPlaylist = new asyncHandler( async (req,res) => {

    const {playlistId, videoId} = req.params;

    if(!isValidObjectId(playlistId) || !isValidObjectId(videoId)){
        throw new ApiError(400, "Playlist Id and Video Id should be correct");
    }

    const updatedPlaylist = await Playlist.aggregate([
        {
            $match:{
                _id : new mongoose.Types.ObjectId(String(playlistId))
            }
        },
        {
            $addFields: {
                videos:{
                    $setUnion: ["$videos", [new mongoose.Types.ObjectId(String(videoId))]],
                },
            },
        },
        {
            $merge: {
                into: "playlists"
            }
        }
    ]);
    
    if(!updatedPlaylist){
        throw new ApiError(400, "Playlist not found or video is already present in the playlist");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, updatedPlaylist, "Video is added to the playlist successfully")
    );
})