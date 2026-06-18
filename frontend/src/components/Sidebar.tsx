"use client";

import { LayoutDashboard, MessageSquare, History, Settings, Cloud } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const pathname = usePathname();

  const getLinkClass = (path: string) => {
    const isActive = pathname === path;
    if (isActive) {
      return "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/10 text-white font-medium border border-white/5 shadow-[0_0_15px_rgba(255,255,255,0.05)] transition-all text-left";
    }
    return "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors text-left";
  };

  return (
    <div className="w-64 glass border-r h-screen flex flex-col pt-6 z-10 relative shrink-0">
      <div className="px-6 mb-8 flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
          <Cloud className="w-5 h-5 text-white" />
        </div>
        <h1 className="text-xl font-bold text-white tracking-tight">CloudPilot AI</h1>
      </div>
      
      <nav className="flex-1 px-4 space-y-2">
        <Link href="/" className={getLinkClass("/")}>
          <MessageSquare className={`w-5 h-5 ${pathname === "/" ? "text-primary-400" : ""}`} />
          <span>New Deployment</span>
        </Link>
        <Link href="/dashboard" className={getLinkClass("/dashboard")}>
          <LayoutDashboard className={`w-5 h-5 ${pathname === "/dashboard" ? "text-primary-400" : ""}`} />
          <span>Dashboard</span>
        </Link>
        <Link href="/history" className={getLinkClass("/history")}>
          <History className={`w-5 h-5 ${pathname === "/history" ? "text-primary-400" : ""}`} />
          <span>History</span>
        </Link>
      </nav>
      
      <div className="p-4 border-t border-white/10">
        <button onClick={() => alert("Settings panel is coming in the next update!")} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors text-left">
          <Settings className="w-5 h-5" />
          <span>Settings</span>
        </button>
      </div>
    </div>
  );
}
