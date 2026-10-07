"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface TabItem {
  value: string;
  label: string;
  content: React.ReactNode;
}

export interface TabsProps {
  tabs: TabItem[];
  defaultValue?: string;
  className?: string;
}

export function Tabs({ tabs, defaultValue, className }: TabsProps) {
  const [active, setActive] = React.useState(defaultValue ?? tabs[0]?.value);
  const tabRefs = React.useRef<Record<string, HTMLButtonElement | null>>({});

  function onKeyDown(e: React.KeyboardEvent, index: number) {
    let nextIndex: number | null = null;
    if (e.key === "ArrowRight") nextIndex = (index + 1) % tabs.length;
    if (e.key === "ArrowLeft") nextIndex = (index - 1 + tabs.length) % tabs.length;
    if (nextIndex !== null) {
      e.preventDefault();
      const next = tabs[nextIndex];
      setActive(next.value);
      tabRefs.current[next.value]?.focus();
    }
  }

  return (
    <div className={className}>
      <div role="tablist" className="flex gap-1 border-b border-border">
        {tabs.map((tab, i) => (
          <button
            key={tab.value}
            ref={(el) => {
              tabRefs.current[tab.value] = el;
            }}
            role="tab"
            id={`tab-${tab.value}`}
            aria-selected={active === tab.value}
            aria-controls={`panel-${tab.value}`}
            tabIndex={active === tab.value ? 0 : -1}
            onClick={() => setActive(tab.value)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={cn(
              "relative px-4 py-2.5 text-sm font-medium text-charcoal-400 transition-colors",
              active === tab.value && "text-purple-700"
            )}
          >
            {tab.label}
            {active === tab.value && (
              <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-purple-700" />
            )}
          </button>
        ))}
      </div>
      {tabs.map(
        (tab) =>
          active === tab.value && (
            <div
              key={tab.value}
              role="tabpanel"
              id={`panel-${tab.value}`}
              aria-labelledby={`tab-${tab.value}`}
              className="animate-fade-in pt-4"
            >
              {tab.content}
            </div>
          )
      )}
    </div>
  );
}
