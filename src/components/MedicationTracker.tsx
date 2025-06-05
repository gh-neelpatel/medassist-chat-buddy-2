
import React, { useState } from 'react';
import { Pill, Clock, Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from "sonner";

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  timeOfDay: string;
  startDate: string;
  nextDose: string;
  adherence: number; // percentage
}

const MedicationTracker = () => {
  // Mock data - in a real app, this would come from an API
  const [medications, setMedications] = useState<Medication[]>([
    {
      id: '1',
      name: 'Lisinopril',
      dosage: '10mg',
      frequency: 'Once daily',
      timeOfDay: '8:00 PM',
      startDate: '2023-12-15',
      nextDose: '2024-04-23 20:00:00',
      adherence: 92
    },
    {
      id: '2',
      name: 'Atorvastatin',
      dosage: '20mg',
      frequency: 'Once daily',
      timeOfDay: '9:00 PM',
      startDate: '2024-01-20',
      nextDose: '2024-04-23 21:00:00',
      adherence: 85
    }
  ]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newMedication, setNewMedication] = useState({
    name: '',
    dosage: '',
    frequency: 'once-daily',
    timeOfDay: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewMedication(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setNewMedication(prev => ({ ...prev, [name]: value }));
  };

  const handleAddMedication = () => {
    // Validate form fields
    if (!newMedication.name || !newMedication.dosage || !newMedication.timeOfDay) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Create a new medication object
    const newMed: Medication = {
      id: Date.now().toString(),
      name: newMedication.name,
      dosage: newMedication.dosage,
      frequency: newMedication.frequency === 'once-daily' ? 'Once daily' : 
                 newMedication.frequency === 'twice-daily' ? 'Twice daily' : 
                 newMedication.frequency === 'every-other-day' ? 'Every other day' : 'As needed',
      timeOfDay: newMedication.timeOfDay,
      startDate: new Date().toISOString().split('T')[0],
      nextDose: new Date().toISOString(),
      adherence: 100
    };

    // Add the new medication to the list
    setMedications(prev => [...prev, newMed]);
    toast.success("Medication added successfully");

    // Reset form and close dialog
    setNewMedication({
      name: '',
      dosage: '',
      frequency: 'once-daily',
      timeOfDay: '',
    });
    setIsDialogOpen(false);
  };

  const handleTakeMedication = (id: string) => {
    toast.success("Medication marked as taken");
  };

  // Format time for display
  const formatNextDose = (dateTimeString: string) => {
    const nextDose = new Date(dateTimeString);
    const now = new Date();
    
    // If it's today
    if (nextDose.toDateString() === now.toDateString()) {
      return `Today at ${nextDose.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // If it's tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(now.getDate() + 1);
    if (nextDose.toDateString() === tomorrow.toDateString()) {
      return `Tomorrow at ${nextDose.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // Otherwise
    return `${nextDose.toLocaleDateString()} at ${nextDose.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Your Medications</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>Add Medication</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Medication</DialogTitle>
              <DialogDescription>
                Enter the details of your new medication to track it and receive reminders.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Medication Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={newMedication.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Lisinopril"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="dosage">Dosage</Label>
                <Input
                  id="dosage"
                  name="dosage"
                  value={newMedication.dosage}
                  onChange={handleInputChange}
                  placeholder="e.g., 10mg"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="frequency">Frequency</Label>
                <Select
                  value={newMedication.frequency}
                  onValueChange={(value) => handleSelectChange('frequency', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="once-daily">Once daily</SelectItem>
                    <SelectItem value="twice-daily">Twice daily</SelectItem>
                    <SelectItem value="every-other-day">Every other day</SelectItem>
                    <SelectItem value="as-needed">As needed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="timeOfDay">Time of Day</Label>
                <Input
                  id="timeOfDay"
                  name="timeOfDay"
                  type="time"
                  value={newMedication.timeOfDay}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleAddMedication}>Save Medication</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {medications.map((medication) => (
          <Card key={medication.id} className="overflow-hidden">
            <CardHeader className="bg-primary/5 pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <Pill size={18} className="text-primary" />
                  </div>
                  <CardTitle className="text-lg">{medication.name}</CardTitle>
                </div>
                <span className="text-sm font-medium bg-primary/10 px-2 py-1 rounded-md">
                  {medication.dosage}
                </span>
              </div>
              <CardDescription>{medication.frequency}</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="flex items-center gap-3">
                <Clock size={16} className="text-muted-foreground" />
                <p className="text-sm">
                  Next dose: <span className="font-medium">{formatNextDose(medication.nextDose)}</span>
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Calendar size={16} className="text-muted-foreground" />
                <p className="text-sm">
                  Started on: <span className="font-medium">
                    {new Date(medication.startDate).toLocaleDateString()}
                  </span>
                </p>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <p className="text-sm">Adherence</p>
                  <span className="text-sm font-medium">{medication.adherence}%</span>
                </div>
                <Progress value={medication.adherence} className="h-2" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm">Edit</Button>
                <Button size="sm" onClick={() => handleTakeMedication(medication.id)}>Take Now</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {medications.length === 0 && (
        <div className="text-center py-8">
          <Pill size={40} className="mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No medications yet</h3>
          <p className="text-muted-foreground mb-4">Add medications to track them and receive reminders</p>
          <Button onClick={() => setIsDialogOpen(true)}>Add Your First Medication</Button>
        </div>
      )}
    </div>
  );
};

export default MedicationTracker;
