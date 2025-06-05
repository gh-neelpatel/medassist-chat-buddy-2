import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  MapPin, 
  Navigation, 
  Phone, 
  Star, 
  Clock, 
  AlertTriangle, 
  Search,
  ExternalLink,
  Route,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';

interface Hospital {
  id: string;
  name: string;
  address: string;
  rating: number;
  userRatingsTotal: number;
  location: {
    latitude: number;
    longitude: number;
  };
  openNow?: boolean;
  distance: number;
  emergencyServices?: boolean;
  priority?: number;
}

interface UserLocation {
  latitude: number;
  longitude: number;
}

export function HospitalLocator() {
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [emergencyHospitals, setEmergencyHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [searchRadius, setSearchRadius] = useState(25000); // 25km default

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser');
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setUserLocation(location);
        setLocationError(null);
        setLoading(false);
        
        // Automatically search for hospitals once location is obtained
        searchNearbyHospitals(location);
      },
      (error) => {
        setLocationError('Unable to get your location. Please allow location access.');
        setLoading(false);
        console.error('Geolocation error:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  const searchNearbyHospitals = async (location: UserLocation) => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/hospitals/nearby', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latitude: location.latitude,
          longitude: location.longitude,
          radius: searchRadius,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch nearby hospitals');
      }

      const data = await response.json();
      
      if (data.success) {
        setHospitals(data.data.hospitals);
        toast.success(`Found ${data.data.hospitals.length} nearby hospitals`);
      } else {
        throw new Error(data.error?.message || 'Failed to fetch hospitals');
      }
    } catch (error) {
      console.error('Error fetching hospitals:', error);
      toast.error('Failed to find nearby hospitals');
    } finally {
      setLoading(false);
    }
  };

  const searchEmergencyHospitals = async () => {
    if (!userLocation) {
      toast.error('Location not available');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/hospitals/emergency', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          radius: 50000, // 50km for emergency search
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch emergency hospitals');
      }

      const data = await response.json();
      
      if (data.success) {
        setEmergencyHospitals(data.data.emergencyHospitals);
        toast.success(`Found ${data.data.emergencyHospitals.length} emergency hospitals`);
      } else {
        throw new Error(data.error?.message || 'Failed to fetch emergency hospitals');
      }
    } catch (error) {
      console.error('Error fetching emergency hospitals:', error);
      toast.error('Failed to find emergency hospitals');
    } finally {
      setLoading(false);
    }
  };

  const getDirections = async (hospital: Hospital) => {
    if (!userLocation) {
      toast.error('Location not available for directions');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/hospitals/directions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          origin: userLocation,
          destination: hospital.location,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get directions');
      }

      const data = await response.json();
      
      if (data.success) {
        // Open Google Maps with directions
        const mapsUrl = `https://www.google.com/maps/dir/${userLocation.latitude},${userLocation.longitude}/${hospital.location.latitude},${hospital.location.longitude}`;
        window.open(mapsUrl, '_blank');
      } else {
        throw new Error(data.error?.message || 'Failed to get directions');
      }
    } catch (error) {
      console.error('Error getting directions:', error);
      toast.error('Failed to get directions');
    }
  };

  const HospitalCard = ({ hospital, isEmergency = false }: { hospital: Hospital; isEmergency?: boolean }) => (
    <Card className={`hover:shadow-lg transition-shadow ${isEmergency ? 'border-red-200 bg-red-50' : ''}`}>
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-lg text-gray-900">{hospital.name}</h3>
              <p className="text-sm text-gray-600 flex items-center mt-1">
                <MapPin className="h-4 w-4 mr-1" />
                {hospital.address}
              </p>
            </div>
            {isEmergency && (
              <Badge variant="destructive" className="ml-2">
                <Zap className="h-3 w-3 mr-1" />
                Emergency
              </Badge>
            )}
          </div>

          {/* Details */}
          <div className="flex items-center space-x-4 text-sm">
            {hospital.rating > 0 && (
              <div className="flex items-center">
                <Star className="h-4 w-4 text-yellow-500 mr-1" />
                <span className="font-medium">{hospital.rating.toFixed(1)}</span>
                <span className="text-gray-500 ml-1">({hospital.userRatingsTotal})</span>
              </div>
            )}
            
            <div className="flex items-center">
              <Navigation className="h-4 w-4 text-blue-500 mr-1" />
              <span>{hospital.distance} km away</span>
            </div>

            {hospital.openNow !== null && (
              <Badge variant={hospital.openNow ? "default" : "secondary"}>
                <Clock className="h-3 w-3 mr-1" />
                {hospital.openNow ? 'Open' : 'Closed'}
              </Badge>
            )}
          </div>

          {/* Actions */}
          <div className="flex space-x-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => getDirections(hospital)}
              className="flex-1"
            >
              <Route className="h-4 w-4 mr-1" />
              Directions
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hospital.name + ' ' + hospital.address)}`;
                window.open(mapsUrl, '_blank');
              }}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Hospital Locator
          </h1>
          <p className="text-lg text-gray-600">
            Find nearby hospitals and emergency medical facilities using your location
          </p>
        </div>

        {/* Location Status and Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="h-5 w-5 text-blue-600" />
                <span>Your Location</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {locationError ? (
                <Alert className="border-red-200">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    {locationError}
                  </AlertDescription>
                </Alert>
              ) : userLocation ? (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    Lat: {userLocation.latitude.toFixed(6)}
                  </p>
                  <p className="text-sm text-gray-600">
                    Lng: {userLocation.longitude.toFixed(6)}
                  </p>
                  <Badge variant="outline" className="text-green-600 border-green-200">
                    <MapPin className="h-3 w-3 mr-1" />
                    Location detected
                  </Badge>
                </div>
              ) : (
                <div className="text-center">
                  <div className="animate-pulse text-sm text-gray-500">
                    Getting your location...
                  </div>
                </div>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={getCurrentLocation}
                disabled={loading}
                className="w-full mt-3"
              >
                <Search className="h-4 w-4 mr-1" />
                Refresh Location
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Search Radius</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Input
                  type="number"
                  value={searchRadius / 1000}
                  onChange={(e) => setSearchRadius(Number(e.target.value) * 1000)}
                  placeholder="Search radius (km)"
                  min="1"
                  max="100"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => userLocation && searchNearbyHospitals(userLocation)}
                  disabled={!userLocation || loading}
                  className="w-full"
                >
                  <Search className="h-4 w-4 mr-1" />
                  Search Hospitals
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Emergency</CardTitle>
              <CardDescription>
                For life-threatening emergencies, call 911 immediately
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="destructive"
                onClick={searchEmergencyHospitals}
                disabled={!userLocation || loading}
                className="w-full"
              >
                <Zap className="h-4 w-4 mr-1" />
                Find Emergency Hospitals
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Results */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Regular Hospitals */}
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Nearby Hospitals ({hospitals.length})
            </h2>
            
            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : hospitals.length > 0 ? (
              <ScrollArea className="h-96">
                <div className="space-y-4 pr-4">
                  {hospitals.map((hospital) => (
                    <HospitalCard key={hospital.id} hospital={hospital} />
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <Card className="h-48 flex items-center justify-center">
                <CardContent className="text-center">
                  <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">
                    {userLocation ? 'No hospitals found in the selected radius' : 'Enable location to find hospitals'}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Emergency Hospitals */}
          <div>
            <h2 className="text-2xl font-semibold text-red-600 mb-4">
              Emergency Hospitals ({emergencyHospitals.length})
            </h2>
            
            {emergencyHospitals.length > 0 ? (
              <ScrollArea className="h-96">
                <div className="space-y-4 pr-4">
                  {emergencyHospitals.map((hospital) => (
                    <HospitalCard key={hospital.id} hospital={hospital} isEmergency />
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <Card className="h-48 flex items-center justify-center border-red-200">
                <CardContent className="text-center">
                  <Zap className="h-12 w-12 text-red-400 mx-auto mb-2" />
                  <p className="text-red-500">
                    Click "Find Emergency Hospitals" to locate nearby emergency facilities
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 