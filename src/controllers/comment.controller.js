import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { read } from "fs"
import { User } from "../models/user.model.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

     // 1=> check if video id and comment texts are present
    if(!videoId){
        throw new ApiError(404,"videoID not found")
    }

    const video = await Video.findById(videoId);
    if(!video){
        throw new ApiError(404,"video not found")
    }
  
    // 2=> get comment 
    const comments = await Comment.aggregate([
        {
            $match : {
                video : new mongoose.Types.ObjectId(videoId)
            },
        },
        {
            $lookup:{
                from : "users",
                localField : "owner",
                foreignField : "_id",
                as: "ownerDetails"
            },
        },
        {
            $unwind : "$ownerDetails",
        },
        {
            $project : { 
                _id : 1,
                content : 1,
                ownerName : "$ownerDetails.userName",
                avatar : "$ownerDetails.avatar",
            },
        },
    ]);

    return res.
           status(200).json(new ApiResponse(200,"all comments are fetched successfully"));
})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const {videoId} = req.params;
    const {content} = req.body;
  
     
    // 1=> check if video id and comment texts are present
    if(!videoId){
        throw new ApiError(404,"videoID not found")
    }
    if(!content){
        throw new ApiError(404,"comment content is required");
    }
    // optionally validate comment length and format

    //2=> check if video exists
    const video = await Video.findById(videoId);
    if(!video){
        throw new ApiError(404,"video not found");
    }

    // 3=>create comment
    const commentInfo = await Comment.create({
        content,
        video : videoId,
        owner : req.user._id,
    });

    if(!commentInfo){
        throw new ApiError(500,
            "something went wrong while publishing comment"
        );
    }
   
    return res.
           status(200).json(new ApiResponse(201,commentInfo,"comment added successFully"))
 })

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const {commentId} = req.params
    const {content} = req.body
    //1=> check for comment id
    if(!commentId){
        throw new ApiError(404,"comment id not found from request parameters")

    }

    //2=> check for comment

    const comment = await Comment.findById(commentId)
    
    if(!comment){
     throw new ApiError(404,"comment  not found")
    }
   
    // 3=>check content
     if(!content || content.trim()===""){
        throw new ApiError(404,"comment content is required");
    }

   // 4=>ownership
 
    const user = await User.findById(req.user._id);
    if(!user){
        throw new ApiError(404,"User not found");
    }

    if(user._id.toString() !== comment.owner.toString()){
       throw new ApiError(404,"You are not authorized to update the comment");

    }

    comment.content = content.trim();
    const updatedContent = await comment.save();


  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedComment, "comment updated successfully !")
    );

})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment

    const {commentId} = req.params
    if(!commentId){
        throw new ApiError(404,"comment is is missing from request parameters");
    }

    const comment = await Comment.findById(commentId);
    if(!comment){
        throw new ApiError(404,"comment not found");
    }

    const user = await User.findById(req.user._id);
    if(!user){
        throw new ApiError(404,"user not found");

    }

    if(user._id.toString() !== comment.owner.toString()){
        throw new ApiError(403,"You are not authorized to delete the comment")
    }

    await Comment.deleteOne({_id : new mongoose.Types.ObjectId(commentId)});

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Comment deleted Successfully!"));
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }