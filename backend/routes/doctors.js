import express from 'express';
import Doctor from '../models/Doctor.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { validateDoctorId } from '../middleware/validation.js';

const router = express.Router();

/**
 * @route   GET /api/doctors
 * @desc    Get all doctors with optional filtering
 * @access  Public
 */
router.get('/', asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    specialty,
    city,
    state,
    zipCode,
    rating,
    acceptingNewPatients,
    language,
    insurance
  } = req.query;

  const query = { isActive: true, isVerified: true };

  // Add filters
  if (specialty) query.specializations = { $in: [specialty] };
  if (city) query['officeAddress.city'] = new RegExp(city, 'i');
  if (state) query['officeAddress.state'] = new RegExp(state, 'i');
  if (zipCode) query['officeAddress.zipCode'] = zipCode;
  if (rating) query.averageRating = { $gte: parseFloat(rating) };
  if (acceptingNewPatients === 'true') query.acceptingNewPatients = true;
  if (language) query.languagesSpoken = { $in: [language] };
  if (insurance) query.acceptedInsurance = { $in: [insurance] };

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  const doctors = await Doctor.find(query)
    .populate('hospital', 'name address phone')
    .sort({ averageRating: -1 })
    .skip(skip)
    .limit(limitNum)
    .lean();

  const total = await Doctor.countDocuments(query);

  res.status(200).json({
    success: true,
    data: {
      doctors,
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
 * @route   GET /api/doctors/:id
 * @desc    Get doctor by ID
 * @access  Public
 */
router.get('/:id', validateDoctorId, asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.params.id)
    .populate('hospital', 'name address phone website')
    .lean();

  if (!doctor) {
    return res.status(404).json({
      success: false,
      error: { message: 'Doctor not found' }
    });
  }

  res.status(200).json({
    success: true,
    data: { doctor }
  });
}));

/**
 * @route   GET /api/doctors/:id/availability
 * @desc    Get doctor availability
 * @access  Public
 */
router.get('/:id/availability', validateDoctorId, asyncHandler(async (req, res) => {
  const { date } = req.query;
  const doctor = await Doctor.findById(req.params.id);

  if (!doctor) {
    return res.status(404).json({
      success: false,
      error: { message: 'Doctor not found' }
    });
  }

  const availability = date ? 
    doctor.getAvailableSlots(date) : 
    doctor.schedule;

  res.status(200).json({
    success: true,
    data: { availability }
  });
}));

/**
 * @route   GET /api/doctors/specialties
 * @desc    Get available specialties
 * @access  Public
 */
router.get('/meta/specialties', asyncHandler(async (req, res) => {
  const specialties = await Doctor.distinct('specializations');
  
  res.status(200).json({
    success: true,
    data: { specialties: specialties.filter(Boolean) }
  });
}));

/**
 * @route   GET /api/doctors/languages
 * @desc    Get available languages
 * @access  Public
 */
router.get('/meta/languages', asyncHandler(async (req, res) => {
  const languages = await Doctor.distinct('languagesSpoken');
  
  res.status(200).json({
    success: true,
    data: { languages: languages.filter(Boolean) }
  });
}));

export default router; 