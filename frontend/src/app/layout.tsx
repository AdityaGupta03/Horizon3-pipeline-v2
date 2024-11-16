// src/app/layout.tsx
"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Sidebar from "@/components/sidebar";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const userId = sessionStorage.getItem("user_id");
    if (!userId) {
      setIsAuthenticated(false);
      // Redirect to the root path if user is not authenticated and not already on root
      if (pathname !== "/" && pathname !== "/verify") {
        router.replace("/");
      }
    } else {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, [router, pathname]);

  const handleLogout = () => {
    sessionStorage.clear();
    setIsAuthenticated(false);
    router.replace("/"); // Redirect to root after logout
  };

  if (isLoading) return null;

  const noSidebarRoutes = ["/", "/verify"];

  return (
    <html lang="en">
      <body>
        <div className="flex h-screen">
          {isAuthenticated && !noSidebarRoutes.includes(pathname) && (
            <Sidebar onLogout={handleLogout} />
          )}
          <main className="flex-grow p-4">{children}</main>
        </div>
      </body>
    </html>
  );
}
