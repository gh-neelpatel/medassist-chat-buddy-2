import mongoose from 'mongoose';

const educationSchema = new mongoose.Schema({
  degree: {
    type: String,
    required: true
  },
  institution: {
    type: String,
    required: true
  },
  graduationYear: {
    type: Number,
    required: true
  },
  specialization: String
}, { timestamps: true });

const certificationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  issuingBody: {
    type: String,
    required: true
  },
  issueDate: Date,
  expiryDate: Date,
  certificateNumber: String,
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

const scheduleSchema = new mongoose.Schema({
  dayOfWeek: {
    type: Number,
    required: true,
    min: 0,
    max: 6 // 0 = Sunday, 6 = Saturday
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  isAvailable: {
    type: Boolean,
    default: true
  }
});

const reviewSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: String,
  isVerified: {
    type: Boolean,
    default: false
  },
  isPublic: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

const doctorSchema = new mongoose.Schema({
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
  dateOfBirth: Date,
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer-not-to-say']
  },
  
  // Professional Information
  licenseNumber: {
    type: String,
    required: true,
    unique: true
  },
  npiNumber: {
    type: String,
    unique: true,
    sparse: true
  },
  specializations: [{
    type: String,
    required: true
  }],
  subSpecializations: [String],
  yearsOfExperience: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Education and Certifications
  education: [educationSchema],
  certifications: [certificationSchema],
  
  // Practice Information
  hospital: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital'
  },
  department: String,
  title: String, // e.g., "Chief of Cardiology", "Attending Physician"
  
  // Contact and Location
  officeAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: {
      type: String,
      default: 'US'
    }
  },
  officePhone: String,
  
  // Professional Details
  languagesSpoken: [String],
  acceptingNewPatients: {
    type: Boolean,
    default: true
  },
  consultationFee: {
    type: Number,
    min: 0
  },
  
  // Schedule and Availability
  schedule: [scheduleSchema],
  timeZone: {
    type: String,
    default: 'America/New_York'
  },
  
  // Ratings and Reviews
  reviews: [reviewSchema],
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  
  // Professional Networks
  affiliations: [String],
  publications: [{
    title: String,
    journal: String,
    publicationDate: Date,
    doi: String,
    url: String
  }],
  
  // Insurance and Billing
  acceptedInsurance: [String],
  
  // Digital Presence
  profilePicture: String,
  biography: String,
  website: String,
  socialMedia: {
    linkedin: String,
    twitter: String,
    facebook: String
  },
  
  // AI-generated insights
  patientSatisfactionScore: {
    type: Number,
    min: 0,
    max: 100
  },
  recommendationScore: {
    type: Number,
    min: 0,
    max: 100
  },
  expertiseAreas: [String],
  
  // System fields
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  lastLoginDate: Date,
  joinDate: {
    type: Date,
    default: Date.now
  },
  
  // Preferences
  preferences: {
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      app: { type: Boolean, default: true }
    },
    availabilityUpdates: { type: Boolean, default: true },
    marketingCommunications: { type: Boolean, default: false }
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual fields
doctorSchema.virtual('fullName').get(function() {
  return `Dr. ${this.firstName} ${this.lastName}`;
});

doctorSchema.virtual('age').get(function() {
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

doctorSchema.virtual('primarySpecialization').get(function() {
  return this.specializations && this.specializations.length > 0 ? this.specializations[0] : null;
});

// Indexes for better performance
doctorSchema.index({ email: 1 });
doctorSchema.index({ licenseNumber: 1 });
doctorSchema.index({ npiNumber: 1 });
doctorSchema.index({ specializations: 1 });
doctorSchema.index({ 'officeAddress.zipCode': 1 });
doctorSchema.index({ hospital: 1 });
doctorSchema.index({ averageRating: -1 });
doctorSchema.index({ acceptingNewPatients: 1 });
doctorSchema.index({ isActive: 1 });
doctorSchema.index({ isVerified: 1 });

// Compound indexes
doctorSchema.index({ specializations: 1, 'officeAddress.zipCode': 1 });
doctorSchema.index({ acceptingNewPatients: 1, isActive: 1, isVerified: 1 });

// Pre-save middleware to calculate average rating
doctorSchema.pre('save', function(next) {
  if (this.reviews && this.reviews.length > 0) {
    const publicReviews = this.reviews.filter(review => review.isPublic);
    this.totalReviews = publicReviews.length;
    
    if (this.totalReviews > 0) {
      const totalRating = publicReviews.reduce((sum, review) => sum + review.rating, 0);
      this.averageRating = Number((totalRating / this.totalReviews).toFixed(1));
    } else {
      this.averageRating = 0;
    }
  }
  
  next();
});

// Instance methods
doctorSchema.methods.getAvailableSlots = function(date) {
  const dayOfWeek = new Date(date).getDay();
  const scheduleForDay = this.schedule.find(s => s.dayOfWeek === dayOfWeek && s.isAvailable);
  
  if (!scheduleForDay) return [];
  
  // Generate time slots based on schedule
  // This is a basic implementation - you might want to integrate with a more sophisticated scheduling system
  const slots = [];
  const startTime = new Date(`1970-01-01T${scheduleForDay.startTime}`);
  const endTime = new Date(`1970-01-01T${scheduleForDay.endTime}`);
  
  const current = new Date(startTime);
  while (current < endTime) {
    slots.push(current.toTimeString().substring(0, 5));
    current.setMinutes(current.getMinutes() + 30); // 30-minute slots
  }
  
  return slots;
};

doctorSchema.methods.getActiveCertifications = function() {
  return this.certifications.filter(cert => cert.isActive && (!cert.expiryDate || cert.expiryDate > new Date()));
};

doctorSchema.methods.addReview = function(patientId, rating, comment) {
  this.reviews.push({
    patient: patientId,
    rating,
    comment,
    isVerified: true
  });
  
  return this.save();
};

doctorSchema.methods.getSpecializationMatch = function(conditions) {
  // Simple matching algorithm - can be enhanced with AI
  const specialtyKeywords = {
    'cardiology': ['heart', 'cardiac', 'cardiovascular', 'chest pain', 'hypertension'],
    'dermatology': ['skin', 'rash', 'acne', 'mole', 'dermatitis'],
    'endocrinology': ['diabetes', 'thyroid', 'hormone', 'metabolic'],
    'gastroenterology': ['stomach', 'digestive', 'gastric', 'intestinal', 'liver'],
    'neurology': ['brain', 'neurological', 'headache', 'seizure', 'stroke'],
    'orthopedics': ['bone', 'joint', 'muscle', 'fracture', 'arthritis'],
    'pediatrics': ['child', 'infant', 'pediatric'],
    'psychiatry': ['mental health', 'depression', 'anxiety', 'psychiatric'],
    'pulmonology': ['lung', 'respiratory', 'breathing', 'asthma', 'copd']
  };
  
  let matchScore = 0;
  
  this.specializations.forEach(specialty => {
    const keywords = specialtyKeywords[specialty.toLowerCase()] || [];
    conditions.forEach(condition => {
      keywords.forEach(keyword => {
        if (condition.toLowerCase().includes(keyword)) {
          matchScore += 1;
        }
      });
    });
  });
  
  return matchScore;
};

const Doctor = mongoose.model('Doctor', doctorSchema);

export default Doctor; 