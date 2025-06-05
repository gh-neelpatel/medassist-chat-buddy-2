import express from 'express';
import AIService from '../services/aiService.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { validatePatientId } from '../middleware/validation.js';
import multer from 'multer';
import fs from 'fs';
import path from 'path';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    cb(null, `patient-history-${Date.now()}.txt`);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/plain') {
      cb(null, true);
    } else {
      cb(new Error('Only .txt files are allowed'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Helper function to get AIService instance
const getAIService = () => new AIService();

/**
 * @route   POST /api/ai/patient-summary/:patientId
 * @desc    Generate AI-powered patient history summary
 * @access  Private
 */
router.post('/patient-summary/:patientId', 
  validatePatientId,
  asyncHandler(async (req, res) => {
    const { patientId } = req.params;
    
    const aiService = getAIService();
    const summary = await aiService.generatePatientSummary(patientId);
    
    res.status(200).json({
      success: true,
      data: {
        patientId,
        summary: summary.summary,
        structuredData: summary.structuredData,
        generatedAt: summary.generatedAt
      }
    });
  })
);

/**
 * @route   POST /api/ai/suggest-doctors/:patientId
 * @desc    Get AI-powered doctor suggestions based on patient data
 * @access  Private
 */
router.post('/suggest-doctors/:patientId',
  validatePatientId,
  asyncHandler(async (req, res) => {
    const { patientId } = req.params;
    const options = req.body;
    
    const aiService = getAIService();
    const suggestions = await aiService.suggestDoctors(patientId, options);
    
    res.status(200).json({
      success: true,
      data: {
        patientId,
        recommendations: suggestions.recommendations,
        searchCriteria: suggestions.searchCriteria,
        totalFound: suggestions.totalFound,
        generatedAt: suggestions.generatedAt
      }
    });
  })
);

/**
 * @route   POST /api/ai/analyze-symptoms
 * @desc    Analyze symptoms and suggest appropriate specialties
 * @access  Private
 */
router.post('/analyze-symptoms',
  asyncHandler(async (req, res) => {
    const { symptoms, patientAge, patientGender } = req.body;
    
    if (!symptoms || !Array.isArray(symptoms) || symptoms.length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'Symptoms array is required' }
      });
    }
    
    if (!patientAge || !patientGender) {
      return res.status(400).json({
        success: false,
        error: { message: 'Patient age and gender are required' }
      });
    }
    
    const aiService = getAIService();
    const analysis = await aiService.analyzeSymptoms(symptoms, patientAge, patientGender);
    
    res.status(200).json({
      success: true,
      data: {
        analysis,
        symptoms,
        patientInfo: { age: patientAge, gender: patientGender },
        generatedAt: new Date()
      }
    });
  })
);

/**
 * @route   GET /api/ai/health-insights/:patientId
 * @desc    Generate health insights based on patient data trends
 * @access  Private
 */
router.get('/health-insights/:patientId',
  validatePatientId,
  asyncHandler(async (req, res) => {
    const { patientId } = req.params;
    
    const aiService = getAIService();
    const insights = await aiService.generateHealthInsights(patientId);
    
    res.status(200).json({
      success: true,
      data: {
        patientId,
        insights: insights.insights,
        trends: insights.trends,
        generatedAt: insights.generatedAt
      }
    });
  })
);

/**
 * @route   POST /api/ai/medical-chat
 * @desc    AI-powered medical chat for general health questions
 * @access  Private
 */
router.post('/medical-chat',
  asyncHandler(async (req, res) => {
    const { message, conversationHistory = [] } = req.body;
    
    if (!message) {
      return res.status(400).json({
        success: false,
        error: { message: 'Message is required' }
      });
    }

    try {
      const aiService = getAIService();
      const response = await aiService.chatWithMedicalAI(message, conversationHistory);

      res.status(200).json({
        success: true,
        data: {
          response,
          conversationId: Date.now().toString(),
          generatedAt: new Date()
        }
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        error: { message: 'Failed to process medical chat request' }
      });
    }
  })
);

/**
 * @route   POST /api/ai/risk-assessment/:patientId
 * @desc    Generate risk assessment for a patient
 * @access  Private
 */
