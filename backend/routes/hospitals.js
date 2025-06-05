import express from 'express';
import Hospital from '../models/Hospital.js';
import hospitalLocatorService from '../services/hospitalLocatorService.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import axios from 'axios';

const router = express.Router();

/**
 * @route   GET /api/hospitals
 * @desc    Get all hospitals with optional filtering
 * @access  Public
 */
router.get('/', asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    type,
    specialty,
    city,
    state,
    zipCode,
    rating,
    emergency,
    insurance
  } = req.query;

  const query = { isActive: true };

  // Add filters
  if (type) query.type = type;
  if (specialty) query.specialtyServices = { $in: [specialty] };
  if (city) query['address.city'] = new RegExp(city, 'i');
  if (state) query['address.state'] = new RegExp(state, 'i');
  if (zipCode) query['address.zipCode'] = zipCode;
  if (rating) query['qualityRatings.overall'] = { $gte: parseFloat(rating) };
  if (emergency === 'true') query['operatingHours.emergency.is24Hours'] = true;
  if (insurance) {
    query['acceptedInsurance.provider'] = { $regex: new RegExp(insurance, 'i') };
  }

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  const hospitals = await Hospital.find(query)
    .populate('doctors', 'firstName lastName specializations averageRating')
    .sort({ 'qualityRatings.overall': -1 })
    .skip(skip)
    .limit(limitNum)
    .lean();

  const total = await Hospital.countDocuments(query);

  res.status(200).json({
    success: true,
    data: {
      hospitals,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    }
  });
}));

/**
 * @route   POST /api/hospitals/nearby
 * @desc    Find nearby hospitals using Google Maps API
 * @access  Public
 */
router.post('/nearby',
  asyncHandler(async (req, res) => {
    const { latitude, longitude, radius = 25000, type = 'hospital' } = req.body;
    
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        error: { message: 'Latitude and longitude are required' }
      });
    }

    try {
      const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY;
      
      // Check if we have a real Google Maps API key
      const hasRealApiKey = googleMapsApiKey && !googleMapsApiKey.includes('placeholder') && !googleMapsApiKey.includes('your-');
      
      if (!hasRealApiKey) {
        // Provide demo data for demonstration purposes
        const demoHospitals = generateDemoHospitals(latitude, longitude, radius);
        return res.status(200).json({
          success: true,
          data: {
            hospitals: demoHospitals,
            searchLocation: { latitude, longitude },
            radius,
            totalFound: demoHospitals.length,
            demoMode: true,
            message: "Demo mode: Replace GOOGLE_MAPS_API_KEY with real API key for live data",
            generatedAt: new Date()
          }
        });
      }

      // Google Places API call to find nearby hospitals
      const response = await axios.get('https://maps.googleapis.com/maps/api/place/nearbysearch/json', {
        params: {
          location: `${latitude},${longitude}`,
          radius: radius,
          type: type,
          keyword: 'hospital medical center emergency',
          key: googleMapsApiKey
        }
      });

      const hospitals = response.data.results.map(place => ({
        id: place.place_id,
        name: place.name,
        address: place.vicinity,
        rating: place.rating || 0,
        userRatingsTotal: place.user_ratings_total || 0,
        location: {
          latitude: place.geometry.location.lat,
          longitude: place.geometry.location.lng
        },
        openNow: place.opening_hours?.open_now || null,
        types: place.types,
        photos: place.photos ? place.photos.map(photo => ({
          reference: photo.photo_reference,
          width: photo.width,
          height: photo.height
        })) : [],
        priceLevel: place.price_level,
        distance: calculateDistance(latitude, longitude, place.geometry.location.lat, place.geometry.location.lng)
      }));

      // Sort by distance
      hospitals.sort((a, b) => a.distance - b.distance);

      res.status(200).json({
        success: true,
        data: {
          hospitals,
          searchLocation: { latitude, longitude },
          radius,
          totalFound: hospitals.length,
          generatedAt: new Date()
        }
      });

    } catch (error) {
      console.error('Error finding nearby hospitals:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Failed to find nearby hospitals' }
      });
    }
  })
);

