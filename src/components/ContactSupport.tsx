
import React, { useState } from 'react';
import { MessageSquare, Bug } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface ContactSupportProps {
  open: boolean;
  onClose: () => void;
  appointmentId?: string; // Make appointmentId optional
}

type SupportType = "help" | "bug";

const ContactSupport: React.FC<ContactSupportProps> = ({
  open,
  onClose,
  appointmentId, // Add appointmentId to the destructured props
}) => {
  const [supportType, setSupportType] = useState<SupportType>("help");
  const [message, setMessage] = useState("");

  const handleSubmit = () => {
    if (!message.trim()) {
      toast.error("Please enter a message");
      return;
    }
    
    // In a real app, we would make an API call to send the support message
    // If we have an appointmentId, include it in the API call
    const supportMessage = appointmentId 
      ? `Regarding appointment #${appointmentId}: ${message}`
      : message;
    
    toast.success(
      supportType === "help" 
        ? "Your request has been sent to our support team. We'll get back to you shortly."
        : "Thank you for reporting this issue. Our team will investigate it."
    );
    setMessage(""); // Reset message
    onClose();
  };
  
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold flex items-center gap-2">
            {supportType === "help" ? (
              <>
                <MessageSquare className="h-5 w-5 text-primary" />
                Get Help
              </>
            ) : (
              <>
                <Bug className="h-5 w-5 text-primary" />
                Report an Issue
              </>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="type">What can we help you with?</Label>
            <Select value={supportType} onValueChange={(value: SupportType) => setSupportType(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="help">I need help using MedAssist</SelectItem>
                <SelectItem value="bug">I found an issue or bug</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="message">
              {supportType === "help" 
                ? "How can we assist you today?" 
                : "Please describe the issue you encountered"}
            </Label>
            <Textarea
              id="message"
              placeholder={
                supportType === "help"
                  ? "Describe what you need help with..."
                  : "Please provide details about the issue, including what you were doing when it occurred..."
              }
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={5}
            />
          </div>
          
          <div className="text-sm text-muted-foreground">
            {appointmentId && <p className="mb-2 font-medium">Regarding Appointment #{appointmentId}</p>}
            {supportType === "help" ? (
              "Support hours: Monday to Friday, 9am to 5pm. We typically respond within 24 hours."
            ) : (
              "Our development team reviews all reported issues and will investigate as soon as possible."
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit}>Submit</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ContactSupport;
