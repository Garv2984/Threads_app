import { ClerkProvider } from "@clerk/nextjs"
import { ReactNode } from "react";
import { Inter } from 'next/font/google'
import '../globals.css'

export const metadata = {
    title : 'Threads',
    description : 'A Next.js 13 Meta Threads Application'
}

const inter = Inter({subsets :["latin"] })

// as we are using typescript , we need to define the type of children , hence we defined the type React.ReactNode as type
// difference between typescript and js
export default function RootLayout({children} : {children: React.ReactNode}){
    return (
        <ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}>
            <html lang="en">
                <body className={`${inter.className} bg-dark-1`}>
                    <div className="w-full flex justify-center items-center min-h-screen">
                        {children}
                    </div>
                    
                </body>
            </html>
        </ClerkProvider>
    )
}