import { v2 as cloudinary } from 'cloudinary';
import fs from "fs";

    // Configuration
    cloudinary.config({ 
        cloud_name: process.env.CLOUINARY_CLOUD_NAME, 
        api_key: process.env.CLOUINARY_API_KEY, 
        api_secret:process.env.CLOUINARY_API_SECRET 
    });
          
    const uploadOnCloudinary = async (localFilePath)=>{
        try{
          if(!localFilePath) return null
          //upload 
         const response =await cloudinary.uploader.upload(localFilePath,{
            resource_type : "auto"
          })
          // file has been uploaded successfully
           //console.log("file is uploaded on cloudinary",
             //response.url);
        fs.unlinkSync(localFilePath)
        return response;
            return response
        }catch(error){
            fs.unlinkSync(localFilePath) 
            // remove the locally saved file as the upload operation got failed
            return null
        }
    }

      
     export {uploadOnCloudinary}