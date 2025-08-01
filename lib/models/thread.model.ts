import mongoose from "mongoose";

const threadSchema = new mongoose.Schema({
    text:{type: String , required: true},
    author : {  
        type:mongoose.Schema.Types.ObjectId ,    //So 'author' is the path that contains the ObjectId pointing to the User.
        ref :'User',
        required : true
    },
    community : {
        type : mongoose.Schema.Types.ObjectId,
        ref: 'Community'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    parentId:{
        type:String
    },
    children :[
        {
            type : mongoose.Schema.Types.ObjectId,
            ref: 'Thread'
        }
    ]
    // for multi level comment functionality because a comment can be a thread itself

})

const Thread = mongoose.models.Thread || mongoose.model('Thread', threadSchema)

export default Thread;

// children is for multi level commenting , every comment reply will have a parent comment