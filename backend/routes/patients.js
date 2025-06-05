import express from 'express';
import Patient from '../models/Patient.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { validatePatientId } from '../middleware/validation.js';

const router = express.Router();

/**
 * @route   GET /api/patients/:id
 * @desc    Get patient by ID
 * @access  Private
 */
router.get('/:id', validatePatientId, asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.params.id)
    .populate('primaryDoctor', 'firstName lastName specializations')
    .lean();

  if (!patient) {
    return res.status(404).json({
      success: false,
      error: { message: 'Patient not found' }
    });
  }

  res.status(200).json({
    success: true,
    data: { patient }
  });
}));

/**
 * @route   PUT /api/patients/:id
 * @desc    Update patient
 * @access  Private
 */
router.put('/:id', validatePatientId, asyncHandler(async (req, res) => {
  const patient = await Patient.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  if (!patient) {
    return res.status(404).json({
      success: false,
      error: { message: 'Patient not found' }
    });
  }

  res.status(200).json({
    success: true,
    data: { patient }
  });
}));

export default router; 