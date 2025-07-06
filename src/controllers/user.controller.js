import { asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {User} from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/Cloudinary.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import mongoose from "mongoose";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    console.log("Trying to generate tokens for userId:", userId);

    const user = await User.findById(userId);
    
    if (!user) {
      throw new ApiError(404, "User not found during token generation");
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Something went wrong while generating refresh and access token");
  }
};

const registerUser = asyncHandler(async (req,res)=>{
      //get user detail from frontend
      //validation
      //check if user already exists : username , email
      //check for images , check for avatar
      // upload them to cloudinary , avatar
      //create user object - create entry in db
      // remove password and refresh token field from response
      // check for user creation
      //return res

      //1->get user detail from frontend

      const {fullname,email,username,password} = req.body
      console.log("email",email);

      //2->validation
      if(
        [fullname ,email,username,password].some((field)=>
            field?.trim() == "" ) 
      ){
        throw new ApiError(400,"All fields are required")
      }

       //3->check if user already exists : username , email 
       const existedUser = await User.findOne({
             $or : [{username},{email}]
     })

     if(existedUser){
        throw new ApiError(409,"User with email or username already exists")
     }

    // console.log(req.files);

     //4->check for images , check for avatar

     const avatarLocalPath =req.files?.avatar[0]?.path;
     //const coverImageLocalPath = req.files?.coverImage[0]?.path;
 
      let coverImageLocalPath;
     if(req.files  && Array.isArray(req.files.
        coverImage) && req.files.coverImage > 0){
            coverImageLocalPath = req.files?.coverImage[0]?.path;
         }

     if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is required") 
     }

     // 5-> upload them to cloudinary , avatar
   const avatar =  await uploadOnCloudinary(avatarLocalPath)
   const coverImage = await uploadOnCloudinary(coverImageLocalPath)
     
   // check 
    if(!avatar){
        throw new ApiError(400,"Avatar file is required") 
     }  

   //6->create user object - create entry in db

  const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email, 
        password,
        username:  username?.toLowerCase()

    })

   //7-> remove password and refresh token field from response
   const createdUser = await User.findById(user._id).select(
    "-password -refreshToken" //which are not used are added in syntax
   ) 
    
   if(!createdUser){
    throw new ApiError(500,"Something went wrong while registering the user ")
   }

  return res.status(201).json(
    new ApiResponse(200,createdUser,"User registered successfully")
  )

})  

const loginUser = asyncHandler(async (req,res)=>{
    //req body -> data
    // username or email
    // find the user
    // password check
    // access and refresh token
    //send cookies

    //1->req body -> data
    const {email , username,password}= req.body
    console.log(email);

    // 2->username or email
    if(!(username || email)){
      throw new ApiError(400,"username or email is required")
    }

    //3-> find the user

    const user = await User.findOne({
      $or : [{username},{email}]
    })

    if(!user){
      throw new ApiError(400,"user not found")
    }


    //4->password check

  const isPasswordValid =  await user.isPasswordCorrect(password)
   if(!isPasswordValid){
      throw new ApiError(401,"enter valid credential")
    }

    // 5-> // access and refresh token 

  const {accessToken,refreshToken} =await generateAccessAndRefreshToken(user._id)
  
   //6->send cookies

   const loggedInUser =await User.findById(user._id).select("-password -refreshToken")
   
   const option = {
    httpOnly : true,
    secure : true
   }

   

   
   return res
   .status(200)
   .cookie("accessToken",accessToken,option)
   .cookie("refreshToken",refreshToken,option)
   .json(
    new ApiResponse(
      200,
      {
        user : loggedInUser , accessToken ,
        refreshToken
      },
      "User logged In Successfully"
    )
   )
})

const loginoutUser = asyncHandler(async (req,res)=>{
    //find user 
    // remove the accessToken

    //1->find user 

    User.findByIdAndUpdate(
      req.user._id,
       { 
         $set : {
           refreshToken : undefined
         }
      },
      {
        new : true
      }
    )
 
      //2-> remove the accessToken

    const options = {
      httpOnly : true,
      secure : true
    }
 
      return res
      .status(200)
      .clearCookie("accessToken",options)
      .clearCookie("refreshToken",options)
      .json(
        new ApiResponse(200,{},"User logged out")
      )

})

const refreshAccessToken = asyncHandler (async(req,res)=>{
  req.cookies.refreshToken || req.body.refreshToken

  if(!incomingRefreshToken){
    throw new ApiError(404,"unauthorized request") 
  }

 try {
   const decodedToken = jwt.verify(
     incomingRefreshToken,
     process.env.REFRESH_TOKEN_SECRET
   ) 
  const user= User.findById(decodedToken?._id)
 
     if(!user){
       throw new ApiError(401,"Invalid refresh token")
     }
 
     if(incomingRefreshToken !== user?.refreshAccessToken){
       throw new ApiError(401,"Refresh token is expired or used")
     }
 
     const options = {
       httpOnly : true,
       secure : true
     }
 
    const{accessToken,refreshToken}= await generateAccessAndRefreshToken(user._id)
     return res
     .status(200)
     .cookie("accessToken",accessToken,options)
     .cookie("refreshToken",refreshToken,options)
     .json(
       new ApiResponse(
         200,
         {accessToken,refreshToken : newRefreshToken}
       )
     )
 } catch (error) {
    throw new ApiError(401,error?.message || " Invalid")
  }
})

