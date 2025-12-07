import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface DatePickerProps {
  value?: Date;
  onChange: (date: Date) => void;
  min?: Date;
  max?: Date;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  showTime?: boolean;
  format?: string;
}

/**
 * DatePicker Component
 * Apple Glass Design Date Picker with calendar popup
 */
export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  min,
  max,
  disabled = false,
  placeholder = 'Select date',
  className = '',
  showTime = false,
  format = 'DD.MM.YYYY'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(value || new Date());
  const [selectedTime, setSelectedTime] = useState({
    hours: value?.getHours() || 0,
    minutes: value?.getMinutes() || 0
  });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const formatDate = (date: Date): string => {
    if (!date) return '';
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');

    let formatted = format
      .replace('DD', day)
      .replace('MM', month)
      .replace('YYYY', year);

    if (showTime) {
      formatted += ` ${hours}:${minutes}`;
    }

    return formatted;
  };

  const getDaysInMonth = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const isDateDisabled = (date: Date): boolean => {
    if (min && date < min) return true;
    if (max && date > max) return true;
    return false;
  };

  const isSameDay = (date1: Date, date2: Date): boolean => {
    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    );
  };

  const handleDateSelect = (day: number) => {
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    
    if (showTime) {
      newDate.setHours(selectedTime.hours);
      newDate.setMinutes(selectedTime.minutes);
    }

    if (!isDateDisabled(newDate)) {
      onChange(newDate);
      if (!showTime) {
        setIsOpen(false);
      }
    }
  };

  const handleTimeChange = (type: 'hours' | 'minutes', value: number) => {
    const newTime = { ...selectedTime, [type]: value };
    setSelectedTime(newTime);

    if (value) {
      const newDate = new Date(value);
      newDate.setHours(newTime.hours);
      newDate.setMinutes(newTime.minutes);
      onChange(newDate);
    }
  };

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-10" />);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const isSelected = value && isSameDay(value, date);
      const isDisabled = isDateDisabled(date);
      const isToday = isSameDay(date, new Date());

      days.push(
        <button
          key={day}
          onClick={() => handleDateSelect(day)}
          disabled={isDisabled}
          className={`
            h-10 rounded-lg text-sm font-medium
            transition-all duration-200
            ${isSelected
              ? 'bg-blue-600 text-white shadow-md'
              : isToday
              ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            }
            ${isDisabled && 'opacity-30 cursor-not-allowed'}
          `}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  const monthNames = [
    'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
  ];

  const weekDays = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Input */}
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full px-4 py-2 
          bg-white/50 dark:bg-gray-800/50 
          backdrop-blur-sm
          border border-gray-300 dark:border-gray-600
          rounded-lg
          text-left
          flex items-center justify-between
          transition-all duration-200
          ${disabled
            ? 'opacity-50 cursor-not-allowed'
            : 'hover:border-blue-500 dark:hover:border-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
          }
        `}
        aria-label="Open date picker"
      >
        <span className={value ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}>
          {value ? formatDate(value) : placeholder}
        </span>
        <Calendar className="w-5 h-5 text-gray-400" />
      </button>

      {/* Calendar Popup */}
      {isOpen && (
        <div className="
          absolute top-full left-0 mt-2 z-50
          bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl
          border border-gray-200 dark:border-gray-700
          rounded-xl shadow-2xl
          p-4 w-80
          animate-fadeIn
        ">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={previousMonth}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="font-semibold text-gray-900 dark:text-white">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </span>
            <button
              onClick={nextMonth}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Next month"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Week Days */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map(day => (
              <div key={day} className="h-10 flex items-center justify-center text-xs font-medium text-gray-500 dark:text-gray-400">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {renderCalendar()}
          </div>

          {/* Time Picker */}
          {showTime && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={selectedTime.hours}
                  onChange={(e) => handleTimeChange('hours', parseInt(e.target.value) || 0)}
                  className="w-16 px-2 py-1 text-center border border-gray-300 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50"
                  aria-label="Hours"
                />
                <span className="text-gray-500">:</span>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={selectedTime.minutes}
                  onChange={(e) => handleTimeChange('minutes', parseInt(e.target.value) || 0)}
                  className="w-16 px-2 py-1 text-center border border-gray-300 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50"
                  aria-label="Minutes"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
