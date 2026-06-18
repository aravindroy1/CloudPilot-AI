"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  const isLoginPage = pathname === "/login";

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsAuthenticated(!!token);

    if (!token && !isLoginPage) {
      window.location.href = "/login";
    } else if (token && isLoginPage) {
      window.location.href = "/";
    }
  }, [pathname, isLoginPage]);

  if (isAuthenticated === null && !isLoginPage) {
    return <div className="h-screen w-screen flex items-center justify-center text-white">Loading...</div>;
  }

  if (isLoginPage) {
    return <main className="flex-1 flex flex-col h-screen overflow-hidden">{children}</main>;
  }

  return (
    <>
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {children}
      </main>
    </>
  );
}
