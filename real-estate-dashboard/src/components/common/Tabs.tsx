import React, { useState, useRef, useEffect } from 'react';

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
    <div className={`relative inline-flex rounded-lg bg-gray-100/50 dark:bg-gray-800/50 backdrop-blur-sm p-1 ${className}`}>
      {tabs.map((tab, index) => (
        <button
          key={tab.id}
          ref={el => tabsRef.current[index] = el}
          onClick={() => !tab.disabled && onChange(tab.id)}
          disabled={tab.disabled}
          className={`
            relative z-10 ${sizes[size]}
            rounded-md font-medium
            transition-all duration-200
            disabled:opacity-50 disabled:cursor-not-allowed
            ${activeTab === tab.id
              ? 'text-gray-900 dark:text-white'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }
          `}
          role="tab"
          aria-selected={activeTab === tab.id}
          aria-disabled={tab.disabled}
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
        </button>
      ))}
      <div
        className="absolute z-0 bg-white dark:bg-gray-700 rounded-md shadow-md transition-all duration-300 ease-out"
        style={{
          ...indicatorStyle,
          top: '4px',
          bottom: '4px'
        }}
      />
    </div>
  );

  const renderPillTabs = () => (
    <div className={`flex gap-2 ${className}`}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => !tab.disabled && onChange(tab.id)}
          disabled={tab.disabled}
          className={`
            ${sizes[size]}
            rounded-full font-medium
            transition-all duration-200
            disabled:opacity-50 disabled:cursor-not-allowed
            ${activeTab === tab.id
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }
          `}
          role="tab"
          aria-selected={activeTab === tab.id}
          aria-disabled={tab.disabled}
        >
          <span className="flex items-center gap-2">
            {tab.icon}
            {tab.label}
            {tab.badge && (
              <span className={`
                ml-1 px-2 py-0.5 text-xs font-semibold rounded-full
                ${activeTab === tab.id ? 'bg-white/20' : 'bg-blue-500 text-white'}
              `}>
                {tab.badge}
              </span>
            )}
          </span>
        </button>
      ))}
    </div>
  );

  const renderUnderlineTabs = () => (
    <div className={`relative ${className}`}>
      <div className="flex gap-6 border-b border-gray-200 dark:border-gray-700">
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            ref={el => tabsRef.current[index] = el}
            onClick={() => !tab.disabled && onChange(tab.id)}
            disabled={tab.disabled}
            className={`
              relative ${sizes[size]} pb-3
              font-medium
              transition-all duration-200
              disabled:opacity-50 disabled:cursor-not-allowed
              ${activeTab === tab.id
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }
            `}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-disabled={tab.disabled}
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
          </button>
        ))}
      </div>
      <div
        className="absolute bottom-0 h-0.5 bg-blue-600 dark:bg-blue-400 transition-all duration-300 ease-out"
        style={indicatorStyle}
      />
    </div>
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
  if (tabId !== activeTab) return null;

  return (
    <div
      role="tabpanel"
      aria-labelledby={tabId}
      className={`animate-fadeIn ${className}`}
    >
      {children}
    </div>
  );
};
