import mongoose,{Schema} from "mongoose";

const subscriptionSchema = new SchemaTypes({
    subscriber : {
        type : Schema.Types.ObjectId, // one who is subscribing
        ref : "User" 
    },
    channel : {
        type : Schema.Types.ObjectId, // one to whom 'subscriber' is subscribing
        ref : "User"
    }
},{timestamps : true })

export const sscription = mongoose.model("Subscription",subscriptionSchema)
