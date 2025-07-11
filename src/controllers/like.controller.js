import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    const userId = req.user._id;
    //TODO: toggle like on video
    // Step 1: Check if like already exists
    const existingLike = await Like.findOne({
        video: videoId,
        likedBy: userId
    });

      if (existingLike) {
        // Step 2: If already liked, remove the like (unlike)
        await existingLike.deleteOne();
        return res.status(200).json({
            message: "Like removed",
            liked: false
        });
      }
      else{
        await Like.create({
            video : videoId,
            likedBy :userId
        });

        return res.status(200).json({
            message:"video liked",
            liked:true
        });
      }

});

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    const userId = req.user._id;
    //TODO: toggle like on comment
    const existingLike = await Like.findOne({
        comment : commentId,
        likedBy : userId,
    })

    if(existingLike){
        await existingLike.deleteOne();
        return res.status(200).json({
            message : "like removed from comment",
            liked : false
        });
    }
    else{
        await Like.create({
            comment : commentId,
            likedBy : userId
        });
        return res.status(200).json({
            message : "comment liked",
            liked : true
        })
    }


})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet
    const userId = req.user._id;

    const existingLike= await Like.findOne({
        tweet : tweetId,
        likedBy : userId
    });

    if(existingLike){
        await existingLike.deleteOne();
        return res.status(200).json({
            message : "tweet like deleted successfully",
            liked : false
        })
    }
    else{
        await existingLike.create({
            tweet : tweetId,
            likedBy : userId
        });

    }
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
 //method 1=>
//     const userId= req.user._id;

//     const likedVideos = await Like.find({
//         likedBy : userId,
//          video: { $ne: null } // only those that are for videos
//     }).populate("video");

// const videos = likedVideos.map(like => like.video);

//     return res.status(200).json({
//         total: videos.length,
//         videos
//     });

 // method 2= > using aggregation pipeline
    const userId = req.user._id;

  const likedvideos = await Like.aggregate([
    {
      $match: {
        comment: null,
        tweet: null,
        likedBy: userId,
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "likedvideoDetails",
      },
    },
    {
      $unwind: "$likedvideoDetails",
    },
    {
      $project: {
        title: "$likedvideoDetails.title",
        description: "$likedvideoDetails.description",
        videoFile: "$likedvideoDetails.videoFile",
        duration: "$likedvideoDetails.duration",
        thumbnail: "$likedvideoDetails.thumbnail",
        owner: "$likedvideoDetails.owner",
      },
    },
    ]);

  return res
    .status(200)
    .json(
      new ApiResponse(200, likedvideos, "liked videos fetched successFully !")
    );
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}