import React, { useState } from 'react';
import { Menu, Calendar, Clock, MapPin, PhoneCall } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { toast } from "sonner";
import { Appointment } from "@/types/appointment";
import AppointmentCalendarView from "@/components/AppointmentCalendarView";
import AppointmentReschedule from "@/components/AppointmentReschedule";
import ContactSupport from "@/components/ContactSupport";

const Appointments = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCalendarViewOpen, setIsCalendarViewOpen] = useState(false);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [isContactSupportOpen, setIsContactSupportOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  
  const appointments: Appointment[] = [
    {
      id: '1',
      doctorName: 'Dr. Sarah Johnson',
      specialty: 'Cardiologist',
      date: '2024-04-28',
      time: '10:00 AM',
      location: '123 Medical Center Dr, Suite 101',
      status: 'upcoming'
    },
    {
      id: '2',
      doctorName: 'Dr. Emily Rodriguez',
      specialty: 'Primary Care',
      date: '2024-05-15',
      time: '2:30 PM',
      location: '789 Wellness Ave, Suite 205',
      status: 'upcoming'
    },
    {
      id: '3',
      doctorName: 'Dr. Michael Chen',
      specialty: 'Cardiologist',
      date: '2024-04-10',
      time: '9:15 AM',
      location: '456 Health Parkway, Building B',
      status: 'completed'
    },
    {
      id: '4',
      doctorName: 'Dr. James Wilson',
      specialty: 'Neurologist',
      date: '2024-03-22',
      time: '11:30 AM',
      location: '567 Brain Health Center',
      status: 'cancelled'
    }
  ];
  
  const getStatusBadgeStyles = (status: 'upcoming' | 'completed' | 'cancelled') => {
    switch (status) {
      case 'upcoming':
        return 'bg-primary/10 text-primary';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const upcomingAppointments = appointments.filter(app => app.status === 'upcoming');
  const pastAppointments = appointments.filter(app => app.status === 'completed' || app.status === 'cancelled');
  
  const handleReschedule = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsRescheduleOpen(true);
  };
  
  const handleCancel = (id: string) => {
    toast.success("Appointment cancelled successfully");
  };
  
  const handleBookFollowUp = (id: string) => {
    toast.info("Follow-up booking feature will be available soon");
  };
  
  const handleScheduleAppointment = () => {
    toast.success("You've been directed to the appointment scheduling system");
    window.open("https://example.com/book-appointment", "_blank");
  };

  const handleViewCalendar = () => {
    setIsCalendarViewOpen(true);
  };

  const handleContactSupport = (appointment: Appointment | null = null) => {
    setSelectedAppointment(appointment);
    setIsContactSupportOpen(true);
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-offwhite">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="container max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">Appointments</h1>
                <p className="text-muted-foreground">Schedule and manage your appointments with healthcare providers</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" className="hidden md:inline-flex" onClick={handleViewCalendar}>
                  View Calendar
                </Button>
                <Button onClick={handleScheduleAppointment}>Schedule Appointment</Button>
                <Button size="icon" variant="outline" className="md:hidden" onClick={toggleSidebar}>
                  <Menu size={20} />
                </Button>
              </div>
            </div>
            
            <Tabs defaultValue="upcoming" className="space-y-4">
              <TabsList>
                <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                <TabsTrigger value="past">Past</TabsTrigger>
              </TabsList>
              
              <TabsContent value="upcoming" className="space-y-4">
                {upcomingAppointments.length > 0 ? (
                  <div className="grid gap-4">
                    {upcomingAppointments.map((appointment) => (
                      <Card key={appointment.id}>
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">{appointment.doctorName}</CardTitle>
                            <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeStyles(appointment.status)}`}>
                              {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">{appointment.specialty}</p>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-start gap-2">
                            <Calendar size={16} className="text-muted-foreground shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm">
                                {new Date(appointment.date).toLocaleDateString(undefined, {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <Clock size={16} className="text-muted-foreground shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm">{appointment.time}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <MapPin size={16} className="text-muted-foreground shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm">{appointment.location}</p>
                            </div>
                          </div>
                          <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2 pt-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="flex gap-1" 
                              onClick={() => handleContactSupport(appointment)}
                            >
                              <PhoneCall size={16} />
                              Contact Support
                            </Button>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" onClick={() => handleReschedule(appointment)}>Reschedule</Button>
                              <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleCancel(appointment.id)}>
                                Cancel
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-muted/50 rounded-lg">
                    <Calendar size={40} className="mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No upcoming appointments</h3>
                    <p className="text-muted-foreground mb-4">Schedule an appointment with a healthcare provider</p>
                    <Button onClick={handleScheduleAppointment}>Schedule Appointment</Button>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="past" className="space-y-4">
                {pastAppointments.length > 0 ? (
                  <div className="grid gap-4">
                    {pastAppointments.map((appointment) => (
                      <Card key={appointment.id}>
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">{appointment.doctorName}</CardTitle>
                            <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeStyles(appointment.status)}`}>
                              {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">{appointment.specialty}</p>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-start gap-2">
                            <Calendar size={16} className="text-muted-foreground shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm">
                                {new Date(appointment.date).toLocaleDateString(undefined, {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <Clock size={16} className="text-muted-foreground shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm">{appointment.time}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <MapPin size={16} className="text-muted-foreground shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm">{appointment.location}</p>
                            </div>
                          </div>
                          {appointment.status === 'completed' && (
                            <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2 pt-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="flex gap-1" 
                                onClick={() => handleContactSupport(appointment)}
                              >
                                <PhoneCall size={16} />
                                Contact Support
                              </Button>
                              <div className="flex gap-2">
                                <Button variant="outline" size="sm">View Summary</Button>
                                <Button size="sm" onClick={() => handleBookFollowUp(appointment.id)}>Book Follow-up</Button>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-muted/50 rounded-lg">
                    <Calendar size={40} className="mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No past appointments</h3>
                    <p className="text-muted-foreground">Your appointment history will appear here</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
      
      <AppointmentCalendarView
        appointments={appointments}
        open={isCalendarViewOpen}
        onClose={() => setIsCalendarViewOpen(false)}
      />
      
      {selectedAppointment && (
        <AppointmentReschedule
          appointmentId={selectedAppointment.id}
          doctorName={selectedAppointment.doctorName}
          specialty={selectedAppointment.specialty}
          currentDate={selectedAppointment.date}
          currentTime={selectedAppointment.time}
          open={isRescheduleOpen}
          onClose={() => setIsRescheduleOpen(false)}
        />
      )}
      
      <ContactSupport
        appointmentId={selectedAppointment?.id}
        open={isContactSupportOpen}
        onClose={() => {
          setIsContactSupportOpen(false);
          setSelectedAppointment(null);
        }}
      />
    </div>
  );
};

export default Appointments;
