import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import Sidebar from "@/components/Sidebar";
import BrandLogo from "@/components/BrandLogo";
import SignOutButton from "@/components/SignOutButton";
import MobileNav from "@/components/MobileNav";
export default async function AppLayout({children}:{children:React.ReactNode}){const session=await getServerSession(authOptions);if(!session)redirect("/login");return <div className="flex min-h-screen bg-gray-50"><Sidebar role={session.user.role} userName={session.user.name??session.user.email??"User"}/><div className="flex min-w-0 flex-1 flex-col"><header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-gray-200 bg-white/95 px-4 lg:px-8"><MobileNav role={session.user.role} userName={session.user.name ?? session.user.email ?? "User"}/><div className="hidden sm:block lg:hidden"><BrandLogo compact/></div><div className="hidden text-sm font-medium text-gray-600 lg:block">Business Management</div><div className="lg:hidden"><SignOutButton/></div></header><main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">{children}</main></div></div>}