/**
 * @route   GET /api/hospitals/details/:placeId
 * @desc    Get detailed information about a specific hospital
 * @access  Public
 */
router.get('/details/:placeId',
  asyncHandler(async (req, res) => {
    const { placeId } = req.params;
    
    try {
      const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY;
      
      if (!googleMapsApiKey) {
        return res.status(500).json({
          success: false,
          error: { message: 'Google Maps API key not configured' }
        });
      }

      // Google Places Details API call
      const response = await axios.get('https://maps.googleapis.com/maps/api/place/details/json', {
        params: {
          place_id: placeId,
          fields: 'name,formatted_address,formatted_phone_number,website,opening_hours,rating,user_ratings_total,reviews,photos,geometry',
          key: googleMapsApiKey
        }
      });

      const place = response.data.result;
      
      const hospitalDetails = {
        id: placeId,
        name: place.name,
        address: place.formatted_address,
        phone: place.formatted_phone_number,
        website: place.website,
        rating: place.rating || 0,
        userRatingsTotal: place.user_ratings_total || 0,
        location: {
          latitude: place.geometry.location.lat,
          longitude: place.geometry.location.lng
        },
        openingHours: place.opening_hours ? {
          openNow: place.opening_hours.open_now,
          weekdayText: place.opening_hours.weekday_text
        } : null,
        reviews: place.reviews ? place.reviews.slice(0, 5).map(review => ({
          author: review.author_name,
          rating: review.rating,
          text: review.text,
          time: review.time
        })) : [],
        photos: place.photos ? place.photos.slice(0, 5).map(photo => ({
          reference: photo.photo_reference,
          width: photo.width,
          height: photo.height
        })) : []
      };

      res.status(200).json({
        success: true,
        data: hospitalDetails
      });

    } catch (error) {
      console.error('Error getting hospital details:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Failed to get hospital details' }
      });
    }
  })
);

/**
 * @route   POST /api/hospitals/directions
 * @desc    Get directions to a hospital
 * @access  Public
 */
router.post('/directions',
  asyncHandler(async (req, res) => {
    const { origin, destination, mode = 'driving' } = req.body;
    
    if (!origin || !destination) {
      return res.status(400).json({
        success: false,
        error: { message: 'Origin and destination are required' }
      });
    }

    try {
      const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY;
      
      if (!googleMapsApiKey) {
        return res.status(500).json({
          success: false,
          error: { message: 'Google Maps API key not configured' }
        });
      }

      // Google Directions API call
      const response = await axios.get('https://maps.googleapis.com/maps/api/directions/json', {
        params: {
          origin: `${origin.latitude},${origin.longitude}`,
          destination: `${destination.latitude},${destination.longitude}`,
          mode: mode,
          key: googleMapsApiKey
        }
      });

      const route = response.data.routes[0];
      
      if (!route) {
        return res.status(404).json({
          success: false,
          error: { message: 'No route found' }
        });
      }

      const directions = {
        distance: route.legs[0].distance,
        duration: route.legs[0].duration,
        startAddress: route.legs[0].start_address,
        endAddress: route.legs[0].end_address,
        steps: route.legs[0].steps.map(step => ({
          instruction: step.html_instructions.replace(/<[^>]*>/g, ''), // Remove HTML tags
          distance: step.distance,
          duration: step.duration,
          startLocation: step.start_location,
          endLocation: step.end_location
        })),
        overviewPolyline: route.overview_polyline.points
      };

      res.status(200).json({
        success: true,
        data: directions
      });

    } catch (error) {
      console.error('Error getting directions:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Failed to get directions' }
      });
    }
  })
);

/**
 * @route   POST /api/hospitals/emergency
 * @desc    Find nearest emergency hospitals with priority routing
 * @access  Public
 */
