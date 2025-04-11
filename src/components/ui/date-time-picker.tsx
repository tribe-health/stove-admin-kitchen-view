import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parse, setHours, setMinutes, isValid } from 'date-fns';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';

interface DateTimePickerProps {
  value?: Date;
  onChange: (date: Date) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = 'Select date and time',
  disabled = false,
  className,
}: DateTimePickerProps) {
  const [date, setDate] = useState<Date | undefined>(value);
  const [hours, setHoursState] = useState<string>('');
  const [minutes, setMinutesState] = useState<string>('');
  const [period, setPeriod] = useState<'AM' | 'PM'>('AM');
  const [isOpen, setIsOpen] = useState(false);

  // Update internal state when value changes
  useEffect(() => {
    if (value) {
      setDate(value);
      setHoursState(format(value, 'h'));
      setMinutesState(format(value, 'mm'));
      setPeriod(format(value, 'a') as 'AM' | 'PM');
    }
  }, [value]);

  // Update the time when any part changes
  const updateDateTime = (
    newDate?: Date,
    newHours?: string,
    newMinutes?: string,
    newPeriod?: 'AM' | 'PM'
  ) => {
    const selectedDate = newDate || date;
    if (!selectedDate) return;

    const h = newHours !== undefined ? newHours : hours;
    const m = newMinutes !== undefined ? newMinutes : minutes;
    const p = newPeriod !== undefined ? newPeriod : period;
    
    if (h && m) {
      try {
        const timeString = `${h}:${m} ${p}`;
        const parsedTime = parse(timeString, 'h:mm a', new Date());
        
        // Create a new date with the selected date and time
        const newDateTime = new Date(selectedDate);
        newDateTime.setHours(parsedTime.getHours());
        newDateTime.setMinutes(parsedTime.getMinutes());
        
        onChange(newDateTime);
      } catch (error) {
        console.error('Invalid time format', error);
      }
    } else if (selectedDate !== date) {
      // If only the date changed, preserve the existing time if available
      if (value) {
        const newDateTime = new Date(selectedDate);
        newDateTime.setHours(value.getHours());
        newDateTime.setMinutes(value.getMinutes());
        onChange(newDateTime);
      } else {
        onChange(selectedDate);
      }
    }
  };

  // Handle date selection
  const handleDateSelect = (newDate: Date | undefined) => {
    setDate(newDate);
    if (newDate) {
      updateDateTime(newDate);
    }
  };

  // Handle hour input change
  const handleHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^([1-9]|1[0-2])$/.test(value)) {
      setHoursState(value);
      updateDateTime(undefined, value);
    }
  };

  // Handle minute input change
  const handleMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^([0-5]?[0-9])$/.test(value)) {
      setMinutesState(value);
      updateDateTime(undefined, undefined, value);
    }
  };

  // Toggle AM/PM
  const togglePeriod = () => {
    const newPeriod = period === 'AM' ? 'PM' : 'AM';
    setPeriod(newPeriod);
    updateDateTime(undefined, undefined, undefined, newPeriod);
  };

  // Format display value
  const displayValue = value 
    ? format(value, 'MMM d, yyyy h:mm a') 
    : '';

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <Calendar className="mr-2 h-4 w-4" />
          {displayValue || placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4" align="start">
        <div className="space-y-4">
          <CalendarComponent
            mode="single"
            selected={date}
            onSelect={handleDateSelect}
            initialFocus
          />
          <div className="border-t pt-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">Time</div>
            </div>
            <div className="flex items-center space-x-2 mt-2">
              <Input
                className="w-12 text-center"
                value={hours}
                onChange={handleHoursChange}
                placeholder="HH"
                maxLength={2}
              />
              <span className="mx-1">:</span>
              <Input
                className="w-12 text-center"
                value={minutes}
                onChange={handleMinutesChange}
                placeholder="MM"
                maxLength={2}
              />
              <Button
                variant="outline"
                size="sm"
                className="ml-2 w-14"
                onClick={togglePeriod}
              >
                {period}
              </Button>
            </div>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button
            size="sm"
            onClick={() => setIsOpen(false)}
          >
            Done
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
