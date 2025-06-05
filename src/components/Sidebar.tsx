import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Calendar, 
  Home, 
  Heart, 
  MessageSquare, 
  FileText, 
  MapPin, 
  Pill, 
  Brain,
  Navigation,
  Upload
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import ContactSupport from './ContactSupport';

interface SidebarLinkProps {
  to: string;
  icon: React.ReactNode;
  label: string;
}

const SidebarLink = ({ to, icon, label }: SidebarLinkProps) => {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
          isActive
            ? "bg-primary text-primary-foreground"
            : "hover:bg-muted"
        )
      }
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  );
};

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

const Sidebar = ({ isOpen, toggleSidebar }: SidebarProps) => {
  const isMobile = useIsMobile();
  const [isContactSupportOpen, setIsContactSupportOpen] = useState(false);
  
  const sidebarClasses = cn(
    "bg-white border-r border-gray-200 h-[calc(100vh-4rem)] overflow-y-auto transition-all duration-300 ease-in-out",
    isMobile ? (isOpen ? "w-64 fixed left-0 top-16 z-40" : "w-0 fixed left-0 top-16 z-40") : "w-64"
  );
  
  const overlayClasses = cn(
    "fixed inset-0 bg-black/50 z-30 transition-opacity duration-300",
    isMobile && isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
  );
  
  if (isMobile && !isOpen) {
    return (
      <div className={overlayClasses} onClick={toggleSidebar}></div>
    );
  }
  
  return (
    <>
      <div className={overlayClasses} onClick={toggleSidebar}></div>
      <aside className={sidebarClasses}>
        <div className="p-4 space-y-4">
          <div className="space-y-1">
            <SidebarLink to="/" icon={<Home size={18} />} label="Dashboard" />
            <SidebarLink to="/chat" icon={<MessageSquare size={18} />} label="Chat" />
            <SidebarLink to="/health-records" icon={<FileText size={18} />} label="Health Records" />
            <SidebarLink to="/medications" icon={<Pill size={18} />} label="Medications" />
            <SidebarLink to="/doctor-finder" icon={<Heart size={18} />} label="Find Doctors" />
            <SidebarLink to="/facilities" icon={<MapPin size={18} />} label="Healthcare Facilities" />
            <SidebarLink to="/appointments" icon={<Calendar size={18} />} label="Appointments" />
            
            {/* AI-Powered Features */}
            <div className="pt-3 pb-1">
              <p className="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                AI Features
              </p>
            </div>
            <SidebarLink to="/patient-history-summary" icon={<Brain size={18} />} label="History Summary" />
            <SidebarLink to="/hospital-locator" icon={<Navigation size={18} />} label="Hospital Locator" />
          </div>
          
          <div className="pt-4 border-t">
            <div className="rounded-md bg-muted p-3">
              <h4 className="text-sm font-medium">Need help?</h4>
              <p className="text-xs text-muted-foreground pt-1">
                Contact our support team for assistance with using MedAssist.
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-3 w-full"
                onClick={() => setIsContactSupportOpen(true)}
              >
                Contact Support
              </Button>
            </div>
          </div>
        </div>
      </aside>

      <ContactSupport
        open={isContactSupportOpen}
        onClose={() => setIsContactSupportOpen(false)}
      />
    </>
  );
};

export default Sidebar;
