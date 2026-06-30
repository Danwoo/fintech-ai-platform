// components/shared/ui/TabPanel.tsx
"use client";

import React, { useState, createContext, useContext } from "react";
import DevExtremeTabs, { Item } from "devextreme-react/tabs";

interface TabItem {
  id: string;
  text: string;
  icon?: string;
  badge?: string;
  disabled?: boolean;
}

interface Props {
  items: TabItem[];
  children: React.ReactNode;
  defaultTab?: string;
  onSelectionChanged?: (selectedItem: any) => void;
  className?: string;
}

const TabPanelContext = createContext<{ activeTab: string }>({ activeTab: "" });
const useTabPanelContext = () => useContext(TabPanelContext);

/**
 * 탭 헤더와 콘텐츠를 통합 관리하는 탭 패널 컴포넌트
 */
export function TabPanel({ items, children, defaultTab, onSelectionChanged, className }: Props) {
  const [activeTab, setActiveTab] = useState(defaultTab || items[0]?.id || "");
  const selectedIndex = items.findIndex((item) => item.id === activeTab);

  const handleItemClick = (e: any) => {
    const item = items[e.itemIndex];
    setActiveTab(item.id);
    onSelectionChanged?.(item);
  };

  return (
    <TabPanelContext.Provider value={{ activeTab }}>
      <div className="h-full flex flex-col">
        <div className="flex-shrink-0 mb-2">
          <div className="custom-tabs">
            <DevExtremeTabs
              selectedIndex={selectedIndex >= 0 ? selectedIndex : 0}
              onItemClick={handleItemClick}
              className={className}
              showNavButtons={false}
              scrollingEnabled={false}
              scrollByContent={false}
              focusStateEnabled={false}
              hoverStateEnabled={true}
            >
              {items.map((item, index) => (
                <Item
                  key={item.id || index}
                  text={item.text}
                  icon={item.icon}
                  badge={item.badge}
                  disabled={item.disabled}
                />
              ))}
            </DevExtremeTabs>
          </div>
        </div>
        <div className="flex-1 min-h-0">{children}</div>
      </div>

      <style jsx>{`
        .custom-tabs :global(.dx-tabs) {
          display: table;
          table-layout: fixed;
          width: 100%;
        }
        .custom-tabs :global(.dx-tab) {
          display: table-cell;
          text-align: center;
          background-color: #e5e7eb;
          cursor: pointer;
          outline: none;
          border: none;
        }
        .custom-tabs :global(.dx-tab.dx-tab-selected) {
          background-color: #ffffff;
        }
        .custom-tabs :global(.dx-tab.dx-state-disabled) {
          background-color: #f3f4f6;
          opacity: 0.6;
        }
        .custom-tabs :global(.dx-tab:hover:not(.dx-state-disabled):not(.dx-tab-selected)) {
          background-color: #f3f4f6;
        }
        .custom-tabs :global(.dx-tab:focus),
        .custom-tabs :global(.dx-tab.dx-state-focused) {
          outline: none;
          box-shadow: none;
        }
        .custom-tabs :global(.dx-tabs-nav-button) {
          display: none;
        }
      `}</style>
    </TabPanelContext.Provider>
  );
}

/**
 * 탭 콘텐츠 컴포넌트
 */
export const TabContent = ({
  tabId,
  children,
  className = "h-full",
}: {
  tabId: string;
  children: React.ReactNode;
  className?: string;
}) => {
  const { activeTab } = useTabPanelContext();
  const isActive = activeTab === tabId;
  const [mounted, setMounted] = React.useState(isActive);

  React.useEffect(() => {
    if (isActive && !mounted) setMounted(true);
  }, [isActive, mounted]);

  if (!mounted) return null;
  return (
    <div className={className} style={!isActive ? { display: "none" } : undefined}>
      {children}
    </div>
  );
};
