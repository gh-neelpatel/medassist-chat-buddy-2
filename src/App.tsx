import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Chat from "./pages/Chat";
import HealthRecords from "./pages/HealthRecords";
import Medications from "./pages/Medications";
import DoctorFinder from "./pages/DoctorFinder";
import Facilities from "./pages/Facilities";
import Appointments from "./pages/Appointments";
import { PatientHistorySummary } from "./pages/PatientHistorySummary";
import { HospitalLocator } from "./pages/HospitalLocator";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/health-records" element={<HealthRecords />} />
          <Route path="/medications" element={<Medications />} />
          <Route path="/doctor-finder" element={<DoctorFinder />} />
          <Route path="/facilities" element={<Facilities />} />
          <Route path="/appointments" element={<Appointments />} />
          <Route path="/patient-history-summary" element={<PatientHistorySummary />} />
          <Route path="/hospital-locator" element={<HospitalLocator />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
