import { Router } from "express";       
import { loginoutUser,
         loginUser,
         registerUser,
         refreshAccessToken,
         changeCurrentPassword, 
         getCurrentUser, 
         updateAccountDetail, 
         updateUserAvatar, 
         removeUserAvatar, 
         removeUserCoverImage, 
         updateUserCoverImage, 
         getUserChannelProfile, 
         getWatchHistory } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multure.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router = Router()

router.route("/register").post(
    upload.fields([
        {
            name : "avatar",
            maxCount : 1
        },
        {
            name : "coverImage",
            maxCount : 1
        }
    ]),
    registerUser
)

router.route("/login").post(loginUser)

//secured routes

router.route("/logout").post(verifyJWT , loginoutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").post(verifyJWT,changeCurrentPassword)
router.route("/current-user").get(verifyJWT,getCurrentUser)
router.route("/update-account").patch(verifyJWT,updateAccountDetail)
router.route("/avatar").patch( verifyJWT , upload.single("avatar"),updateUserAvatar)
router.route("/remove-avatar").patch(verifyJWT,upload.single("removeAvatar"),removeUserAvatar)
router.route("/cover-image").patch(verifyJWT,upload.single("coverImage"),updateUserCoverImage)
router.route("/remove-cover-image").patch(verifyJWT,upload.single("removeCoverImage"),removeUserCoverImage)
router.route("/c/:username").get(verifyJWT,getUserChannelProfile)
router.route("/history").get(verifyJWT,getWatchHistory)

// getUserChannelProfile
export default router