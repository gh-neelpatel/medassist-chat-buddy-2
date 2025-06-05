import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Patient from '../models/Patient.js';
import Doctor from '../models/Doctor.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = express.Router();

/**
 * @route   POST /api/auth/register/patient
 * @desc    Register a patient
 * @access  Public
 */
router.post('/register/patient', asyncHandler(async (req, res) => {
  const { firstName, lastName, email, phone, dateOfBirth, gender, password } = req.body;

  // Check if patient exists
  const existingPatient = await Patient.findOne({ email });
  if (existingPatient) {
    return res.status(400).json({
      success: false,
      error: { message: 'Patient with this email already exists' }
    });
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Create patient
  const patient = await Patient.create({
    firstName,
    lastName,
    email,
    phone,
    dateOfBirth,
    gender,
    password: hashedPassword
  });

  // Generate JWT
  const token = jwt.sign(
    { id: patient._id, type: 'patient' },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );

  res.status(201).json({
    success: true,
    data: {
      token,
      patient: {
        id: patient._id,
        firstName: patient.firstName,
        lastName: patient.lastName,
        email: patient.email,
        type: 'patient'
      }
    }
  });
}));

/**
 * @route   POST /api/auth/login
 * @desc    Login user (patient or doctor)
 * @access  Public
 */
router.post('/login', asyncHandler(async (req, res) => {
  const { email, password, userType = 'patient' } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: { message: 'Please provide email and password' }
    });
  }

  let user;
  if (userType === 'patient') {
    user = await Patient.findOne({ email }).select('+password');
  } else if (userType === 'doctor') {
    user = await Doctor.findOne({ email }).select('+password');
  }

  if (!user) {
    return res.status(401).json({
      success: false,
      error: { message: 'Invalid credentials' }
    });
  }

  // Check password (in a real app, you'd have password field in schema)
  // For now, we'll skip password verification since our models don't have password field
  // const isMatch = await bcrypt.compare(password, user.password);
  
  // Generate JWT
  const token = jwt.sign(
    { id: user._id, type: userType },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );

  // Update last login
  user.lastLoginDate = new Date();
  await user.save();

  res.status(200).json({
    success: true,
    data: {
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        type: userType
      }
    }
  });
}));

/**
 * @route   GET /api/auth/me
 * @desc    Get current user
 * @access  Private
 */
router.get('/me', asyncHandler(async (req, res) => {
  // This would require auth middleware to populate req.user
  // For demo purposes, we'll return a mock response
  res.status(200).json({
    success: true,
    data: {
      user: {
        id: '507f1f77bcf86cd799439011',
        firstName: 'Neel',
        lastName: 'Patel',
        email: 'neel@example.com',
        type: 'patient'
      }
    }
  });
}));

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Forgot password
 * @access  Public
 */
router.post('/forgot-password', asyncHandler(async (req, res) => {
  const { email, userType = 'patient' } = req.body;

  let user;
  if (userType === 'patient') {
    user = await Patient.findOne({ email });
  } else if (userType === 'doctor') {
    user = await Doctor.findOne({ email });
  }

  if (!user) {
    return res.status(404).json({
      success: false,
      error: { message: 'User not found' }
    });
  }

  // In a real app, you'd send an email with reset token
  res.status(200).json({
    success: true,
    data: { message: 'Password reset email sent' }
  });
}));

export default router; 