router.post('/emergency',
  asyncHandler(async (req, res) => {
    const { latitude, longitude, radius = 50000 } = req.body;
    
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        error: { message: 'Latitude and longitude are required' }
      });
    }

    try {
      const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY;
      
      // Check if we have a real Google Maps API key
      const hasRealApiKey = googleMapsApiKey && !googleMapsApiKey.includes('placeholder') && !googleMapsApiKey.includes('your-');
      
      if (!hasRealApiKey) {
        // Provide demo emergency hospitals for demonstration purposes
        const demoEmergencyHospitals = generateDemoEmergencyHospitals(latitude, longitude, radius);
        return res.status(200).json({
          success: true,
          data: {
            emergencyHospitals: demoEmergencyHospitals,
            searchLocation: { latitude, longitude },
            emergencyMessage: "For life-threatening emergencies, call 911 immediately",
            demoMode: true,
            message: "Demo mode: Replace GOOGLE_MAPS_API_KEY with real API key for live data",
            generatedAt: new Date()
          }
        });
      }

      // Search for emergency rooms and hospitals
      const response = await axios.get('https://maps.googleapis.com/maps/api/place/nearbysearch/json', {
        params: {
          location: `${latitude},${longitude}`,
          radius: radius,
          type: 'hospital',
          keyword: 'emergency room ER trauma center',
          key: googleMapsApiKey
        }
      });

      const emergencyHospitals = response.data.results.map(place => ({
        id: place.place_id,
        name: place.name,
        address: place.vicinity,
        rating: place.rating || 0,
        location: {
          latitude: place.geometry.location.lat,
          longitude: place.geometry.location.lng
        },
        openNow: place.opening_hours?.open_now || null,
        distance: calculateDistance(latitude, longitude, place.geometry.location.lat, place.geometry.location.lng),
        emergencyServices: true,
        priority: calculateEmergencyPriority(place, latitude, longitude)
      }));

      // Sort by emergency priority (distance + rating + open status)
      emergencyHospitals.sort((a, b) => b.priority - a.priority);

      res.status(200).json({
        success: true,
        data: {
          emergencyHospitals: emergencyHospitals.slice(0, 10), // Top 10 emergency options
          searchLocation: { latitude, longitude },
          emergencyMessage: "For life-threatening emergencies, call 911 immediately",
          generatedAt: new Date()
        }
      });

    } catch (error) {
      console.error('Error finding emergency hospitals:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Failed to find emergency hospitals' }
      });
    }
  })
);

// Helper function to calculate distance between two points
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in kilometers
  return Math.round(distance * 100) / 100; // Round to 2 decimal places
}

// Helper function to calculate emergency priority
function calculateEmergencyPriority(place, userLat, userLon) {
  const distance = calculateDistance(userLat, userLon, place.geometry.location.lat, place.geometry.location.lng);
  const rating = place.rating || 3;
  const isOpen = place.opening_hours?.open_now || false;
  
  // Priority calculation: closer distance = higher priority, higher rating = higher priority, open = higher priority
  let priority = 100 - distance; // Base priority on distance
  priority += rating * 5; // Add rating bonus
  priority += isOpen ? 20 : 0; // Add bonus for being open
  
  return Math.round(priority * 100) / 100;
}

