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
   
    //TODO: get video by id
    // 1=> Extract videoId from URL

     const { videoId } = req.params

     // 2=> check video id is present 

     if(!videoId){
        throw new ApiError(400,"video id is not present ");
     }
 
     if (!mongoose.Types.ObjectId.isValid(videoId)) {
     throw new ApiError(400, "video id is not of type  mongoose");
    } 
     // 3=> find the video by id and populate owner info 
     const video = await Video.findById(videoId).populate("owner","_id username avatar");


     // 4=> check if video exists 
     if(!video){
        throw new ApiError(404,"video not found");
     }

     // 5=> increment view count 

     video.view +=1;
     await video.save();

     // 6=> send response 

     res.status(200).json(
        new ApiResponse(200,video,"video is fetched successfully")
     );
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  // 1. Validate videoId
  if (!videoId) {
    throw new ApiError(400, "Video ID is required");
  }
  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Invalid video ID format");
  }

  // 2. Find video
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  // 3. Check ownership
  if (video.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to update this video");
  }

  // 4. Update fields
  const { title, description } = req.body;
  if (title) video.title = title;
  if (description) video.description = description;

  // 5. Handle thumbnail upload if provided
  const newThumbnailFile = req.files?.thumbnail?.[0];
  if (newThumbnailFile) {
    const thumbnailPath = newThumbnailFile.path;

    // Upload to Cloudinary
    const uploadedThumbnail = await uploadOnCloudinary(thumbnailPath, "image");
    if (!uploadedThumbnail?.secure_url) {
      throw new ApiError(500, "Thumbnail upload failed");
    }

    video.thumbnail = uploadedThumbnail.secure_url;

    // Delete local file
    try {
      await fs.unlink(thumbnailPath);
    } catch (err) {
      console.error("Error deleting local thumbnail:", err.message);
    }
  }

  // 6. Save and respond
  await video.save();
  res.status(200).json({
    success: true,
    message: "Video updated successfully",
    data: video
  });
});



export const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  // 1. Validate videoId
  if (!videoId) {
    throw new ApiError(400, "Video ID is required");
  }
  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Invalid video ID format");
  }

  // 2. Find the video
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  // 3. Check ownership
  if (video.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to delete this video");
  }

  // 4. Optional: Delete thumbnail from Cloudinary
  // Only if you have a function to delete by public_id
  // const publicId = extractPublicIdFromUrl(video.thumbnail); // You need to write this helper
  // if (publicId) {
  //   await deleteFromCloudinary(publicId, "image");
  // }

  // 5. Delete video document
  await video.deleteOne();

  // 6. Response
  res.status(200).json({
    success: true,
    message: "Video deleted successfully"
  });
});


const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //1=> validate video id
   if (!videoId) {
    throw new ApiError(400, "Video ID is required");
  }
  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Invalid video ID format");
  }
 
  //2=>fetch the video from database using the video id
  const video = await Video.findById(videoId);

  // 3=>veirfy
  if (!video) {
  throw new ApiError(404, "Video not found");
 }

 //4=> verify ownership
if (video.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to togglePublishStatus this video");
  }

  //5=> Toggle the publish status
video.isPublished = !video.isPublished;

// Save the updated video
await video.save();

// Send success response
res.status(200).json({
  success: true,
  message: `Video is now ${video.isPublished ? "published" : "unpublished"}`,
  data: {
    videoId: video._id,
    isPublished: video.isPublished
  }
});


})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}