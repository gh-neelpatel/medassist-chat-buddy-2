
import React, { useState } from 'react';
import { MapPin, Search, Star } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Facility {
  id: string;
  name: string;
  type: string;
  address: string;
  distance: string;
  rating: number;
  hours: string;
  services: string[];
  emergencyCare: boolean;
}

const FacilityFinder = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [facilityType, setFacilityType] = useState('all');
  const [distance, setDistance] = useState('any');
  
  // Mock data - in a real app, this would come from an API
  const facilities: Facility[] = [
    {
      id: '1',
      name: 'Central City Hospital',
      type: 'Hospital',
      address: '123 Medical Center Dr, Central City',
      distance: '2.3 miles',
      rating: 4.5,
      hours: 'Open 24 hours',
      services: ['Emergency', 'Surgery', 'Cardiology', 'Radiology'],
      emergencyCare: true
    },
    {
      id: '2',
      name: 'Westside Urgent Care',
      type: 'Urgent Care',
      address: '456 Health Parkway, West District',
      distance: '1.7 miles',
      rating: 4.3,
      hours: '8:00 AM - 8:00 PM',
      services: ['Urgent Care', 'X-Ray', 'Lab Services'],
      emergencyCare: false
    },
    {
      id: '3',
      name: 'Eastside Medical Group',
      type: 'Clinic',
      address: '789 Wellness Ave, East Neighborhood',
      distance: '3.2 miles',
      rating: 4.8,
      hours: '9:00 AM - 5:00 PM',
      services: ['Primary Care', 'Pediatrics', 'Women\'s Health'],
      emergencyCare: false
    },
    {
      id: '4',
      name: 'Downtown Imaging Center',
      type: 'Specialty',
      address: '567 Diagnostic Street, Downtown',
      distance: '4.1 miles',
      rating: 4.6,
      hours: '8:00 AM - 6:00 PM',
      services: ['MRI', 'CT Scan', 'Ultrasound', 'X-Ray'],
      emergencyCare: false
    }
  ];

  // Filter facilities based on search query and filters
  const filteredFacilities = facilities.filter(facility => {
    const matchesSearch = 
      searchQuery === '' || 
      facility.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      facility.services.some(service => service.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesType = 
      facilityType === 'all' || 
      facility.type.toLowerCase() === facilityType.toLowerCase();
    
    return matchesSearch && matchesType;
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would trigger an API call
    console.log('Searching for:', searchQuery, facilityType, distance);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Find Healthcare Facilities</h2>
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-grow">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search by facility name or service..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="grid grid-cols-2 md:flex gap-4">
                  <Select value={facilityType} onValueChange={setFacilityType}>
                    <SelectTrigger className="w-full md:w-40">
                      <SelectValue placeholder="Facility Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="hospital">Hospital</SelectItem>
                      <SelectItem value="urgent care">Urgent Care</SelectItem>
                      <SelectItem value="clinic">Clinic</SelectItem>
                      <SelectItem value="specialty">Specialty Center</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={distance} onValueChange={setDistance}>
                    <SelectTrigger className="w-full md:w-40">
                      <SelectValue placeholder="Distance" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any Distance</SelectItem>
                      <SelectItem value="5">Within 5 miles</SelectItem>
                      <SelectItem value="10">Within 10 miles</SelectItem>
                      <SelectItem value="25">Within 25 miles</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button type="submit" className="w-full md:w-auto">Search</Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">
          {filteredFacilities.length} 
          {facilityType !== 'all' ? ` ${facilityType}` : ' healthcare'} facilities found
        </h3>
        
        <div className="grid grid-cols-1 gap-4">
          {filteredFacilities.map((facility) => (
            <Card key={facility.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{facility.name}</CardTitle>
                    <div className="flex items-center mt-1">
                      <Badge variant="outline" className="mr-2">
                        {facility.type}
                      </Badge>
                      {facility.emergencyCare && (
                        <Badge variant="destructive">Emergency Care</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Star size={16} className="text-yellow-400 mr-1" />
                    <span className="text-sm font-medium">{facility.rating.toFixed(1)}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-2">
                  <MapPin size={16} className="text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm">{facility.address}</p>
                    <p className="text-xs text-muted-foreground">{facility.distance}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium">{facility.hours}</p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Services:</p>
                  <div className="flex flex-wrap gap-2">
                    {facility.services.map((service, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {service}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <Button variant="outline" size="sm">View Details</Button>
                  <Button size="sm">Get Directions</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {filteredFacilities.length === 0 && (
          <div className="text-center py-8 bg-muted/50 rounded-lg">
            <MapPin size={40} className="mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No facilities found</h3>
            <p className="text-muted-foreground">Try adjusting your search criteria</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FacilityFinder;
