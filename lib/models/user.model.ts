import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    id: {type: String, required: true},
    username: {type: String , required: true, unique:true},
    name:{type: String, required: true},
    image :String,
    bio :String,
    threads: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Thread'
    }],  // this means that one user can have multiple reference to threads in database
    onboarded:{
        type : Boolean,
        default: false
    },
    communities: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Community'
    }]
})

const User = mongoose.models.User || mongoose.model('User', userSchema)

export default User;