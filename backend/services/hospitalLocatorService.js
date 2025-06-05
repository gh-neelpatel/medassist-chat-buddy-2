import axios from 'axios';
import { getDistance } from 'geolib';
import Hospital from '../models/Hospital.js';

class HospitalLocatorService {
  constructor() {
    this.googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY;
  }

  /**
   * Find hospitals near a given location
   */
  async findNearbyHospitals(location, options = {}) {
    try {
      const {
        radius = 25, // km
        limit = 20,
        specialty = null,
        emergency = false,
        insurance = null,
        type = null,
        rating = null,
        availableBeds = false
      } = options;

      let coordinates;

      // Handle different location input formats
      if (location.coordinates) {
        coordinates = location.coordinates;
      } else if (location.address) {
        coordinates = await this.geocodeAddress(location.address);
      } else if (location.zipCode) {
        coordinates = await this.geocodeZipCode(location.zipCode);
      } else {
        throw new Error('Invalid location format');
      }

      // Build search query
      let searchQuery = {
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: coordinates
            },
            $maxDistance: radius * 1000 // Convert km to meters
          }
        },
        isActive: true,
        isVerified: true
      };

      // Add filters
      if (specialty) {
        searchQuery.specialtyServices = { $in: [specialty] };
      }

      if (emergency) {
        searchQuery['operatingHours.emergency.is24Hours'] = true;
      }

      if (insurance) {
        searchQuery['acceptedInsurance.provider'] = { 
          $regex: new RegExp(insurance, 'i') 
        };
        searchQuery['acceptedInsurance.isInNetwork'] = true;
      }

      if (type) {
        searchQuery.type = type;
      }

      if (rating) {
        searchQuery['qualityRatings.overall'] = { $gte: rating };
      }

      if (availableBeds) {
        searchQuery['bedCount.available'] = { $gt: 0 };
      }

      // Execute search
      const hospitals = await Hospital.find(searchQuery)
        .populate('doctors', 'firstName lastName specializations averageRating')
        .limit(limit)
        .lean();

      // Enhance results with additional data
      const enhancedHospitals = await Promise.all(
        hospitals.map(async (hospital) => {
          const distance = getDistance(
            { latitude: coordinates[1], longitude: coordinates[0] },
            { latitude: hospital.location.coordinates[1], longitude: hospital.location.coordinates[0] }
          ) / 1000; // Convert to km

          const estimatedTravelTime = await this.getEstimatedTravelTime(
            coordinates,
            hospital.location.coordinates
          );

          return {
            ...hospital,
            distance: Math.round(distance * 10) / 10, // Round to 1 decimal
            estimatedTravelTime,
            currentWaitTime: hospital.getCurrentWaitTime ? hospital.getCurrentWaitTime() : null,
            availableBeds: hospital.getAvailableBeds ? hospital.getAvailableBeds('all') : null
          };
        })
      );

      // Sort by distance
      enhancedHospitals.sort((a, b) => a.distance - b.distance);

      return {
        hospitals: enhancedHospitals,
        searchLocation: {
          coordinates,
          radius
        },
        totalFound: enhancedHospitals.length,
        searchCriteria: searchQuery
      };

    } catch (error) {
      console.error('Error finding nearby hospitals:', error);
      throw new Error('Failed to find nearby hospitals');
    }
  }

  /**
   * Find hospitals by emergency services
   */
  async findEmergencyHospitals(location, urgencyLevel = 'standard') {
    try {
      const coordinates = await this.resolveCoordinates(location);
      
      let searchQuery = {
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: coordinates
            },
            $maxDistance: 50000 // 50km for emergency services
          }
        },
        isActive: true,
        'operatingHours.emergency.is24Hours': true,
        'emergencyServices.isAvailable': true
      };

      // Adjust based on urgency
      if (urgencyLevel === 'critical') {
        searchQuery['emergencyServices.service'] = { 
          $in: ['Trauma Center', 'Critical Care', 'Cardiac Emergency'] 
        };
        searchQuery['bedCount.icu'] = { $gt: 0 };
      }

      const hospitals = await Hospital.find(searchQuery)
        .sort({ 'emergencyServices.averageWaitTime': 1 }) // Sort by wait time
        .limit(10)
        .lean();

      const enhancedHospitals = await Promise.all(
        hospitals.map(async (hospital) => {
          const distance = getDistance(
            { latitude: coordinates[1], longitude: coordinates[0] },
            { latitude: hospital.location.coordinates[1], longitude: hospital.location.coordinates[0] }
          ) / 1000;

          const travelTime = await this.getEstimatedTravelTime(
            coordinates,
            hospital.location.coordinates,
            'driving' // Emergency assumes driving/ambulance
          );

          return {
            ...hospital,
            distance: Math.round(distance * 10) / 10,
            estimatedTravelTime: travelTime,
            emergencyCapacity: hospital.emergencyServices?.filter(service => service.isAvailable).length || 0,
            currentWaitTime: hospital.getCurrentWaitTime ? hospital.getCurrentWaitTime() : null
          };
        })
      );

      return {
        hospitals: enhancedHospitals,
        urgencyLevel,
        recommendedHospital: enhancedHospitals[0] || null
      };

    } catch (error) {
      console.error('Error finding emergency hospitals:', error);
      throw new Error('Failed to find emergency hospitals');
    }
  }

  /**
   * Find specialists in nearby hospitals
   */
  async findSpecialists(location, specialty, options = {}) {
    try {
      const {
        radius = 50,
        limit = 15,
        insurance = null,
        language = null,
        rating = 4.0
      } = options;

      const coordinates = await this.resolveCoordinates(location);

      // Find hospitals with the specialty
      const hospitalsWithSpecialty = await Hospital.findBySpecialty(specialty);
      
      // Filter by location
      const nearbyHospitals = hospitalsWithSpecialty.filter(hospital => {
        const distance = getDistance(
          { latitude: coordinates[1], longitude: coordinates[0] },
          { latitude: hospital.location.coordinates[1], longitude: hospital.location.coordinates[0] }
        ) / 1000;
        return distance <= radius;
      });

      // Get specialists from these hospitals
      const specialists = [];
      
      for (const hospital of nearbyHospitals) {
        const hospitalSpecialists = await this.findSpecialistsInHospital(
          hospital._id,
          specialty,
          { insurance, language, rating }
        );
        
        specialists.push(...hospitalSpecialists.map(specialist => ({
          ...specialist,
          hospital: {
            _id: hospital._id,
            name: hospital.name,
            address: hospital.address,
            phone: hospital.phone
          }
        })));
      }

      // Sort by rating and distance
      specialists.sort((a, b) => {
        if (a.averageRating !== b.averageRating) {
          return b.averageRating - a.averageRating;
        }
        return a.distance - b.distance;
      });

      return {
        specialists: specialists.slice(0, limit),
        specialty,
        searchLocation: coordinates,
        totalFound: specialists.length
      };

    } catch (error) {
      console.error('Error finding specialists:', error);
      throw new Error('Failed to find specialists');
    }
  }

  /**
   * Get real-time hospital capacity and wait times
   */
  async getHospitalCapacity(hospitalId) {
    try {
      const hospital = await Hospital.findById(hospitalId).lean();
      
      if (!hospital) {
        throw new Error('Hospital not found');
      }

      // In a real implementation, this would integrate with hospital systems
      // For now, we'll provide mock real-time data
      const capacity = {
        emergency: {
          current: hospital.bedCount?.emergency ? Math.floor(hospital.bedCount.emergency * 0.7) : 0,
          total: hospital.bedCount?.emergency || 0,
          waitTime: hospital.getCurrentWaitTime ? hospital.getCurrentWaitTime() : 30
        },
        icu: {
          current: hospital.bedCount?.icu ? Math.floor(hospital.bedCount.icu * 0.8) : 0,
          total: hospital.bedCount?.icu || 0,
          waitTime: null
        },
        general: {
          current: hospital.bedCount?.general ? Math.floor(hospital.bedCount.general * 0.6) : 0,
          total: hospital.bedCount?.general || 0,
          waitTime: null
        },
        totalAvailable: hospital.bedCount?.available || 0,
        lastUpdated: new Date()
      };

      return capacity;

    } catch (error) {
      console.error('Error getting hospital capacity:', error);
      throw new Error('Failed to get hospital capacity');
    }
  }

  /**
   * Get directions to a hospital
   */
  async getDirections(origin, hospitalId, mode = 'driving') {
    try {
      const hospital = await Hospital.findById(hospitalId).lean();
      
      if (!hospital) {
        throw new Error('Hospital not found');
      }

      const originCoords = await this.resolveCoordinates(origin);
      const destination = hospital.location.coordinates;

      if (!this.googleMapsApiKey) {
        // Return basic distance if no Google Maps API
        const distance = getDistance(
          { latitude: originCoords[1], longitude: originCoords[0] },
          { latitude: destination[1], longitude: destination[0] }
        ) / 1000;

        return {
          distance: Math.round(distance * 10) / 10,
          estimatedTime: Math.round(distance / 40 * 60), // Rough estimate: 40km/h average
          route: 'Google Maps API not configured'
        };
      }

      // Use Google Maps Directions API
      const directionsUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${originCoords[1]},${originCoords[0]}&destination=${destination[1]},${destination[0]}&mode=${mode}&key=${this.googleMapsApiKey}`;
      
      const response = await axios.get(directionsUrl);
      
      if (response.data.status === 'OK' && response.data.routes.length > 0) {
        const route = response.data.routes[0];
        const leg = route.legs[0];

        return {
          distance: leg.distance.text,
          duration: leg.duration.text,
          steps: leg.steps.map(step => ({
            instruction: step.html_instructions.replace(/<[^>]*>/g, ''),
            distance: step.distance.text,
            duration: step.duration.text
          })),
          polyline: route.overview_polyline.points
        };
      }

      throw new Error('No route found');

    } catch (error) {
      console.error('Error getting directions:', error);
      throw new Error('Failed to get directions');
    }
  }

  /**
   * Resolve coordinates from various location formats
   */
  async resolveCoordinates(location) {
    if (location.coordinates) {
      return location.coordinates;
    } else if (location.address) {
      return await this.geocodeAddress(location.address);
    } else if (location.zipCode) {
      return await this.geocodeZipCode(location.zipCode);
    } else if (typeof location === 'string') {
      // Try to geocode as address
      return await this.geocodeAddress(location);
    }
    
    throw new Error('Unable to resolve coordinates from location');
  }

  /**
   * Geocode an address to coordinates
   */
  async geocodeAddress(address) {
    try {
      if (!this.googleMapsApiKey) {
        // Return mock coordinates for major cities if no API key
        const mockCoordinates = {
          'new york': [-74.0060, 40.7128],
          'los angeles': [-118.2437, 34.0522],
          'chicago': [-87.6298, 41.8781],
          'houston': [-95.3698, 29.7604],
          'philadelphia': [-75.1652, 39.9526]
        };

        const normalizedAddress = address.toLowerCase();
        for (const [city, coords] of Object.entries(mockCoordinates)) {
          if (normalizedAddress.includes(city)) {
            return coords;
          }
        }

        // Default to NYC if no match
        return [-74.0060, 40.7128];
      }

      const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${this.googleMapsApiKey}`;
      
      const response = await axios.get(geocodeUrl);
      
      if (response.data.status === 'OK' && response.data.results.length > 0) {
        const location = response.data.results[0].geometry.location;
        return [location.lng, location.lat]; // [longitude, latitude]
      }

      throw new Error('Address not found');

    } catch (error) {
      console.error('Error geocoding address:', error);
      throw new Error('Failed to geocode address');
    }
  }

  /**
   * Geocode a zip code to coordinates
   */
  async geocodeZipCode(zipCode) {
    return this.geocodeAddress(zipCode);
  }

  /**
   * Get estimated travel time between two points
   */
  async getEstimatedTravelTime(origin, destination, mode = 'driving') {
    try {
      if (!this.googleMapsApiKey) {
        // Basic time estimation based on distance
        const distance = getDistance(
          { latitude: origin[1], longitude: origin[0] },
          { latitude: destination[1], longitude: destination[0] }
        ) / 1000;

        const speedKmH = mode === 'walking' ? 5 : mode === 'transit' ? 25 : 40;
        return Math.round(distance / speedKmH * 60); // minutes
      }

      const directionsUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin[1]},${origin[0]}&destination=${destination[1]},${destination[0]}&mode=${mode}&key=${this.googleMapsApiKey}`;
      
      const response = await axios.get(directionsUrl);
      
      if (response.data.status === 'OK' && response.data.routes.length > 0) {
        return response.data.routes[0].legs[0].duration.value / 60; // Convert seconds to minutes
      }

      return null;

    } catch (error) {
      console.error('Error getting travel time:', error);
      return null;
    }
  }

  /**
   * Find specialists in a specific hospital
   */
  async findSpecialistsInHospital(hospitalId, specialty, filters = {}) {
    try {
      const Doctor = (await import('../models/Doctor.js')).default;
      
      let query = {
        hospital: hospitalId,
        specializations: { $in: [specialty] },
        isActive: true,
        isVerified: true,
        acceptingNewPatients: true
      };

      if (filters.insurance) {
        query.acceptedInsurance = { $in: [filters.insurance] };
      }

      if (filters.language) {
        query.languagesSpoken = { $in: [filters.language] };
      }

      if (filters.rating) {
        query.averageRating = { $gte: filters.rating };
      }

      const specialists = await Doctor.find(query)
        .populate('hospital', 'name address phone')
        .lean();

      return specialists;

    } catch (error) {
      console.error('Error finding specialists in hospital:', error);
      return [];
    }
  }

  /**
   * Search hospitals by name or partial name
   */
  async searchHospitalsByName(query, location = null, radius = 100) {
    try {
      let searchCriteria = {
        $or: [
          { name: { $regex: new RegExp(query, 'i') } },
          { shortName: { $regex: new RegExp(query, 'i') } }
        ],
        isActive: true
      };

      if (location) {
        const coordinates = await this.resolveCoordinates(location);
        searchCriteria.location = {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: coordinates
            },
            $maxDistance: radius * 1000
          }
        };
      }

      const hospitals = await Hospital.find(searchCriteria)
        .limit(20)
        .lean();

      return {
        hospitals,
        query,
        totalFound: hospitals.length
      };

    } catch (error) {
      console.error('Error searching hospitals by name:', error);
      throw new Error('Failed to search hospitals');
    }
  }
}

export default new HospitalLocatorService(); 