router.post('/risk-assessment/:patientId',
  validatePatientId,
  asyncHandler(async (req, res) => {
    const { patientId } = req.params;
    const { riskFactors = [] } = req.body;
    
    // This would be enhanced with more sophisticated AI analysis
    try {
      const Patient = (await import('../models/Patient.js')).default;
      const patient = await Patient.findById(patientId).lean();
      
      if (!patient) {
        return res.status(404).json({
          success: false,
          error: { message: 'Patient not found' }
        });
      }

      // Simple risk assessment based on patient data
      let riskScore = 0;
      const assessedRisks = [];

      // Age factor
      if (patient.age > 65) {
        riskScore += 20;
        assessedRisks.push('Advanced age increases health risks');
      }

      // Medical history
      const chronicConditions = patient.medicalHistory?.filter(
        condition => condition.status === 'chronic'
      ) || [];
      
      riskScore += chronicConditions.length * 15;
      if (chronicConditions.length > 0) {
        assessedRisks.push(`Has ${chronicConditions.length} chronic condition(s)`);
      }

      // Medication count
      const activeMedications = patient.currentMedications?.filter(
        med => med.status === 'active'
      ) || [];
      
      if (activeMedications.length > 5) {
        riskScore += 10;
        assessedRisks.push('Multiple medications may increase interaction risks');
      }

      // High-severity allergies
      const severeAllergies = patient.allergies?.filter(
        allergy => allergy.severity === 'severe' || allergy.severity === 'life-threatening'
      ) || [];
      
      if (severeAllergies.length > 0) {
        riskScore += 15;
        assessedRisks.push('Has severe allergies requiring careful monitoring');
      }

      // Cap the risk score at 100
      riskScore = Math.min(riskScore, 100);

      const riskLevel = riskScore < 30 ? 'Low' : riskScore < 60 ? 'Moderate' : 'High';

      res.status(200).json({
        success: true,
        data: {
          patientId,
          riskScore,
          riskLevel,
          assessedRisks,
          recommendations: [
            'Regular health checkups are recommended',
            'Maintain updated medical history',
            'Keep emergency contacts current',
            'Follow prescribed medication regimens'
          ],
          generatedAt: new Date()
        }
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        error: { message: 'Failed to generate risk assessment' }
      });
    }
  })
);

/**
 * @route   POST /api/ai/medication-interactions
 * @desc    Check for potential medication interactions
 * @access  Private
 */
router.post('/medication-interactions',
  asyncHandler(async (req, res) => {
    const { medications, allergies = [] } = req.body;
    
    if (!medications || !Array.isArray(medications) || medications.length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'Medications array is required' }
      });
    }

    // This would integrate with a medication database API
    // For now, we'll provide a basic structure
    const interactions = [];
    const warnings = [];

    // Simple interaction checking (would be more sophisticated in production)
    const commonInteractions = {
      'warfarin': ['aspirin', 'ibuprofen'],
      'metformin': ['alcohol'],
      'atorvastatin': ['grapefruit'],
      'lisinopril': ['potassium supplements']
    };

    medications.forEach((med1, index) => {
      medications.slice(index + 1).forEach(med2 => {
        const med1Name = med1.name.toLowerCase();
        const med2Name = med2.name.toLowerCase();
        
        if (commonInteractions[med1Name]?.includes(med2Name) ||
            commonInteractions[med2Name]?.includes(med1Name)) {
          interactions.push({
            medication1: med1.name,
            medication2: med2.name,
            severity: 'moderate',
            description: 'Potential interaction detected - consult your doctor'
          });
        }
      });

      // Check against allergies
      allergies.forEach(allergy => {
        if (med1.name.toLowerCase().includes(allergy.allergen.toLowerCase())) {
          warnings.push({
            medication: med1.name,
            allergen: allergy.allergen,
            severity: allergy.severity,
            warning: 'ALLERGY ALERT: This medication may contain allergens'
          });
        }
      });
    });

    res.status(200).json({
      success: true,
      data: {
        interactions,
        warnings,
        totalMedications: medications.length,
        interactionCount: interactions.length,
        warningCount: warnings.length,
        recommendation: interactions.length > 0 || warnings.length > 0 
          ? 'Please consult with your healthcare provider about these potential interactions'
          : 'No major interactions detected, but always consult your healthcare provider',
        generatedAt: new Date()
      }
    });
  })
);

/**
 * @route   POST /api/ai/patient-history-summary
 * @desc    Generate AI-powered patient history summary from uploaded text file
 * @access  Private
 */
router.post('/patient-history-summary',
  upload.single('historyFile'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: { message: 'No history file uploaded' }
      });
    }

    try {
      // Read the uploaded file
      const fileContent = fs.readFileSync(req.file.path, 'utf-8');
      
      // Generate summary using AI
      const aiService = getAIService();
      const summary = await aiService.generateHistorySummaryFromText(fileContent);
      
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      
      res.status(200).json({
        success: true,
        data: {
          originalContent: fileContent.substring(0, 500) + '...', // First 500 chars for reference
          summary: summary.summary,
          keyFindings: summary.keyFindings,
          recommendations: summary.recommendations,
          riskFactors: summary.riskFactors,
          generatedAt: new Date()
        }
      });
      
    } catch (error) {
      // Clean up file if error occurs
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      
      res.status(500).json({
        success: false,
        error: { message: 'Failed to process patient history file' }
      });
    }
  })
);

export default router; 