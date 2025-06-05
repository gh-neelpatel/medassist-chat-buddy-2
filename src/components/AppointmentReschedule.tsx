
import React, { useState } from 'react';
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface AppointmentRescheduleProps {
  appointmentId: string;
  doctorName: string;
  specialty: string;
  currentDate: string;
  currentTime: string;
  open: boolean;
  onClose: () => void;
}

const AppointmentReschedule: React.FC<AppointmentRescheduleProps> = ({
  appointmentId,
  doctorName,
  specialty,
  currentDate,
  currentTime,
  open,
  onClose
}) => {
  const [date, setDate] = useState<Date | undefined>(new Date(currentDate));
  const [time, setTime] = useState(currentTime);
  
  const availableTimes = [
    "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
    "1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM", "3:00 PM", "3:30 PM", "4:00 PM"
  ];
  
  const handleSubmit = () => {
    if (!date) {
      toast.error("Please select a date");
      return;
    }
    
    // In a real app, we would make an API call to update the appointment
    toast.success("Appointment rescheduled successfully");
    onClose();
  };
  
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Reschedule Appointment</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-1">
            <h3 className="font-medium">{doctorName}</h3>
            <p className="text-sm text-muted-foreground">{specialty}</p>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm font-medium">Current appointment:</p>
            <p className="text-sm text-muted-foreground">
              {format(new Date(currentDate), "MMMM d, yyyy")} at {currentTime}
            </p>
          </div>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <div className="font-medium">New Date</div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Select date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                    disabled={(date) => {
                      // Disable dates in the past and more than 90 days in the future
                      const now = new Date();
                      now.setHours(0, 0, 0, 0);
                      const max = new Date();
                      max.setDate(max.getDate() + 90);
                      return date < now || date > max;
                    }}
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <div className="font-medium">New Time</div>
              <Select value={time} onValueChange={setTime}>
                <SelectTrigger className="w-full">
                  <div className="flex items-center">
                    <Clock className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Select time" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {availableTimes.map((timeOption) => (
                    <SelectItem key={timeOption} value={timeOption}>
                      {timeOption}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit}>Confirm Reschedule</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AppointmentReschedule;

