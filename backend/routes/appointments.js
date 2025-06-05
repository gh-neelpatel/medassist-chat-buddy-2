import express from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = express.Router();

/**
 * @route   GET /api/appointments
 * @desc    Get appointments (placeholder for future implementation)
 * @access  Private
 */
router.get('/', asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      appointments: [],
      message: 'Appointments feature coming soon'
    }
  });
}));

/**
 * @route   POST /api/appointments
 * @desc    Create new appointment (placeholder)
 * @access  Private
 */
router.post('/', asyncHandler(async (req, res) => {
  res.status(201).json({
    success: true,
    data: {
      message: 'Appointment booking feature coming soon'
    }
  });
}));

export default router; 