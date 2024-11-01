"use client";

import { useMemo, useState } from "react";
import { ChevronDown, LucideIcon } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import SubMenuItem from "./sub-item";

interface ISidebarItem {
  name: string;
  path: string;
  icon: LucideIcon;
  items?: ISubItem[];
}

interface ISubItem {
  name: string;
  path: string;
}

const SidebarItem = ({ item }: { item: ISidebarItem }) => {
  const { name, icon: Icon, items, path } = item;
  const [expanded, setExpanded] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Track if the item is active
  const isActive = useMemo(() => {
    return items?.some((subItem) => subItem.path === pathname) || path === pathname;
  }, [items, path, pathname]);

  const handleClick = () => {
    if (items && items.length > 0) {
      setExpanded((prev) => !prev);
    } else {
      router.push(path);
    }
  };

  return (
    <>
      <div
        className={`flex items-center p-3 rounded-lg cursor-pointer justify-between
          ${isActive ? "bg-sidebar-background text-sidebar-active" : ""}
          hover:bg-sidebar-background hover:text-sidebar-active`}
        onClick={handleClick}
      >
        <div className="flex items-center space-x-2">
          <Icon size={20} />
          <span className="text-sm font-semibold">{name}</span>
        </div>
        {items && items.length > 0 && (
          <ChevronDown size={18} className={`${expanded ? "rotate-180" : ""}`} />
        )}
      </div>
      {expanded && items && items.length > 0 && (
        <div className="flex flex-col space-y-1 ml-10">
          {items.map((subItem) => (
            <SubMenuItem key={subItem.path} item={subItem} />
          ))}
        </div>
      )}
    </>
  );
};

export default SidebarItem;
