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
import { Input } from "@/components/ui/input"
import { useForm } from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod'
import { userValidation } from '@/lib/validations/user';
import * as z from 'zod'
import Image from "next/image";
import { ChangeEvent, useState } from "react";
import { Textarea } from "../ui/textarea";
import { isBase64Image } from "@/lib/utils";
import { useUploadThing } from "@/lib/uploadthing";
import { updateUser } from "@/lib/actions/user.actions";
import { usePathname, useRouter } from "next/navigation";



interface Props{
    user:{
        id: string;
        objectId: string;
        username : string;
        name: string;
        bio: string;
        image: string;
    };
    btnTitle : string;
}

const AccountProfile = ({user , btnTitle} : Props) =>{

  const [files, setFiles] = useState<File[]>([])
  // File is built in browser api type

  const router = useRouter();
  const pathname = usePathname();
  

  const {startUpload} = useUploadThing("media")
    
    const form = useForm({
        resolver :  zodResolver(userValidation),
        defaultValues: {
            profile_photo: user?.image || "",
            name : user?.name || "",
            username: user?.username || "",
            bio: user?.bio || ""
        }
    })

    const handleImage = (e: ChangeEvent<HTMLInputElement>, fieldChange: (value : string)=> void ) =>{
        e.preventDefault()

        const fileReader = new FileReader()  // Used to read file content as base64

        if(e.target.files && e.target.files.length > 0){ // Make sure files exist
          const file = e.target.files[0];  // Grab first file
          
          setFiles(Array.from(e.target.files))  //Save to local state for preview or further use

          if(!file.type.includes('image')) return;

          fileReader.onload = async (event)=>{
            const imageDataUrl = event.target?.result?.toString() || "";

            fieldChange(imageDataUrl)  // Send it to react-hook-form or your form state

          }

          fileReader.readAsDataURL(file);
        }
    }

    const onSubmit = async function onSubmit(values : z.infer<typeof userValidation>) {
      const blob = values.profile_photo;

      const hasImageChanged = isBase64Image(blob);

      if(hasImageChanged){
        const imgRes = await startUpload(files)

        if(imgRes && imgRes[0].ufsUrl ){
          values.profile_photo = imgRes[0].ufsUrl;  // returned in core.ts in (.uploadComplete)
        }
      }

      await updateUser({
       username: values.username,
       name : values.name,
       bio: values.bio,
       image: values.profile_photo,
       userId: user.id,
       path : pathname
    })

    if(pathname ===  '/profile/edit'){
      router.back();
    } else{
      router.push('/')
    }
  }

    return (
        <Form {...form}>
      <form 
      onSubmit={form.handleSubmit(onSubmit)} 
      className="flex flex-col justify-start gap-10">
        <FormField
          control={form.control}
          name="profile_photo"
          render={({ field }) => (
            <FormItem className="flex items-center gap-4">
              <FormLabel className="account-form_image-label">
                {field.value ? (
                    <Image src={field.value} alt="profile photo" width={96} height={96} priority className="rounded-full object-contain"/>
        
                ) :(
                    <Image src="/assets/profile.svg" alt="profile photo" width={24} height={24}  className="object-contain"/>
                )
            }
                </FormLabel>
              <FormControl className="flex-1 text-base-semibold text-gray-200">
                <Input type="file"
                accept="image/*"
                placeholder="Upload a photo"
                className="account-form_image-input"
                onChange={(e)=> handleImage(e , field.onChange)}
                />
              </FormControl>
              <FormMessage/>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem className="w-full">
                <FormLabel className="text-white">Name</FormLabel>
                <FormControl>
                  <input
                  type="text"
                  {...field}
                  className="bg-zinc-800 border border-zinc-600 text-white px-3 py-2 rounded-md w-full"
                  />
                </FormControl>
                <FormMessage/>
            </FormItem>
            )}
        />

        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem className="w-full">
                <FormLabel className="text-white">Usename</FormLabel>
                <FormControl>
                  <input
                  type="text"
                  {...field}
                  className="bg-zinc-800 border border-zinc-600 text-white px-3 py-2 rounded-md w-full"
                  />
                </FormControl>
                <FormMessage/>
            </FormItem>
            )}
        />

        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem className="w-full">
                <FormLabel className="text-white">Bio</FormLabel>
                <FormControl>
                  <Textarea
                  {...field}
                  className="bg-zinc-800 border border-zinc-600 text-white px-3 py-2 rounded-md w-full"
                  />
                </FormControl>
                <FormMessage/>
            </FormItem>
            )}
        />
        <Button type="submit" className="bg-primary-500">Submit</Button>
      </form>
    </Form>
    )
}

export default AccountProfile