// Demo data generation functions for when Google Maps API is not available
function generateDemoHospitals(userLat, userLon, radius) {
  const demoHospitals = [
    {
      id: 'demo_hospital_1',
      name: 'General Medical Center',
      address: '123 Healthcare Ave, Medical District',
      rating: 4.2,
      userRatingsTotal: 234,
      location: {
        latitude: userLat + 0.01,
        longitude: userLon + 0.01
      },
      openNow: true,
      distance: 1.2
    },
    {
      id: 'demo_hospital_2',
      name: 'Regional Hospital',
      address: '456 Wellness Blvd, Health Center',
      rating: 3.9,
      userRatingsTotal: 189,
      location: {
        latitude: userLat - 0.02,
        longitude: userLon + 0.015
      },
      openNow: true,
      distance: 2.1
    },
    {
      id: 'demo_hospital_3',
      name: 'Community Health Center',
      address: '789 Care Street, Community Area',
      rating: 4.5,
      userRatingsTotal: 156,
      location: {
        latitude: userLat + 0.025,
        longitude: userLon - 0.01
      },
      openNow: false,
      distance: 3.4
    },
    {
      id: 'demo_hospital_4',
      name: 'Metro Medical Complex',
      address: '321 Doctor Drive, Metro Center',
      rating: 4.0,
      userRatingsTotal: 298,
      location: {
        latitude: userLat - 0.015,
        longitude: userLon - 0.02
      },
      openNow: true,
      distance: 2.8
    }
  ];

  // Filter by radius (convert km to degrees approximately)
  const maxDistance = radius / 1000; // Convert meters to km
  return demoHospitals.filter(hospital => hospital.distance <= maxDistance)
                     .sort((a, b) => a.distance - b.distance);
}

function generateDemoEmergencyHospitals(userLat, userLon, radius) {
  const demoEmergencyHospitals = [
    {
      id: 'demo_emergency_1',
      name: 'Emergency Medical Center',
      address: '100 Emergency Way, Medical District',
      rating: 4.3,
      location: {
        latitude: userLat + 0.008,
        longitude: userLon + 0.012
      },
      openNow: true,
      distance: 1.1,
      emergencyServices: true,
      priority: 95.3
    },
    {
      id: 'demo_emergency_2',
      name: 'Trauma Center Regional',
      address: '200 Urgent Care Lane, Health District',
      rating: 4.6,
      location: {
        latitude: userLat - 0.01,
        longitude: userLon + 0.018
      },
      openNow: true,
      distance: 1.8,
      emergencyServices: true,
      priority: 93.2
    },
    {
      id: 'demo_emergency_3',
      name: '24/7 Emergency Hospital',
      address: '300 Critical Care Ave, Emergency Zone',
      rating: 4.1,
      location: {
        latitude: userLat + 0.02,
        longitude: userLon - 0.015
      },
      openNow: true,
      distance: 2.5,
      emergencyServices: true,
      priority: 89.5
    }
  ];

  // Filter by radius and sort by priority
  const maxDistance = radius / 1000;
  return demoEmergencyHospitals.filter(hospital => hospital.distance <= maxDistance)
                              .sort((a, b) => b.priority - a.priority);
}

/**
 * @route   GET /api/hospitals/:id
 * @desc    Get hospital by ID
 * @access  Public
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const hospital = await Hospital.findById(req.params.id)
    .populate('doctors', 'firstName lastName specializations averageRating yearsOfExperience')
    .lean();

  if (!hospital) {
    return res.status(404).json({
      success: false,
      error: { message: 'Hospital not found' }
    });
  }

  res.status(200).json({
    success: true,
    data: { hospital }
  });
}));

/**
 * @route   GET /api/hospitals/:id/capacity
 * @desc    Get real-time hospital capacity
 * @access  Public
 */
router.get('/:id/capacity', asyncHandler(async (req, res) => {
  const capacity = await hospitalLocatorService.getHospitalCapacity(req.params.id);

  res.status(200).json({
    success: true,
    data: { capacity }
  });
}));

/**
 * @route   POST /api/hospitals/:id/directions
 * @desc    Get directions to hospital
 * @access  Public
 */
router.post('/:id/directions', asyncHandler(async (req, res) => {
  const { origin, mode = 'driving' } = req.body;

  if (!origin) {
    return res.status(400).json({
      success: false,
      error: { message: 'Origin location is required' }
    });
  }

  const directions = await hospitalLocatorService.getDirections(origin, req.params.id, mode);

  res.status(200).json({
    success: true,
    data: { directions }
  });
}));

/**
 * @route   GET /api/hospitals/search/:query
 * @desc    Search hospitals by name
 * @access  Public
 */
