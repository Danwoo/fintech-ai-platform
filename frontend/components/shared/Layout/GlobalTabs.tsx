"use client";

import { useCallback, useMemo } from "react";
import { Tabs } from "devextreme-react/tabs";
import Sortable from "devextreme-react/sortable";
import { useRouter } from "next/navigation";
import { useTabStore, OpenedTab } from "@/stores/shared/tabStore";

export function GlobalTabs() {
  const router = useRouter();
  const tabs = useTabStore((s) => s.tabs);
  const activeId = useTabStore((s) => s.activeId);
  const setActive = useTabStore((s) => s.setActive);
  const reorderTabs = useTabStore((s) => s.reorderTabs);

  const selectedIndex = useMemo(() => tabs.findIndex((t) => t.id === activeId), [tabs, activeId]);

  // 드래그 재정렬 시 iframe이 reload되지 않도록 DOM 순서 고정
  const iframeTabs = useMemo(() => [...tabs].sort((a, b) => a.id.localeCompare(b.id)), [tabs]);

  const handleSelectionChanged = useCallback(
    (e: any) => {
      const tab: OpenedTab | undefined = e.addedItems?.[0];
      if (!tab || tab.id === activeId) return;
      setActive(tab.id);
      router.replace(tab.path);
    },
    [router, setActive, activeId],
  );

  const handleCloseClick = useCallback(
    (e: React.MouseEvent, tab: OpenedTab) => {
      e.stopPropagation();
      e.preventDefault();
      const { tabs: currentTabs, activeId: currentActiveId, closeTab: doClose } = useTabStore.getState();
      const idx = currentTabs.findIndex((t) => t.id === tab.id);
      doClose(tab.id);
      if (currentActiveId === tab.id) {
        const next = useTabStore.getState();
        const nextTab = next.tabs[Math.min(idx, next.tabs.length - 1)] ?? null;
        if (nextTab) router.replace(nextTab.path);
      }
    },
    [router],
  );

  const renderTabTitle = useCallback(
    (tab: OpenedTab) => (
      <div className="flex items-center justify-between gap-1 w-full min-w-0">
        <span className="truncate min-w-0 text-sm text-left" title={tab.title}>
          {tab.title}
        </span>
        <i
          role="button"
          aria-label="close"
          className="dx-icon dx-icon-close hover:bg-gray-300 rounded flex-shrink-0 ml-auto"
          style={{ fontSize: 11, padding: 1 }}
          onClick={(e) => handleCloseClick(e, tab)}
        />
      </div>
    ),
    [handleCloseClick],
  );

  return (
    <div className="h-full flex flex-col">
      {tabs.length > 0 && (
        <div
          className="flex-shrink-0 global-tabs-wrap"
          style={{ background: "#f3f4f6", borderTop: "1px solid #e5e7eb" }}
        >
          <style>{`
            .global-tabs-wrap .dx-tabs,
            .global-tabs-wrap .dx-tabs-wrapper,
            .global-tabs-wrap .dx-tabs-scrollable,
            .global-tabs-wrap .dx-scrollable,
            .global-tabs-wrap .dx-scrollable-wrapper,
            .global-tabs-wrap .dx-scrollable-container,
            .global-tabs-wrap .dx-scrollable-content {
              background: transparent !important;
              border: none !important;
              box-shadow: none !important;
              outline: none !important;
            }
            .global-tabs-wrap .dx-tabs { min-height: 0 !important; }
            .global-tabs-wrap .dx-tabs::after,
            .global-tabs-wrap .dx-tabs::before,
            .global-tabs-wrap .dx-tabs-wrapper::after,
            .global-tabs-wrap .dx-tabs-wrapper::before { display: none !important; }
            .global-tabs-wrap .dx-tabs-wrapper { justify-content: flex-start !important; }
            .global-tabs-wrap .dx-tab {
              width: 130px !important;
              min-width: 130px !important;
              max-width: 130px !important;
              flex: 0 0 130px !important;
              padding: 4px 10px !important;
              min-height: 0 !important;
              background: transparent !important;
              border: none !important;
              box-shadow: none !important;
              outline: none !important;
              position: relative;
              color: #4b5563;
              transition: background-color 0.15s ease;
            }
            .global-tabs-wrap .dx-tab:hover:not(.dx-tab-selected) { background: rgba(255,255,255,0.5) !important; }
            .global-tabs-wrap .dx-tab:hover:not(.dx-tab-selected):not(.dx-state-active)::after {
              content: '' !important;
              position: absolute !important;
              left: 0 !important;
              right: 0 !important;
              top: auto !important;
              bottom: 0 !important;
              height: 2px !important;
              background: #9ca3af !important;
              border: none !important;
              display: block !important;
              pointer-events: none;
              z-index: 0;
            }
            .global-tabs-wrap .dx-tab.dx-tab-selected {
              background: #ffffff !important;
              color: #111827 !important;
              transition-property: none !important;
            }
            .global-tabs-wrap .dx-tab.dx-tab-selected::after {
              content: '' !important;
              position: absolute !important;
              left: 0 !important;
              right: 0 !important;
              top: auto !important;
              bottom: 0 !important;
              height: 2px !important;
              background: #3b82f6 !important;
              border: none !important;
              display: block !important;
              pointer-events: none;
              z-index: 2;
            }
            .global-tabs-wrap .dx-tab.dx-state-active::after,
            .global-tabs-wrap .dx-tab.dx-state-focused::after {
              border: none !important;
              border-block-start: none !important;
              border-block-end: none !important;
              border-inline-start: none !important;
              border-inline-end: none !important;
            }
            .global-tabs-wrap .dx-tab.dx-state-active:not(.dx-tab-selected)::after {
              content: '' !important;
              position: absolute !important;
              left: 0 !important;
              right: 0 !important;
              top: auto !important;
              bottom: 0 !important;
              height: 2px !important;
              background: #d1d5db !important;
              border: none !important;
              display: block !important;
              pointer-events: none;
              z-index: 1;
            }
            .global-tabs-wrap .dx-tabs-nav-button,
            .global-tabs-wrap .dx-tabs-nav-button-left,
            .global-tabs-wrap .dx-tabs-nav-button-right {
              background: transparent !important;
              border: none !important;
              outline: none !important;
              box-shadow: none !important;
            }
            .dx-sortable-placeholder {
              border-color: #9ca3af !important;
            }
            .global-tabs-wrap .dx-tab-content {
              display: flex !important;
              align-items: center !important;
              width: 100% !important;
            }
            .global-tabs-wrap .dx-tab-text {
              display: block !important;
              width: 100% !important;
              overflow: hidden !important;
              flex: 1 !important;
            }
          `}</style>
          <Sortable
            filter=".dx-tab"
            itemOrientation="horizontal"
            dragDirection="horizontal"
            dropFeedbackMode="indicate"
            onReorder={(e: any) => reorderTabs(e.fromIndex, e.toIndex)}
          >
            <Tabs
              dataSource={tabs}
              keyExpr="id"
              selectedIndex={selectedIndex >= 0 ? selectedIndex : 0}
              onSelectionChanged={handleSelectionChanged}
              itemRender={renderTabTitle}
              repaintChangesOnly
              scrollingEnabled
              scrollByContent
              showNavButtons
            />
          </Sortable>
        </div>
      )}
      <div className="flex-1 min-h-0 relative bg-gray-50">
        {iframeTabs.map((tab) => {
          const isActive = tab.id === activeId;
          return (
            <iframe
              key={tab.id}
              src={tab.path}
              className="absolute inset-0 w-full h-full border-0"
              style={{ visibility: isActive ? "visible" : "hidden", zIndex: isActive ? 1 : 0 }}
              title={tab.title}
            />
          );
        })}
      </div>
    </div>
  );
}
