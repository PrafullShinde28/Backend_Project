import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import fs from "fs/promises";
import path from "path";


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
  
    // 1=> parse pagination values

   const pageNumber = parseInt(page,10);
   const pageLimit = paresInt(limit,10);
   const skip = (pageNumber-1)*pageLimit;

   // 2=> match stage
   const matchStage = {};

   if(query){
     matchStage.$or = [
        {title: { regex : query,$option : "i"}},
        {description : {regex: query,$option: "i"}},
     ];
   }

   if(userId) { 
     matchStage.owner = userId;
   }

   // 3=> sort stage

   const sortStage = {};
   sortStage[sortBy] = sortType == "desc" ? -1 : 1

   // 4=>run aggergation

   const videos = await Video.aggregate([
    {$match:matchStage},
    {$sort:sortStage},
    {$skip :skip},
    {$limit:pageLimit},
    {
        $lookup : {
            from : "users",
            localField : "owner",
            foreignField : "_id",
            as : "owner",
        },
    },
    {$unwind:"$owner"},
    {
        $project : {
            title: 1,
        description: 1,
        videoFile: 1,
        thumbnail: 1,
        views: 1,
        createdAt: 1,
        duration: 1,
        isPublished: 1,
        owner: {
          _id: 1,
          username: 1,
          avatar: 1,
          },
        }
    }
   ]);

   // 5=> get total count (opitonal for frontend developer easy to determine total matched videos)

   const total = await Video.countDocuments(matchStage)


   // 6=> send response 
   res.status(200).json({
    success: true,
    data: videos,
    total,
    page: pageNumber,
    pages: Math.ceil(total / limitNum),
   })

})

        const MAX_VIDEO_SIZE_MB = 100;
        const MAX_THUMBNAIL_SIZE_MB = 5;
const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video
    const user = req.user;

    if(!title || !description){
        throw new ApiError(400,"all files are required ")

    }
     
     const videoFile = req.files?.video?.[0];
    const thumbnailFile = req.files?.thumbnail?.[0];
   
     // 1=> validate video file type and size

     const validVideoType = ["video/mp4", "video/quicktime", "video/x-matroska"];
     if(!validVideoType.includes(videoFile.mimetype)) {
        throw new ApiError(400,"Video file too large. Max size is 100MB.");
     }
     if(videoFile.size > MAX_VIDEO_SIZE_MB*1024*1024){
        throw new ApiError("video file too large . max size is 100mb");
     }

    // 2=> validate thumbnail file type and size

    const validImageType = ["image/jpeg", "image/png", "image/webp"];
    if(!validImageType.includes(thumbnailFile.mimetype)){
         throw new ApiError(400,"thubnail file too large. Max size is 5MB.");

    }

    const videoLocalPath = videoFile.path;
    const thumbnailLocalPath = thumbnailFile.path;

    let videoUpload , thumbailUpload;

    try {
        // 3=> upload on cloudinary
        videoUpload = await uploadOnCloudinary(videoLocalPath,"video");
        thumbailUpload = await uploadOnCloudinary(thumbnailLocalPath,"image");

        if(!videoUpload?.secure_url || !thumbailUpload?.secure_url){
            throw new ApiError(500,"Failed to upload video or thumbnail to Cloudinary")
        }

        // save in DB
        const publishVideo = await Video.create({
            title,
            description,
            videoFile : videoUpload.secure_url,
            thumbnail : thumbailUpload.secure_url,
            duration : videoUpload.duration || 0,
            owner : user._id,

        });

        if(!publishVideo){
            throw new ApiError(500,"something went wrong while saving video");
        }

        return res
               .status(200)
               .json(new ApiResponse(200,publishAVideo,"video uploded successsfully"))
    }finally{
        try {
            await fs.unlink(videoLocalPath);
            await fs.unlink(thumbnailLocalPath);


        }catch(cleanupErr){
            console.error("Error deleting local files ",cleanupErr.message);

        }
    }
});

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail
    
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}