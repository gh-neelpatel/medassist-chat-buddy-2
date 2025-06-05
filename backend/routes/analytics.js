import express from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = express.Router();

/**
 * @route   GET /api/analytics/dashboard
 * @desc    Get dashboard analytics (placeholder)
 * @access  Private
 */
router.get('/dashboard', asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      analytics: {
        totalPatients: 0,
        totalDoctors: 0,
        totalHospitals: 0,
        appointmentsToday: 0
      },
      message: 'Analytics feature coming soon'
    }
  });
}));

export default router; 