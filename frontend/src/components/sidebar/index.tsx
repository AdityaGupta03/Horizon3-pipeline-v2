// src/components/sidebar/index.tsx

"use client";

import { LogOutIcon, GitFork, LayoutDashboard, Binary, CircleUserRound, } from "lucide-react";
import SidebarItem from "./item";
import path from "path";

const items = [
  { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { name: "Github", path: "/github", icon: GitFork },
  { name: "Binaries", path: "/binaries", icon: Binary },
  { name: "Account", path: "/accounts", icon: CircleUserRound },
  { name: "Reports", path: "/reports", icon: CircleUserRound }, 
  {name: "Actions", path: "/actions", icon: CircleUserRound},
  {name: "Teams", path: "/teams", icon: CircleUserRound},
];

const Sidebar = ({ onLogout }: { onLogout: () => void }) => {
  return (
    <div className="sidebar fixed top-0 left-0 h-screen w-64 bg-white shadow-lg p-6">
      <img className="h-20 w-auto mx-auto mb-8" src="/logo-expanded.png" alt="Logo" />
      <div className="flex flex-col space-y-4 text-gray-800">
        {items.map((item, index) => (
          <SidebarItem key={index} item={item} />
        ))}
        <div
          onClick={onLogout}
          className="flex items-center p-3 rounded-md cursor-pointer hover:bg-gray-200 transition-colors"
        >
          <LogOutIcon size={20} className="text-gray-700" />
          <span className="ml-2 text-sm font-medium text-gray-700">Logout</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
