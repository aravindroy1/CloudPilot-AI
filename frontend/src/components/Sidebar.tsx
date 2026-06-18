"use client";

import { LayoutDashboard, MessageSquare, History, Settings, Cloud } from "lucide-react";
import Link from "next/link";

export default function Sidebar() {
  return (
    <div className="w-64 glass border-r h-screen flex flex-col pt-6 z-10 relative">
      <div className="px-6 pb-8 flex items-center gap-3">
        <div className="bg-primary-500 p-2 rounded-lg">
          <Cloud className="w-5 h-5 text-white" />
        </div>
        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
          CloudPilot AI
        </h1>
      </div>
      
      <nav className="flex-1 px-4 space-y-2">
        <Link href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/10 text-white font-medium border border-white/5 shadow-[0_0_15px_rgba(255,255,255,0.05)] transition-all">
          <MessageSquare className="w-5 h-5 text-primary-400" />
          <span>New Deployment</span>
        </Link>
        <Link href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
          <LayoutDashboard className="w-5 h-5" />
          <span>Dashboard</span>
        </Link>
        <Link href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
          <History className="w-5 h-5" />
          <span>History</span>
        </Link>
      </nav>
      
      <div className="p-4 border-t border-white/10">
        <Link href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
          <Settings className="w-5 h-5" />
          <span>Settings</span>
        </Link>
      </div>
    </div>
  );
}
