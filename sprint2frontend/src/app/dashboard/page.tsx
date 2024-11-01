// src/app/dashboard/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

const Dashboard = () => {
  const router = useRouter();

  useEffect(() => {
    const userId = sessionStorage.getItem("user_id");
    if (!userId) {
      router.replace("/login");
    }
  }, [router]);

  return <div>Welcome to the Dashboard</div>;
};

export default Dashboard;
