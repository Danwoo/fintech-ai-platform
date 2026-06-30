"use client";

import { useRouter, usePathname } from "next/navigation";
import { Drawer } from "devextreme-react/drawer";
import { TreeView } from "devextreme-react/tree-view";
import { ReactNode, useRef, useEffect, useCallback } from "react";
import { useNavStore } from "@/stores/shared/navStore";
import { useTabStore } from "@/stores/shared/tabStore";

interface Props {
  isDrawerOpen: boolean;
  children: ReactNode;
}

interface NavItem {
  id: string;
  text: string;
  icon?: string;
  path?: string;
  items?: NavItem[];
}

export function Sidebar({ isDrawerOpen, children }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const treeViewRef = useRef<any>(null);
  const navItems = useNavStore((s) => s.items);

  useEffect(() => {
    if (!treeViewRef.current?.instance || navItems.length === 0) return;

    const treeView = treeViewRef.current.instance;
    const pathKeys: string[] = [];

    const searchPath = (items: NavItem[], parentKeys: string[] = []): boolean => {
      for (const item of items) {
        if (item.path === pathname || (item.path && pathname.endsWith(item.path))) {
          pathKeys.push(...parentKeys, item.id);
          return true;
        }
        if (item.items && searchPath(item.items, [...parentKeys, item.id])) {
          return true;
        }
      }
      return false;
    };

    searchPath(navItems);

    if (!treeView || typeof treeView.expandItem !== "function") return;

    pathKeys.slice(0, -1).forEach((key) => {
      treeView.expandItem(key).catch(() => {});
    });

    if (pathKeys.length > 0 && typeof treeView.selectItem === "function") {
      treeView.selectItem(pathKeys[pathKeys.length - 1]).catch(() => {});
    }
  }, [pathname, navItems]);

  const openTab = useTabStore((s) => s.openTab);

  const handleItemClick = useCallback(
    (e: any) => {
      const item = e.itemData;
      if (!item?.path) return;
      openTab({ id: item.id, title: item.text, path: item.path });
      router.replace(item.path);
    },
    [router, openTab],
  );

  const renderItem = useCallback((item: any) => {
    const treeViewInstance = treeViewRef.current?.instance;
    const selectedItems = treeViewInstance?.getSelectedItems?.() || [];
    const isSelected = selectedItems[0]?.id === item.id;

    return (
      <div
        className={`
          flex items-center py-1.5 px-2 cursor-pointer rounded hover:bg-gray-200 transition-colors
          ${isSelected ? "!bg-blue-500 !text-white shadow-sm hover:!bg-blue-600" : ""}
        `}
        style={{
          backgroundColor: isSelected ? "#3b82f6" : "transparent",
          color: isSelected ? "#ffffff" : undefined,
          width: "100%",
          boxSizing: "border-box",
        }}
        onMouseEnter={(e) => isSelected && (e.currentTarget.style.backgroundColor = "#2563eb")}
        onMouseLeave={(e) => isSelected && (e.currentTarget.style.backgroundColor = "#3b82f6")}
      >
        {item.icon && (
          <i
            className={`dx-icon dx-icon-${item.icon} mr-2 flex-shrink-0`}
            style={{
              width: "18px",
              height: "18px",
              fontSize: "16px",
              color: isSelected ? "#dbeafe" : "#6b7280",
            }}
          />
        )}
        <span style={{ fontSize: "15px" }}>{item.text}</span>
      </div>
    );
  }, []);

  const renderSidebarContent = useCallback(
    () => (
      <div className="bg-[#F0F1F2] h-full w-[250px] p-2 overflow-y-auto">
        <style>{`
          .dx-treeview-item-content,
          .dx-treeview-item {
            width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .dx-treeview-node-container {
            padding: 0 !important;
          }
          .dx-treeview-node {
            padding: 0 4px !important;
            width: 100% !important;
          }
        `}</style>
        <TreeView
          ref={treeViewRef}
          items={navItems}
          keyExpr="id"
          displayExpr="text"
          selectionMode="single"
          expandEvent="click"
          onItemClick={handleItemClick}
          itemRender={renderItem}
          width="100%"
          height="100%"
        />
      </div>
    ),
    [handleItemClick, renderItem, navItems],
  );

  return (
    <Drawer
      opened={isDrawerOpen}
      openedStateMode="shrink"
      position="left"
      revealMode="slide"
      minSize={0}
      maxSize={250}
      component={renderSidebarContent}
      height="100%"
      closeOnOutsideClick={false}
    >
      <div className="w-full h-full overflow-x-hidden">{children}</div>
    </Drawer>
  );
}
