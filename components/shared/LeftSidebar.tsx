"use client"
import {sidebarLinks}  from '@/constants/index'
import { SignedIn, SignOutButton, useAuth, useUser } from '@clerk/nextjs'
import { useClerk } from "@clerk/nextjs";
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'


function LeftSidebar(){
    const router = useRouter();
    const pathname = usePathname();
    const {signOut} = useClerk()
    const {userId} = useAuth();

   const handleSignOut = async () => {
    await signOut();
    router.push("/sign-in");
  };

    return(
        <section className='custom-scrollbar leftsidebar'>
            <div className="flex w-full flex-1 flex-col gap-6 px-6">
                {sidebarLinks.map((link) =>{
                
                const isActive = (pathname.includes(link.route) && link.route.length > 1) || pathname === link.route
                const linkHref =
                    link.route === "/profile" && userId
                        ? `${link.route}/${userId}`
                        : link.route;

                return (
                    <Link
                        href={linkHref}
                        key={link.label}
                        className={`leftsidebar_link ${isActive && 'bg-primary-500'}`}>
                        <Image src={link.imgURL} alt={link.label} width={24} height={24} />
                        <p className='text-light-1 max-lg:hidden'>{link.label}</p>    
                    </Link>
                )})}
            </div>

            <div className='mt-10 px-6'>
                <SignedIn>
                    <div onClick={handleSignOut} className="flex cursor-pointer gap-4 p-4">
                        <Image src="/assets/logout.svg" alt="logout" width={24} height={24} />
                        <p className='text-light-2 max-lg:hidden'>Log Out</p>
                    </div>
                </SignedIn>
            </div>
        </section>
    )
}

export default LeftSidebar