"use client";
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { useForm } from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Input } from "../ui/input";
// import { updateUser } from "@/lib/actions/user.actions";
import { usePathname, useRouter } from "next/navigation";
import { commentValidation } from '@/lib/validations/thread';
import Image from "next/image";
import { currentUser } from "@clerk/nextjs/server";
import { addCoomentToThread } from "@/lib/actions/thread.actions";


interface Props{
    threadId : string,
    currentUserImage : string,
    currentUserId : string
}

const Comment = ({threadId , currentUserImage , currentUserId} : Props) =>{

  const router = useRouter();
  const pathname = usePathname();

  
    const form = useForm({
        resolver :  zodResolver(commentValidation),
        defaultValues: {
            thread: '',
        }
    })

    const onSubmit= async (values: z.infer<typeof commentValidation>) =>{
        await addCoomentToThread(
            threadId, 
            values.thread , 
            currentUserId, 
            pathname
        )

        form.reset();
    }

    return(
        <div className="text-white">
        <Form {...form}>
            <form 
            onSubmit={form.handleSubmit(onSubmit)} 
            className="comment-form">

                <FormField
                    control={form.control}
                    name="thread"
                    render={({ field }) => (
                        <FormItem className="flex w-full items-center gap-3">
                        <FormLabel>
                            <Image src={currentUserImage} alt="profile image" width={48} height={48} className="rounded-full object-cover"/> 
                        </FormLabel>
                        <FormControl className="border-none bg-transparent">
                            <Input
                            type="text"
                            placeholder="comment"
                            className="no-focus text-light-1 outline-none"
                            {...field}
                            />
                        </FormControl>
                        </FormItem>
                    )}
                />
                <Button type="submit" className="comment-form_btn">
                    Reply
                </Button>
            </form>
        </Form>
        </div>
    )
}

export default Comment