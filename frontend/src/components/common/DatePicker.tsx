import React, { useState } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

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
 * Apple Glass Design Date Picker using shadcn/ui Calendar
 */
export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  min,
  max,
  disabled = false,
  placeholder = 'Datum auswählen',
  className = '',
  showTime = false,
  format: formatStr = 'dd.MM.yyyy'
}) => {
  const [selectedTime, setSelectedTime] = useState({
    hours: value?.getHours() || 0,
    minutes: value?.getMinutes() || 0
  });

  const formatDate = (date: Date): string => {
    if (!date) return '';
    try {
      let formatted = format(date, formatStr, { locale: de });
      if (showTime) {
        formatted += ` ${selectedTime.hours.toString().padStart(2, '0')}:${selectedTime.minutes.toString().padStart(2, '0')}`;
      }
      return formatted;
    } catch {
      return date.toLocaleDateString('de-DE');
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    
    if (showTime) {
      date.setHours(selectedTime.hours);
      date.setMinutes(selectedTime.minutes);
    }
    
    onChange(date);
  };

  const handleTimeChange = (type: 'hours' | 'minutes', val: number) => {
    const newTime = { ...selectedTime, [type]: val };
    setSelectedTime(newTime);

    if (value) {
      const newDate = new Date(value);
      newDate.setHours(newTime.hours);
      newDate.setMinutes(newTime.minutes);
      onChange(newDate);
    }
  };

  return (
    <div className={cn("relative", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            disabled={disabled}
            className={cn(
              "w-full justify-start text-left font-normal",
              !value && "text-muted-foreground",
              "bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? formatDate(value) : <span>{placeholder}</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl" align="start">
          <Calendar
            mode="single"
            selected={value}
            onSelect={handleDateSelect}
            disabled={(date) => {
              if (min && date < min) return true;
              if (max && date > max) return true;
              return false;
            }}
            initialFocus
            locale={de}
          />
          {showTime && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="0"
                  max="23"
                  value={selectedTime.hours}
                  onChange={(e) => handleTimeChange('hours', parseInt(e.target.value) || 0)}
                  className="w-16 text-center"
                  aria-label="Hours"
                />
                <span className="text-gray-500">:</span>
                <Input
                  type="number"
                  min="0"
                  max="59"
                  value={selectedTime.minutes}
                  onChange={(e) => handleTimeChange('minutes', parseInt(e.target.value) || 0)}
                  className="w-16 text-center"
                  aria-label="Minutes"
                />
              </div>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
};
