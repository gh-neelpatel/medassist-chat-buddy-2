import mongoose from 'mongoose';

const medicalHistorySchema = new mongoose.Schema({
  condition: {
    type: String,
    required: true
  },
  diagnosedDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['active', 'resolved', 'chronic', 'managed'],
    default: 'active'
  },
  severity: {
    type: String,
    enum: ['mild', 'moderate', 'severe'],
    default: 'mild'
  },
  notes: String
}, { timestamps: true });

const medicationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  dosage: String,
  frequency: String,
  startDate: Date,
  endDate: Date,
  prescribedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor'
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'discontinued'],
    default: 'active'
  },
  notes: String
}, { timestamps: true });

const allergySchema = new mongoose.Schema({
  allergen: {
    type: String,
    required: true
  },
  reaction: String,
  severity: {
    type: String,
    enum: ['mild', 'moderate', 'severe', 'life-threatening'],
    default: 'mild'
  },
  notes: String
}, { timestamps: true });

const vitalSignsSchema = new mongoose.Schema({
  bloodPressure: {
    systolic: Number,
    diastolic: Number
  },
  heartRate: Number,
  temperature: Number,
  respiratoryRate: Number,
  oxygenSaturation: Number,
  weight: Number,
  height: Number,
  bmi: Number,
  recordedDate: {
    type: Date,
    default: Date.now
  },
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor'
  }
}, { timestamps: true });

const emergencyContactSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  relationship: String,
  phone: {
    type: String,
    required: true
  },
  email: String,
  isPrimary: {
    type: Boolean,
    default: false
  }
});

const patientSchema = new mongoose.Schema({
  // Personal Information
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: true
  },
  dateOfBirth: {
    type: Date,
    required: true
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer-not-to-say'],
    required: true
  },
  
  // Address
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: {
      type: String,
      default: 'US'
    }
  },
  
  // Medical Information
  bloodType: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown']
  },
  medicalHistory: [medicalHistorySchema],
  currentMedications: [medicationSchema],
  allergies: [allergySchema],
  vitalSigns: [vitalSignsSchema],
  
  // Insurance Information
  insurance: {
    provider: String,
    policyNumber: String,
    groupNumber: String,
    policyHolderName: String,
    relationship: String
  },
  
  // Emergency Contacts
  emergencyContacts: [emergencyContactSchema],
  
  // Primary Care Provider
  primaryDoctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor'
  },
  
  // AI-generated insights
  healthSummary: {
    riskFactors: [String],
    recommendations: [String],
    lastAnalyzed: Date,
    overallRiskScore: {
      type: Number,
      min: 0,
      max: 100
    }
  },
  
  // System fields
  isActive: {
    type: Boolean,
    default: true
  },
  lastLoginDate: Date,
  preferences: {
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      app: { type: Boolean, default: true }
    },
    privacy: {
      shareDataForResearch: { type: Boolean, default: false },
      allowMarketing: { type: Boolean, default: false }
    }
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual fields
patientSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

patientSchema.virtual('age').get(function() {
  if (!this.dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
});

// Calculate BMI virtual
patientSchema.virtual('currentBMI').get(function() {
  if (this.vitalSigns && this.vitalSigns.length > 0) {
    const latestVitals = this.vitalSigns[this.vitalSigns.length - 1];
    if (latestVitals.weight && latestVitals.height) {
      const heightInMeters = latestVitals.height / 100;
      return (latestVitals.weight / (heightInMeters * heightInMeters)).toFixed(1);
    }
  }
  return null;
});

// Indexes for better performance
patientSchema.index({ email: 1 });
patientSchema.index({ phone: 1 });
patientSchema.index({ 'address.zipCode': 1 });
patientSchema.index({ primaryDoctor: 1 });
patientSchema.index({ createdAt: -1 });

// Pre-save middleware
patientSchema.pre('save', function(next) {
  // Ensure only one primary emergency contact
  const primaryContacts = this.emergencyContacts.filter(contact => contact.isPrimary);
  if (primaryContacts.length > 1) {
    // Set all but the first to non-primary
    this.emergencyContacts.forEach((contact, index) => {
      if (contact.isPrimary && index > 0) {
        contact.isPrimary = false;
      }
    });
  }
  
  next();
});

// Instance methods
patientSchema.methods.getActiveConditions = function() {
  return this.medicalHistory.filter(condition => condition.status === 'active' || condition.status === 'chronic');
};

patientSchema.methods.getCurrentMedications = function() {
  return this.currentMedications.filter(medication => medication.status === 'active');
};

patientSchema.methods.getHighSeverityAllergies = function() {
  return this.allergies.filter(allergy => allergy.severity === 'severe' || allergy.severity === 'life-threatening');
};

const Patient = mongoose.model('Patient', patientSchema);

export default Patient; 