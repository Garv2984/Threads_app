"use server";
import { revalidatePath } from "next/cache";
import Thread from "../models/thread.model";
import User from "../models/user.model";
import { connectToDB } from "../mongoose";
import { Children } from "react";

interface Params{
    text: string,
    author: string,
    communityId : string | null,
    path: string
}

export async function createThread({text,author,communityId,path}:Params){
    try{
        connectToDB()

        const createdThread = await Thread.create({
            text,
            author,
            community : null,
        })

        // update user model
        await User.findByIdAndUpdate(author,{
            $push : {threads : createdThread._id}
        })

        revalidatePath(path);
    }

    catch(error : any){
        throw new Error(`Error creating thread : ${error.message}`)
    }
    
}



// fetching posts for home page
export async function fetchPosts(pageNumber = 1 , pageSize=20){
    connectToDB();

    // calculate no of posts to skip
    const skipAmount = (pageNumber-1)* pageSize;

    // fetch the posts that have no parents( top -level threads..)
    const postQuery = Thread.find({parentId : { $in: [null, undefined]}})
        .sort({createdAt: 'descending'})
        .skip(skipAmount)
        .populate({path: 'author', model : User})     // .Populate does is It replaces the ObjectId with the full document from the related model.
        .populate({       // now populating comments of all the threads
            path: 'children',
            populate:{
                path: 'author',
                model: User,
                select : "_id name parentId image"
            }
        })

     const totalPostsCounts = await Thread.countDocuments({parentId : { $in: [null, undefined]}})   

     const posts = await postQuery.exec()

     const isNext = totalPostsCounts > skipAmount + posts.length;

     return {posts , isNext}
}


// fetching thread by id
export async function fetchThreadById(id : string){
    connectToDB();

    try{
        // TODO : POPULATE COMMUNITY
        const thread = await Thread.findById(id)
            .populate({                // the thread
                path: 'author',
                model : User,
                select: "_id id name image"
            })
            .populate({
                path :'children',
                populate : [       // comment (is a thread itself with parent)
                    {
                        path : 'author',
                        model :User,
                        select : "_id id image name parentId"
                    },
                    {
                        path :'children',      // comment on the comment
                        model :Thread,
                        populate:{
                            path :'author',
                            model :User,
                            select : "_id id name image parentId"
                        }
                    }
                ]
            }).exec();

            return thread;
    }
    catch(error : any){
        console.log(error.message)
    }
}


// commenting on a thread
export async function addCoomentToThread(
    threadId : string,
    commentText : string,
    userId : string,
    path : string
){
    connectToDB();
    try{
        // find original thread to its id

        const originalThread = await Thread.findById(threadId)

        if(!originalThread) throw new Error('Thread not found')

        // create a new thread with comment text
        const commentThread = new Thread({
            text : commentText,
            author : userId,
            parentId : threadId,

        })

        const savedComment = await commentThread.save();

        originalThread.children.push(savedComment._id)

        // save the original thread
        await originalThread.save()

        revalidatePath(path)
    }
    catch(error : any){
        console.log(error.message)
    }
}

export async function fetchUserPosts(userId: string){
    try{    
        connectToDB();

        // find all threads authored by user with given userId
        const threads = await User.findOne({id : userId})
            .populate({
                path : 'threads',
                model : Thread,
                populate:{
                    path : 'children',
                    model :Thread,
                    populate:{
                        path :'author',
                        model :User,
                        select :"name image id"
                    }
                }
            })

            return threads;
    }
    catch(error: any){
        console.log(error.message)
    }
}