router.get('/search/:query', asyncHandler(async (req, res) => {
  const { query } = req.params;
  const { location, radius } = req.query;

  const results = await hospitalLocatorService.searchHospitalsByName(
    query, 
    location ? JSON.parse(location) : null, 
    radius ? parseInt(radius) : undefined
  );

  res.status(200).json({
    success: true,
    data: results
  });
}));

/**
 * @route   GET /api/hospitals/:id/departments
 * @desc    Get hospital departments and services
 * @access  Public
 */
router.get('/:id/departments', asyncHandler(async (req, res) => {
  const hospital = await Hospital.findById(req.params.id)
    .select('departments specialtyServices')
    .lean();

  if (!hospital) {
    return res.status(404).json({
      success: false,
      error: { message: 'Hospital not found' }
    });
  }

  const activeDepartments = hospital.departments.filter(dept => dept.isActive);

  res.status(200).json({
    success: true,
    data: {
      departments: activeDepartments,
      specialtyServices: hospital.specialtyServices
    }
  });
}));

/**
 * @route   GET /api/hospitals/:id/reviews
 * @desc    Get hospital reviews
 * @access  Public
 */
router.get('/:id/reviews', asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);

  const hospital = await Hospital.findById(req.params.id)
    .select('reviews averageRating totalReviews')
    .lean();

  if (!hospital) {
    return res.status(404).json({
      success: false,
      error: { message: 'Hospital not found' }
    });
  }

  const publicReviews = hospital.reviews
    .filter(review => review.isPublic)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice((pageNum - 1) * limitNum, pageNum * limitNum);

  res.status(200).json({
    success: true,
    data: {
      reviews: publicReviews,
      averageRating: hospital.averageRating,
      totalReviews: hospital.totalReviews,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: hospital.reviews.filter(r => r.isPublic).length
      }
    }
  });
}));

/**
 * @route   POST /api/hospitals/:id/reviews
 * @desc    Add a review for a hospital
 * @access  Private (would require authentication)
 */
router.post('/:id/reviews', asyncHandler(async (req, res) => {
  const { rating, comment, department, visitDate } = req.body;
  
  // In a real app, you'd get this from authentication middleware
  const patientId = req.body.patientId || '507f1f77bcf86cd799439011'; // Mock patient ID

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({
      success: false,
      error: { message: 'Rating must be between 1 and 5' }
    });
  }

  const hospital = await Hospital.findById(req.params.id);

  if (!hospital) {
    return res.status(404).json({
      success: false,
      error: { message: 'Hospital not found' }
    });
  }

  await hospital.addReview(patientId, rating, comment, department, visitDate);

  res.status(201).json({
    success: true,
    data: { message: 'Review added successfully' }
  });
}));

/**
 * @route   GET /api/hospitals/types
 * @desc    Get available hospital types
 * @access  Public
 */
router.get('/meta/types', asyncHandler(async (req, res) => {
  const types = await Hospital.distinct('type');
  
  res.status(200).json({
    success: true,
    data: { types }
  });
}));

/**
 * @route   GET /api/hospitals/specialties
 * @desc    Get available specialties
 * @access  Public
 */
router.get('/meta/specialties', asyncHandler(async (req, res) => {
  const specialties = await Hospital.distinct('specialtyServices');
  
  res.status(200).json({
    success: true,
    data: { specialties: specialties.filter(Boolean) }
  });
}));

/**
 * @route   GET /api/hospitals/cities
 * @desc    Get available cities
 * @access  Public
 */
router.get('/meta/cities', asyncHandler(async (req, res) => {
  const cities = await Hospital.distinct('address.city');
  
  res.status(200).json({
    success: true,
    data: { cities: cities.filter(Boolean) }
  });
}));

/**
 * @route   GET /api/hospitals/insurance-providers
 * @desc    Get accepted insurance providers
 * @access  Public
 */
router.get('/meta/insurance-providers', asyncHandler(async (req, res) => {
  const providers = await Hospital.distinct('acceptedInsurance.provider');
  
  res.status(200).json({
    success: true,
    data: { providers: providers.filter(Boolean) }
  });
}));

export default router; 