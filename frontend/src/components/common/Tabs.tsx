import React, { useState, useRef, useEffect } from 'react';
import { Tabs as ShadcnTabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: number | string;
  disabled?: boolean;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
  variant?: 'default' | 'pills' | 'underline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Tabs Component
 * Apple Glass Design Tabs with smooth animations
 */
export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  variant = 'default',
  size = 'md',
  className = ''
}) => {
  const [indicatorStyle, setIndicatorStyle] = useState({});
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const activeIndex = tabs.findIndex(tab => tab.id === activeTab);
    if (activeIndex !== -1 && tabsRef.current[activeIndex]) {
      const activeTabElement = tabsRef.current[activeIndex];
      if (activeTabElement) {
        setIndicatorStyle({
          left: activeTabElement.offsetLeft,
          width: activeTabElement.offsetWidth
        });
      }
    }
  }, [activeTab, tabs]);

  const sizes = {
    sm: 'text-sm px-3 py-1.5',
    md: 'text-base px-4 py-2',
    lg: 'text-lg px-5 py-2.5'
  };

  const renderDefaultTabs = () => (
    <ShadcnTabs value={activeTab} onValueChange={onChange} className={cn("w-full", className)}>
      <TabsList className="relative inline-flex rounded-lg bg-gray-100/50 dark:bg-gray-800/50 backdrop-blur-sm p-1">
        {tabs.map((tab, index) => (
          <TabsTrigger
            key={tab.id}
            value={tab.id}
            disabled={tab.disabled}
            ref={(el: HTMLButtonElement | null) => { tabsRef.current[index] = el; }}
            className={cn(
              "relative z-10",
              sizes[size],
              "data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700"
            )}
          >
            <span className="flex items-center gap-2">
              {tab.icon}
              {tab.label}
              {tab.badge && (
                <span className="ml-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-500 text-white">
                  {tab.badge}
                </span>
              )}
            </span>
          </TabsTrigger>
        ))}
      </TabsList>
    </ShadcnTabs>
  );

  const renderPillTabs = () => (
    <ShadcnTabs value={activeTab} onValueChange={onChange} className={cn("w-full", className)}>
      <TabsList className="flex gap-2 bg-transparent p-0">
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.id}
            value={tab.id}
            disabled={tab.disabled}
            className={cn(
              sizes[size],
              "rounded-full font-medium",
              "data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md",
              "data-[state=inactive]:bg-gray-100 dark:data-[state=inactive]:bg-gray-800 data-[state=inactive]:text-gray-700 dark:data-[state=inactive]:text-gray-300"
            )}
          >
            <span className="flex items-center gap-2">
              {tab.icon}
              {tab.label}
              {tab.badge && (
                <span className={cn(
                  "ml-1 px-2 py-0.5 text-xs font-semibold rounded-full",
                  activeTab === tab.id ? 'bg-white/20' : 'bg-blue-500 text-white'
                )}>
                  {tab.badge}
                </span>
              )}
            </span>
          </TabsTrigger>
        ))}
      </TabsList>
    </ShadcnTabs>
  );

  const renderUnderlineTabs = () => (
    <ShadcnTabs value={activeTab} onValueChange={onChange} className={cn("w-full", className)}>
      <TabsList className="relative flex gap-6 border-b border-gray-200 dark:border-gray-700 bg-transparent p-0 h-auto">
        {tabs.map((tab, index) => (
          <TabsTrigger
            key={tab.id}
            value={tab.id}
            disabled={tab.disabled}
            ref={(el: HTMLButtonElement | null) => { tabsRef.current[index] = el; }}
            className={cn(
              "relative",
              sizes[size],
              "pb-3 font-medium rounded-none border-b-2 border-transparent",
              "data-[state=active]:border-blue-600 dark:data-[state=active]:border-blue-400",
              "data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400",
              "data-[state=inactive]:text-gray-600 dark:data-[state=inactive]:text-gray-400"
            )}
          >
            <span className="flex items-center gap-2">
              {tab.icon}
              {tab.label}
              {tab.badge && (
                <span className="ml-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-500 text-white">
                  {tab.badge}
                </span>
              )}
            </span>
          </TabsTrigger>
        ))}
      </TabsList>
    </ShadcnTabs>
  );

  switch (variant) {
    case 'pills':
      return renderPillTabs();
    case 'underline':
      return renderUnderlineTabs();
    default:
      return renderDefaultTabs();
  }
};

interface TabPanelProps {
  children: React.ReactNode;
  tabId: string;
  activeTab: string;
  className?: string;
}

/**
 * TabPanel Component
 * Content container for tab panels
 */
export const TabPanel: React.FC<TabPanelProps> = ({
  children,
  tabId,
  activeTab,
  className = ''
}) => {
  return (
    <TabsContent value={tabId} className={cn("animate-fadeIn", className)}>
      {children}
    </TabsContent>
  );
};
