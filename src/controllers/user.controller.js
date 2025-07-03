import { asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {User} from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/Cloudinary.js";
import {ApiResponse} from "../utils/ApiResponse.js";

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

  if(incomingRefreshToken){
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





 



export {
    registerUser,
    loginUser,
    loginoutUser,
    refreshAccessToken
};