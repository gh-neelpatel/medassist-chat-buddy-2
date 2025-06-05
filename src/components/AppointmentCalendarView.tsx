
import React, { useState } from 'react';
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Appointment } from "@/types/appointment";

interface AppointmentCalendarViewProps {
  appointments: Appointment[];
  open: boolean;
  onClose: () => void;
}

const AppointmentCalendarView: React.FC<AppointmentCalendarViewProps> = ({
  appointments,
  open,
  onClose
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    appointments.length > 0 ? new Date(appointments[0].date) : undefined
  );
  
  // Get appointments for the selected date
  const appointmentsForDate = selectedDate
    ? appointments.filter(
        app => format(new Date(app.date), 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
      )
    : [];
  
  // Function to get dates with appointments
  const getDaysWithAppointments = () => {
    return appointments.map(app => new Date(app.date));
  };
  
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            Appointments Calendar
          </DialogTitle>
          <DialogDescription>
            View your appointments in calendar format.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="p-3 pointer-events-auto"
              modifiers={{
                appointment: getDaysWithAppointments(),
              }}
              modifiersStyles={{
                appointment: { 
                  fontWeight: 'bold', 
                  backgroundColor: 'rgba(var(--primary), 0.1)', 
                },
              }}
            />
          </div>
          
          <div className="space-y-4">
            <h3 className="font-medium">
              {selectedDate 
                ? `Appointments for ${format(selectedDate, 'MMMM d, yyyy')}` 
                : 'Select a date'}
            </h3>
            
            {selectedDate && appointmentsForDate.length === 0 && (
              <p className="text-sm text-muted-foreground">No appointments scheduled for this date.</p>
            )}
            
            {appointmentsForDate.map((app) => (
              <div key={app.id} className="border rounded-md p-4">
                <div className="font-medium">{app.doctorName}</div>
                <div className="text-sm text-muted-foreground">{app.specialty}</div>
                <div className="text-sm mt-2">Time: {app.time}</div>
                <div className="text-sm">Location: {app.location}</div>
                <div className="mt-2">
                  <span className={`px-2 py-1 text-xs rounded-full 
                    ${app.status === 'upcoming' ? 'bg-primary/10 text-primary' : 
                      app.status === 'completed' ? 'bg-green-100 text-green-800' : 
                      'bg-red-100 text-red-800'}`}
                  >
                    {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AppointmentCalendarView;
