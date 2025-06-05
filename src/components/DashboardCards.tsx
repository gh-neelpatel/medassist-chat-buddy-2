import React from 'react';
import { Calendar, Heart, Pill, FileText, Brain, Navigation } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

interface DashboardCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  linkText: string;
  linkTo: string;
  isNew?: boolean;
}

const DashboardCard = ({ title, description, icon, linkText, linkTo, isNew = false }: DashboardCardProps) => {
  return (
    <Card className={`health-card h-full flex flex-col relative ${isNew ? 'border-blue-200 bg-blue-50/50' : ''}`}>
      {isNew && (
        <div className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-medium">
          NEW
        </div>
      )}
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className={`${isNew ? 'bg-blue-500/10' : 'bg-primary/10'} p-2 rounded-md`}>
            {icon}
          </div>
          <CardTitle className="text-lg">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <CardDescription className="text-sm">{description}</CardDescription>
        <Button variant="outline" className="mt-4 w-full" asChild>
          <Link to={linkTo}>{linkText}</Link>
        </Button>
      </CardContent>
    </Card>
  );
};

const DashboardCards = () => {
  const cards = [
    {
      title: "Health Records",
      description: "View your medical history, test results, and previous diagnoses all in one place.",
      icon: <FileText size={20} className="text-primary" />,
      linkText: "View Records",
      linkTo: "/health-records"
    },
    {
      title: "Find Doctors",
      description: "Get doctor recommendations based on your symptoms and medical history.",
      icon: <Heart size={20} className="text-primary" />,
      linkText: "Find Doctors",
      linkTo: "/doctor-finder"
    },
    {
      title: "AI History Summary",
      description: "Upload patient files and get AI-powered comprehensive health summaries and insights.",
      icon: <Brain size={20} className="text-blue-600" />,
      linkText: "Generate Summary",
      linkTo: "/patient-history-summary",
      isNew: true
    },
    {
      title: "Hospital Locator",
      description: "Find nearby hospitals and emergency facilities using your location with real-time data.",
      icon: <Navigation size={20} className="text-blue-600" />,
      linkText: "Find Hospitals",
      linkTo: "/hospital-locator",
      isNew: true
    },
    {
      title: "Medication Tracker",
      description: "Track your medications, get reminders, and manage your prescriptions.",
      icon: <Pill size={20} className="text-primary" />,
      linkText: "Manage Medications",
      linkTo: "/medications"
    },
    {
      title: "Appointments",
      description: "Schedule and manage your appointments with healthcare providers.",
      icon: <Calendar size={20} className="text-primary" />,
      linkText: "View Appointments",
      linkTo: "/appointments"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map((card, index) => (
        <DashboardCard
          key={index}
          title={card.title}
          description={card.description}
          icon={card.icon}
          linkText={card.linkText}
          linkTo={card.linkTo}
          isNew={card.isNew}
        />
      ))}
    </div>
  );
};

export default DashboardCards;
