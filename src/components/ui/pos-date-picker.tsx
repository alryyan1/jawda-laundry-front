import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { getTodayDate } from "@/lib/dateUtils";

interface POSDatePickerProps {
  onDateChange?: (date: string) => void;
}

export const POSDatePicker: React.FC<POSDatePickerProps> = ({ onDateChange }) => {
  const { t, i18n } = useTranslation(["common"]);
  const [date, setDate] = useState<Date>(new Date());
  const [isOpen, setIsOpen] = useState(false);

  // Initialize with today's date
  useEffect(() => {
    const today = new Date();
    setDate(today);
    // Trigger initial date change
    if (onDateChange) {
      onDateChange(getTodayDate());
    }
  }, []); // Remove onDateChange dependency to avoid infinite loop

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      setDate(selectedDate);
      setIsOpen(false);
      
      // Format date as YYYY-MM-DD
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      
      // Trigger date change callback
      if (onDateChange) {
        onDateChange(formattedDate);
      }
    }
  };

  const getLocale = () => {
    return i18n.language.startsWith('ar') ? ar : enUS;
  };

  const formatDisplayDate = (date: Date) => {
    return format(date, 'MMM dd, yyyy', { locale: getLocale() });
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-[200px] justify-start text-left font-normal",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? formatDisplayDate(date) : <span>{t("pickDate", { ns: "common", defaultValue: "Pick a date" })}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <CalendarComponent
          mode="single"
          selected={date}
          onSelect={handleDateSelect}
          initialFocus
          locale={getLocale()}
        />
      </PopoverContent>
    </Popover>
  );
}; 