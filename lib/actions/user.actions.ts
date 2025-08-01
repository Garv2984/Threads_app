"use server"
import { revalidatePath } from "next/cache";
import  User  from "../models/user.model"
import { connectToDB } from "../mongoose"
import { FilterQuery, SortOrder } from "mongoose";
import Thread from "../models/thread.model";

  // we are using server functions

//   defining types of strings
  interface Params {
    userId : string,
    username : string,
    name: string,
    bio: string,
    image: string,
    path: string
  }

export async function updateUser({
    userId ,
    username ,
    name ,
    bio,
    image,
    path
}: Params) : Promise<void> {
    connectToDB();

    try{
        await User.findOneAndUpdate(
        {id : userId},
        {
            username: username.toLowerCase(),
            name,
            bio,
            image,
            onboarded : true
        },
        {upsert : true}  // both updating and inserting (a DB operation)
    )

    if(path === '/profile/edit'){
        revalidatePath(path) 
    }
    }
    catch(error : any){
        throw new Error(`Failed to create/update user : ${error.message}`)
    }
    
}

export async function fetchUser(userId : string){
  try{
    connectToDB()

    return await User
    .findOne({id : userId})
    // .populate({
    //   path: 'communities',
    //   model : Community
    // })
  }
  catch(error){
    console.log(error)
  }
}


// fetching all the users
export async function fetchUsers({
  userId,
  searchString= "",
  pageNumber = 1,
  pageSize =20,
  sortBy ="desc"
 } : {
  userId : string,
  searchString? : string,
  pageNumber? : number,
  pageSize? : number,
  sortBy? :SortOrder 
 }){
  try{
    connectToDB()

    const skipAmount = (pageNumber-1) * pageSize;

    // regex is used for partial string matching
    const regex = new RegExp(searchString, "i")    //case insensive regular expression for searching(i means insensitive)

    const query: FilterQuery<typeof User> = {
      id : { $ne: userId }       //filters out current user
    }

    if(searchString.trim() !== ''){           // search operattion based on regex
      query.$or =[
        {username:{$regex : regex}},
        {name : {$regex : regex}}
      ]
    }

    const sortOptions = {createdAt : sortBy}

    const usersQuery = User.find(query)
      .sort(sortOptions)
      .skip(skipAmount)
      .limit(pageSize)

      const totalUsersCount = await User.countDocuments(query)

      const users = await usersQuery.exec()

      const isNext = totalUsersCount > skipAmount + users.length;  // if there is a next page

      return {users , isNext}

  }
  catch(error:any){
    console.log(error)
  }
}



// fetching activities
export async function getActivity(userId : string){
  try{
    connectToDB()

    // find all threads created by user
    const userThreads = await Thread.find({author : userId})

    // collect all the hcild thread id (replies) from the children fields
    const childThreadIds = userThreads.reduce((acc, userThread) =>{
      return acc.concat(userThread.children)
    } ,[])

    const replies = await Thread.find({    //getting all replies excluding those made by same user
      _id : {$in : childThreadIds},
      author :{$ne: userId}
    }).populate({           
      path: 'author',
      model :User,
      select: "name image _id"
    })

    //jaha bhi models mein type (mongoose.Schema.Types.ObjectId) hoga , ab isme hume .populate ka use krke author, jo ki ek objectId ki form mein hai , uska original document dikhane mein madad krega, iskiye hum  ref daalte hai model mein
    return replies;
  }
  catch(error: any){
    console.log(error)
  }
}