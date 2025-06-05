import React, { useState, useEffect } from 'react';
import { Search, MapPin, Stethoscope, Loader2, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  useSuggestDoctors, 
  useCurrentLocation, 
  useCurrentUser,
  useSpecialistHospitals 
} from '../hooks/useApi';
import type { Doctor } from '../services/api';

const DoctorFinder = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [specialty, setSpecialty] = useState('all');
  const [useAISuggestions, setUseAISuggestions] = useState(false);
  
  // Get current user and location
  const { data: currentUser } = useCurrentUser();
  const { data: location, isLoading: locationLoading, error: locationError } = useCurrentLocation();
  
  // AI-powered doctor suggestions based on patient data
  const { 
    data: aiSuggestedDoctors, 
    isLoading: aiLoading, 
    error: aiError 
  } = useSuggestDoctors(
    useAISuggestions && currentUser?._id ? currentUser._id : '',
    useAISuggestions && location ? location : undefined
  );
  
  // Specialist hospitals in the area
  const { 
    data: specialistHospitals, 
    isLoading: specialistLoading 
  } = useSpecialistHospitals(
    specialty !== 'all' ? specialty : undefined,
    location?.latitude,
    location?.longitude,
    50
  );

  // Extract doctors from specialist hospitals
  const hospitalDoctors = specialistHospitals?.flatMap(hospital => 
    hospital.services?.specialties?.map(spec => ({
      id: `${hospital._id}-${spec}`,
      name: `Dr. ${spec} Specialist`,
      specialty: spec,
      location: hospital.basicInfo.name,
      distance: '0.5 miles', // This would be calculated
      rating: hospital.ratings?.averageRating || 4.5,
      availability: 'Available today',
      hospitalId: hospital._id,
      address: `${hospital.basicInfo.address.street}, ${hospital.basicInfo.address.city}`,
      phone: hospital.basicInfo.phone
    }))
  ) || [];

  // Combine AI suggestions with hospital doctors
  const allDoctors = [
    ...(aiSuggestedDoctors || []),
    ...hospitalDoctors
  ];
  
  // Filter doctors based on search term and specialty
  const filteredDoctors = allDoctors.filter(doctor => {
    const matchesSearch = doctor.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          doctor.specialty?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          doctor.professionalInfo?.specializations?.some(spec => 
                            spec.toLowerCase().includes(searchTerm.toLowerCase())
                          );
    
    const matchesSpecialty = specialty === 'all' || 
                            doctor.specialty === specialty ||
                            doctor.professionalInfo?.specializations?.includes(specialty);
    
    return matchesSearch && matchesSpecialty;
  });
  
  // Generate star rating display
  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    return (
      <div className="flex items-center">
        {[...Array(fullStars)].map((_, i) => (
          <span key={i} className="text-yellow-400">★</span>
        ))}
        {hasHalfStar && <span className="text-yellow-400">★</span>}
        {[...Array(5 - fullStars - (hasHalfStar ? 1 : 0))].map((_, i) => (
          <span key={i} className="text-gray-300">★</span>
        ))}
        <span className="ml-1 text-sm">{rating.toFixed(1)}</span>
      </div>
    );
  };

  const formatDoctorName = (doctor: any) => {
    if (doctor.personalInfo) {
      return `Dr. ${doctor.personalInfo.firstName} ${doctor.personalInfo.lastName}`;
    }
    return doctor.name || 'Dr. Unknown';
  };

  const formatSpecialty = (doctor: any) => {
    if (doctor.professionalInfo?.specializations?.length > 0) {
      return doctor.professionalInfo.specializations[0];
    }
    return doctor.specialty || 'General Practice';
  };

  const formatLocation = (doctor: any) => {
    if (doctor.practiceInfo?.clinicAddress) {
      const addr = doctor.practiceInfo.clinicAddress;
      return `${addr.street}, ${addr.city}`;
    }
    return doctor.location || doctor.address || 'Location not specified';
  };

  const formatAvailability = (doctor: any) => {
    if (doctor.practiceInfo?.availability?.length > 0) {
      const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
      const todaySchedule = doctor.practiceInfo.availability.find(
        (slot: any) => slot.day.toLowerCase() === today.toLowerCase()
      );
      if (todaySchedule) {
        return `Available today: ${todaySchedule.startTime} - ${todaySchedule.endTime}`;
      }
      return 'Check availability';
    }
    return doctor.availability || 'Available today';
  };

  const getRating = (doctor: any) => {
    return doctor.ratings?.averageRating || doctor.rating || 4.5;
  };

  if (locationError) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Unable to get your location. Please enable location services to find nearby doctors.
        </AlertDescription>
      </Alert>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Find a Doctor</h2>
        
        {/* AI Suggestions Toggle */}
        {currentUser && (
          <div className="mb-4">
            <Button
              variant={useAISuggestions ? "default" : "outline"}
              onClick={() => setUseAISuggestions(!useAISuggestions)}
              className="mb-2"
            >
              {useAISuggestions ? "Using AI Recommendations" : "Get AI Recommendations"}
            </Button>
            {useAISuggestions && (
              <p className="text-sm text-muted-foreground">
                AI is analyzing your medical history to suggest the best doctors for you.
              </p>
            )}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <Input
              placeholder="Search by name or specialty"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div>
            <Select value={specialty} onValueChange={setSpecialty}>
              <SelectTrigger>
                <SelectValue placeholder="Specialty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Specialties</SelectItem>
                <SelectItem value="Cardiology">Cardiology</SelectItem>
                <SelectItem value="Family Medicine">Family Medicine</SelectItem>
                <SelectItem value="Pediatrics">Pediatrics</SelectItem>
                <SelectItem value="Dermatology">Dermatology</SelectItem>
                <SelectItem value="Orthopedics">Orthopedics</SelectItem>
                <SelectItem value="Neurology">Neurology</SelectItem>
                <SelectItem value="Oncology">Oncology</SelectItem>
                <SelectItem value="Psychiatry">Psychiatry</SelectItem>
                <SelectItem value="Emergency Medicine">Emergency Medicine</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center">
            {(locationLoading || aiLoading || specialistLoading) && (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            )}
            <span className="text-sm text-muted-foreground">
              {locationLoading ? 'Getting location...' : 
               aiLoading ? 'AI analyzing...' : 
               specialistLoading ? 'Finding specialists...' : 
               `${filteredDoctors.length} doctors found`}
            </span>
          </div>
        </div>
      </div>

      {/* AI Suggestions Alert */}
      {useAISuggestions && aiSuggestedDoctors && aiSuggestedDoctors.length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Based on your medical history, we've found {aiSuggestedDoctors.length} doctors that may be particularly suitable for your needs.
          </AlertDescription>
        </Alert>
      )}

      {/* Error handling */}
      {aiError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Unable to get AI recommendations. Showing general search results.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="space-y-4">
        {filteredDoctors.length > 0 ? (
          filteredDoctors.map((doctor, index) => (
            <Card key={doctor._id || doctor.id || index} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row">
                  <div className="bg-primary/5 p-6 flex items-center justify-center md:w-1/4">
                    <div className="rounded-full bg-primary/10 p-6">
                      <Stethoscope className="h-8 w-8 text-primary" />
                    </div>
                  </div>
                  <div className="p-6 md:w-3/4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold">{formatDoctorName(doctor)}</h3>
                        {useAISuggestions && aiSuggestedDoctors?.includes(doctor) && (
                          <Badge className="text-xs bg-blue-100 text-blue-800">
                            AI Recommended
                          </Badge>
                        )}
                      </div>
                      <div className="mt-1 md:mt-0">
                        {renderStars(getRating(doctor))}
                      </div>
                    </div>
                    <p className="text-primary font-medium">{formatSpecialty(doctor)}</p>
                    {doctor.professionalInfo?.yearsOfExperience && (
                      <p className="text-sm text-muted-foreground">
                        {doctor.professionalInfo.yearsOfExperience} years of experience
                      </p>
                    )}
                    <div className="flex items-center text-sm text-muted-foreground mt-2">
                      <MapPin size={16} className="mr-1" />
                      {formatLocation(doctor)}
                      {doctor.distance && ` (${doctor.distance})`}
                    </div>
                    {doctor.practiceInfo?.consultationFee && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Consultation fee: ${doctor.practiceInfo.consultationFee}
                      </p>
                    )}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mt-4">
                      <p className="text-sm font-medium text-green-600">
                        {formatAvailability(doctor)}
                      </p>
                      <div className="mt-3 md:mt-0 space-x-2">
                        <Button variant="outline" size="sm">View Profile</Button>
                        <Button size="sm">Book Appointment</Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-8">
            {(locationLoading || aiLoading || specialistLoading) ? (
              <div className="flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin mr-2" />
                <p>Finding the best doctors for you...</p>
              </div>
            ) : (
              <>
                <p>No doctors found matching your criteria.</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Try adjusting your search filters or enable location services.
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorFinder;