const changeCurrentPassword = asyncHandler(async(req,res)=>{
  const {oldPassword,newPassword} = req.body

 const user = await user.findById(req.user?._id)
 const isPasswordCorrect= user.isPasswordCorrect(oldPassword)
  
 if(!isPasswordCorrect){
  throw new ApiError(400,"Invalid old password")
 }

 user.password = newPassword
 await user.save({validateBeforeSave : false})

 return res
 .status(200)
 .json(new ApiResponse(200,{},"Password is changed successfully"))
 
})

const getCurrentUser = asyncHandler(async(req,res)=>{
  return res
         .status(200)
         .json(new ApiResponse(200,res.user,"current user fetched successfully"))
})

const updateAccountDetail = asyncHandler(async(req,res)=>{
  const {fullname , email} = req.body

  if(!fullname || !email){
    throw new ApiError(400,"All fields are required")
  }

  User.findByIdAndUpdate(
    req.user?._id,
    {
      $set :  {
         fullName: fullName,
         email  :email

      }
    },
    {new : true}
  ).select("-password")

  return res
         .status(200)
         .json(new ApiResponse(200,user,"Account detail updated successfully"))
})

const updateUserAvatar = asyncHandler(async(req,res)=>{
 const avatarLocalPath= req.file?.path

 if(!avatarLocalPath){
  throw new ApiError(400,"Avatar files is missing")
 }

 

const avatar = await uploadOnCloudinary(avatarLocalPath)

if(!avatar.url){
  throw new ApiError(400,"Error while uploading on avatar")
}

 const user = await User.findOneAndUpdate(
  req.user?._id,
  {
     $set : {
       avatar : avatar.url
     }
  },{new : true}
 ).select("-password")


 return res
        .status(200)
        .json(new ApiResponse(200,user,"Account detail updated successfully"))

})

// to do -> delete old image - assgignment
const removeUserAvatar = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        avatar: null,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar image removed succesfully"));
});

const updateUserCoverImage = asyncHandler(async(req,res)=>{
 const coverImageLocalPath= req.file?.path

 if(!coverImageLocalPath){
  throw new ApiError(400,"Cover image files is missing")
 }

const coverImage = await uploadOnCloudinary(coverImageLocalPath)

if(!coverImage.url){
  throw new ApiError(400,"Error while uploading on coverImage")
}

 const user= await User.findOneAndUpdate(
  req.user?._id,
  {
     $set : {
       coverImage : coverImage.url
     }
  },{new : true}
 ).select("-password")
  
 return res
         .status(200)
         .json(new ApiResponse(200,user,"Account detail updated successfully"))

})

// to do -> delete old image - assgignment
const removeUserCoverImage = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        coverImage: null,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Cover image removed succesfully"));
});

const getUserChannelProfile = asyncHandler (async(req,res)=>{
      const {username}= req.params

      if(!username?.trim()){
        throw new ApiError(400,"username is missing")
      }

     const channel =await User.aggregate([
      {
          $match :{
            username : username?.toLowerCase()
          }
      },{
          $lookup:{
            from :"subscriptions",
            localField : "_id",
            foreignField : "channel",
            as : "subscribers"
          }
      },
      {
        $lookup :  {
          from :"subscriptions",
            localField : "_id",
            foreignField : "subscribers",
            as : "subscribeTo"
        }
      },
      {
        $addFields :  {
          subscribersCount : {
            $size : "$subscribers"
          },
          channelsSubscribedToCount : {
             $size : "$subscribeTo"
          },
          isSubscribed : {
            $cond : {
              if : {$in: [req.user?._id,"$subscribers.subscriber"]},
              then :true,
              else : false
            }
          }
        }
      },
      {
         $project : {
           fullName : 1,
           username : 1,
           subscribersCount : 1,
           channelsSubscribedToCount : 1,
           isSubscribed : 1,
           avatar : 1,
           coverImage : 1,
           email : 1 ,


         }
      }
     ])
     
     if(!channel?.length){
  throw new ApiError(404,"channel does not exists")
}

return res
       .status(200)
       .json(
        new ApiResponse(200,channel[0],"User channel fetched successfully")
       )

})



const getWatchHistory = asyncHandler(async(req,res)=>{
   const user = await User.aggregate([
     {
      $match : {
        _id : new mongoose.Types.ObjectId(req.user._id)
      }
     },
     {
      $lookup : {
        from : "videos",
        localField : "watchHistory",
        foreignField : "_id",
        as : "watchHistory",
        pipeline : [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    username: 1,
                    avatar: 1
                  }
                }
              ]
            }
          }
        ]
      }
     },{
      $addFields : {
        owner : {
          $first : "$owner"
        }
      }
     }
   ])

   return res
          .status(200)
          .json(
            new ApiResponse(200,
              user[0].getWatchHistory,
              "watched hisory fetched successfully"
            )
          )

})



export {
    registerUser,
    loginUser,
    loginoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetail,
    updateUserAvatar,
    updateUserCoverImage,
     removeUserAvatar ,
     removeUserCoverImage,
     getUserChannelProfile,
     getWatchHistory

};