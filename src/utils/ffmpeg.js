import ffmpeg from "fluent-ffmpeg";

//Function to get the duration of a Video File
//This function takes the path of the video file and returns a promise
//The promise resolves with the duration of the video (in seconds ) or rejects if there's an error

export const getVideoDuration = (videoPath) => {
    return new Promise ((resolve,reject) => {
        
        ffmpeg.ffprobe(videoPath,(err,metadata) => {
            //ffprobe is a method provided by ffmpeg to analyze the video metadata
            if(err){
                //if error occurs reject promise , and return error 
                reject("Error extracting video duration");
            }else{
                //if successful, resolve the promise with duration of the video
                resolve(metadata.format.duration)
            }
        });
    });
};

/* 
     How does FFmpeg help us get the video duration?
   - `ffmpeg.ffprobe(videoPath, callback)` extracts metadata from the video.
   - `metadata.format.duration` gives the total duration of the video in seconds.
   - We wrap this in a Promise to use it asynchronously.

*/