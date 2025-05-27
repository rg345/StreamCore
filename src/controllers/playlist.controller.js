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

const getUserPlaylists = asyncHandler( async (req,res) => {
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

const getPlaylistById = asyncHandler( async (req,res) => {
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

const addVideoToPlaylist = asyncHandler( async (req,res) => {

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

// Alternative method using `findByIdAndUpdate`
//   
//    const updatedPlaylist = await Playlist.findByIdAndUpdate(
//      playlistId,
//      { $addToSet: { videos: videoId } }, // $addToSet ensures uniqueness
//      { new: true }
//    );

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  
  const { playlistId, videoId } = req.params;

  // Validate both IDs to make sure they're legit MongoDB ObjectIds
  if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid playlist or video ID");
  }

  /*

    - `findByIdAndUpdate(playlistId, update, options)`: 
      - Finds a playlist by its ID.
      - Updates it based on the provided modifications.
    - `$pull`: 
      - Removes a specific value from an array.
      - Here, it removes `videoId` from the `videos` array.
    - `new: true`: 
      - Ensures we get the updated playlist as a response.

  */
  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $pull: {
        videos: new mongoose.Types.ObjectId(String(videoId)),
      },
    },
    {
      new: true,
    }
  );

  // If no playlist is found, return a 404 error.
  if (!updatedPlaylist) {
    throw new ApiError(404, "Playlist not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedPlaylist,
        "Video removed from playlist successfully"
      )
    );
});
const deletePlaylist = asyncHandler(async (req, res) => {
  
  const { playlistId } = req.params;

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlist ID");
  }

  /*
    Delete the playlist from the database using findByIdAndDelete.
    - If the playlist exists, it will be removed from the database.
  */
  const deletedPlaylistDoc = await Playlist.findByIdAndDelete(playlistId);

  // If no playlist is found, return a 404 error.
  if (!deletedPlaylistDoc) {
    throw new ApiError(404, "Playlist not found");
  }

  /*
    Send a success response with the deleted playlist details.
    - The response includes the deleted playlist's data.
  */
  return res
    .status(200)
    .json(
      new ApiResponse(200, deletedPlaylistDoc, "Playlist deleted successfully")
    );
});

const updatePlaylist = asyncHandler(async (req, res) => {
  /*
     Extracting playlistId and new playlist details from the request.
    - `playlistId` is the unique ID of the playlist to be updated.
    - `name` and `description` contain the updated values for the playlist.
  */
  const { playlistId } = req.params;
  const { name, description } = req.body;

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlist ID");
  }

  if (!name || !description) {
    throw new ApiError(400, "Name or description cannot be empty");
  }

  /*
     Step 3: Find and update the playlist in the database
    - `findByIdAndUpdate` is used to locate and modify the playlist document.
    - `$set: { name, description }` updates the playlist with new values.
    - `{ new: true }` ensures the updated document is returned.
  */
  const updatedPlaylistDoc = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $set: {
        name,
        description,
      },
    },
    {
      new: true,
    }
  );

  if (!updatedPlaylistDoc) {
    throw new ApiError(404, "Playlist not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedPlaylistDoc, "Playlist updated successfully")
    );
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};