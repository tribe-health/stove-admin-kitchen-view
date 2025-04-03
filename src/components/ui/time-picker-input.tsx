import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parse } from 'date-fns';

interface TimePickerInputProps {
  value?: Date;
  onChange: (date: Date) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function TimePickerInput({
  value,
  onChange,
  placeholder = 'Select time',
  disabled = false,
  className,
}: TimePickerInputProps) {
  const [hours, setHours] = useState<string>('');
  const [minutes, setMinutes] = useState<string>('');
  const [period, setPeriod] = useState<'AM' | 'PM'>('AM');
  const [isOpen, setIsOpen] = useState(false);

  // Update internal state when value changes
  useEffect(() => {
    if (value) {
      setHours(format(value, 'h'));
      setMinutes(format(value, 'mm'));
      setPeriod(format(value, 'a') as 'AM' | 'PM');
    }
  }, [value]);

  // Update the time when any part changes
  const updateTime = (newHours?: string, newMinutes?: string, newPeriod?: 'AM' | 'PM') => {
    const h = newHours !== undefined ? newHours : hours;
    const m = newMinutes !== undefined ? newMinutes : minutes;
    const p = newPeriod !== undefined ? newPeriod : period;
    
    if (h && m) {
      try {
        const timeString = `${h}:${m} ${p}`;
        const date = parse(timeString, 'h:mm a', new Date());
        onChange(date);
      } catch (error) {
        console.error('Invalid time format', error);
      }
    }
  };

  // Handle hour input change
  const handleHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^([1-9]|1[0-2])$/.test(value)) {
      setHours(value);
      updateTime(value);
    }
  };

  // Handle minute input change
  const handleMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^([0-5]?[0-9])$/.test(value)) {
      setMinutes(value);
      updateTime(undefined, value);
    }
  };

  // Toggle AM/PM
  const togglePeriod = () => {
    const newPeriod = period === 'AM' ? 'PM' : 'AM';
    setPeriod(newPeriod);
    updateTime(undefined, undefined, newPeriod);
  };

  // Format display value
  const displayValue = value 
    ? format(value, 'h:mm a') 
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
          <Clock className="mr-2 h-4 w-4" />
          {displayValue || placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4" align="start">
        <div className="flex items-center space-x-2">
          <div className="grid gap-1">
            <div className="flex items-center">
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