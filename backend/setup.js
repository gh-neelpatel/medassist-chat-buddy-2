import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import Patient from './models/Patient.js';
import Doctor from './models/Doctor.js';
import Hospital from './models/Hospital.js';

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/healthcare_db');
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const sampleHospitals = [
  {
    name: "Mount Sinai Hospital",
    shortName: "Mount Sinai",
    hospitalId: "MSH001",
    type: "general",
    phone: "(212) 241-6500",
    email: "info@mountsinai.org",
    website: "https://www.mountsinai.org",
    emergencyPhone: "(212) 241-7171",
    address: {
      street: "1 Gustave L. Levy Place",
      city: "New York",
      state: "NY",
      zipCode: "10029",
      country: "US"
    },
    location: {
      type: "Point",
      coordinates: [-73.9514, 40.7903] // [longitude, latitude]
    },
    description: "Leading academic medical center providing exceptional patient care",
    established: new Date("1852-01-01"),
    bedCount: {
      total: 1200,
      available: 300,
      icu: 100,
      emergency: 50,
      general: 1050
    },
    departments: [
      {
        name: "Cardiology",
        services: ["Heart Surgery", "Cardiac Catheterization", "Echocardiography"],
        isActive: true,
        emergencyServices: false,
        operatingHours: {
          weekdays: { open: "08:00", close: "18:00" },
          weekends: { open: "09:00", close: "17:00" },
          is24Hours: false
        }
      },
      {
        name: "Emergency Medicine",
        services: ["Trauma Care", "Emergency Surgery", "Critical Care"],
        isActive: true,
        emergencyServices: true,
        operatingHours: {
          weekdays: { open: "00:00", close: "23:59" },
          weekends: { open: "00:00", close: "23:59" },
          is24Hours: true
        }
      },
      {
        name: "Neurology",
        services: ["Stroke Care", "Brain Surgery", "Neurological Diagnostics"],
        isActive: true,
        emergencyServices: true
      }
    ],
    specialtyServices: ["Cardiology", "Neurology", "Oncology", "Pediatrics", "Emergency Medicine"],
    emergencyServices: [
      {
        service: "Trauma Center",
        isAvailable: true,
        averageWaitTime: 15,
        capacity: 50,
        currentLoad: 12
      },
      {
        service: "Cardiac Emergency",
        isAvailable: true,
        averageWaitTime: 10,
        capacity: 20,
        currentLoad: 5
      }
    ],
    qualityRatings: {
      overall: 4.5,
      cleanliness: 4.7,
      staffRating: 4.6,
      waitTime: 4.2
    },
    acceptedInsurance: [
      {
        provider: "Blue Cross Blue Shield",
        plans: ["PPO", "HMO", "EPO"],
        isInNetwork: true,
        copayAmount: 25,
        deductibleAmount: 500
      },
      {
        provider: "Aetna",
        plans: ["Choice", "Select", "Open Access"],
        isInNetwork: true,
        copayAmount: 30,
        deductibleAmount: 750
      }
    ],
    operatingHours: {
      emergency: { is24Hours: true },
      outpatient: {
        weekdays: { open: "07:00", close: "19:00" },
        weekends: { open: "08:00", close: "17:00" }
      },
      visiting: {
        weekdays: { start: "10:00", end: "20:00" },
        weekends: { start: "10:00", end: "18:00" }
      }
    },
    isActive: true,
    isVerified: true,
    isFeatured: true
  },
  {
    name: "NewYork-Presbyterian Hospital",
    shortName: "NYP",
    hospitalId: "NYP001",
    type: "teaching",
    phone: "(212) 746-5454",
    email: "info@nyp.org",
    website: "https://www.nyp.org",
    emergencyPhone: "(212) 746-0911",
    address: {
      street: "525 E 68th St",
      city: "New York",
      state: "NY",
      zipCode: "10065",
      country: "US"
    },
    location: {
      type: "Point",
      coordinates: [-73.9570, 40.7681]
    },
    description: "Premier academic medical center and teaching hospital",
    established: new Date("1771-01-01"),
    bedCount: {
      total: 2600,
      available: 520,
      icu: 200,
      emergency: 80,
      general: 2320
    },
    departments: [
      {
        name: "Pediatrics",
        services: ["Pediatric Surgery", "NICU", "Pediatric Cardiology"],
        isActive: true,
        emergencyServices: true
      },
      {
        name: "Oncology",
        services: ["Chemotherapy", "Radiation Therapy", "Surgical Oncology"],
        isActive: true,
        emergencyServices: false
      }
    ],
    specialtyServices: ["Pediatrics", "Oncology", "Cardiology", "Neurosurgery", "Transplant"],
    emergencyServices: [
      {
        service: "Level I Trauma Center",
        isAvailable: true,
        averageWaitTime: 12,
        capacity: 80,
        currentLoad: 25
      }
    ],
    qualityRatings: {
      overall: 4.8,
      cleanliness: 4.9,
      staffRating: 4.8,
      waitTime: 4.5
    },
    isActive: true,
    isVerified: true,
    isFeatured: true
  },
  {
    name: "NYU Langone Health",
    shortName: "NYU Langone",
    hospitalId: "NYU001",
    type: "research",
    phone: "(212) 263-7300",
    address: {
      street: "550 1st Ave",
      city: "New York",
      state: "NY",
      zipCode: "10016"
    },
    location: {
      type: "Point",
      coordinates: [-73.9743, 40.7407]
    },
    bedCount: {
      total: 1500,
      available: 280,
      icu: 120,
      emergency: 60,
      general: 1320
    },
    specialtyServices: ["Orthopedics", "Dermatology", "Psychiatry", "Radiology"],
    qualityRatings: {
      overall: 4.6,
      cleanliness: 4.8,
      staffRating: 4.7,
      waitTime: 4.3
    },
    isActive: true,
    isVerified: true
  }
];

const sampleDoctors = [
  {
    firstName: "Sarah",
    lastName: "Johnson",
    email: "sarah.johnson@mountsinai.org",
    phone: "(212) 241-1234",
    dateOfBirth: new Date("1980-05-15"),
    gender: "female",
    licenseNumber: "MD12345NY",
    npiNumber: "1234567890",
    specializations: ["Cardiology", "Internal Medicine"],
    yearsOfExperience: 15,
    education: [
      {
        degree: "MD",
        institution: "Harvard Medical School",
        graduationYear: 2008,
        specialization: "Cardiology"
      },
      {
        degree: "BS",
        institution: "Stanford University",
        graduationYear: 2004,
        specialization: "Biology"
      }
    ],
    certifications: [
      {
        name: "Board Certified in Cardiology",
        issuingBody: "American Board of Internal Medicine",
        issueDate: new Date("2012-01-01"),
        isActive: true
      }
    ],
    department: "Cardiology",
    title: "Attending Cardiologist",
    officeAddress: {
      street: "1 Gustave L. Levy Place",
      city: "New York",
      state: "NY",
      zipCode: "10029"
    },
    officePhone: "(212) 241-1234",
    languagesSpoken: ["English", "Spanish"],
    acceptingNewPatients: true,
    consultationFee: 350,
    schedule: [
      { dayOfWeek: 1, startTime: "09:00", endTime: "17:00", isAvailable: true },
      { dayOfWeek: 2, startTime: "09:00", endTime: "17:00", isAvailable: true },
      { dayOfWeek: 3, startTime: "09:00", endTime: "17:00", isAvailable: true },
      { dayOfWeek: 4, startTime: "09:00", endTime: "17:00", isAvailable: true },
      { dayOfWeek: 5, startTime: "09:00", endTime: "15:00", isAvailable: true }
    ],
    averageRating: 4.8,
    totalReviews: 124,
    acceptedInsurance: ["Blue Cross Blue Shield", "Aetna", "Cigna"],
    biography: "Dr. Johnson is a leading cardiologist with expertise in interventional cardiology and heart disease prevention.",
    isActive: true,
    isVerified: true
  },
  {
    firstName: "Michael",
    lastName: "Chen",
    email: "michael.chen@nyp.org",
    phone: "(212) 746-2345",
    gender: "male",
    licenseNumber: "MD23456NY",
    npiNumber: "2345678901",
    specializations: ["Pediatrics", "Neonatology"],
    yearsOfExperience: 12,
    education: [
      {
        degree: "MD",
        institution: "Johns Hopkins School of Medicine",
        graduationYear: 2011,
        specialization: "Pediatrics"
      }
    ],
    department: "Pediatrics",
    title: "Chief of Pediatrics",
    languagesSpoken: ["English", "Mandarin"],
    acceptingNewPatients: true,
    consultationFee: 275,
    averageRating: 4.9,
    totalReviews: 89,
    biography: "Dr. Chen specializes in pediatric care and neonatal intensive care medicine.",
    isActive: true,
    isVerified: true
  },
  {
    firstName: "Emily",
    lastName: "Rodriguez",
    email: "emily.rodriguez@nyu.edu",
    phone: "(212) 263-3456",
    gender: "female",
    licenseNumber: "MD34567NY",
    specializations: ["Dermatology"],
    yearsOfExperience: 8,
    department: "Dermatology",
    languagesSpoken: ["English", "Spanish"],
    acceptingNewPatients: true,
    consultationFee: 225,
    averageRating: 4.7,
    totalReviews: 67,
    isActive: true,
    isVerified: true
  }
];

const samplePatients = [
  {
    firstName: "Neel",
    lastName: "Patel",
    email: "neel.patel@example.com",
    phone: "(555) 123-4567",
    dateOfBirth: new Date("1995-03-22"),
    gender: "male",
    address: {
      street: "123 Main St",
      city: "New York",
      state: "NY",
      zipCode: "10001"
    },
    bloodType: "A+",
    medicalHistory: [
      {
        condition: "Hypertension",
        diagnosedDate: new Date("2022-01-15"),
        status: "active",
        severity: "mild",
        notes: "Well controlled with medication"
      },
      {
        condition: "Type 2 Diabetes",
        diagnosedDate: new Date("2021-08-10"),
        status: "active",
        severity: "moderate",
        notes: "Managed with metformin and diet"
      }
    ],
    currentMedications: [
      {
        name: "Lisinopril",
        dosage: "10mg",
        frequency: "Once daily",
        startDate: new Date("2022-01-15"),
        status: "active",
        notes: "For blood pressure control"
      },
      {
        name: "Metformin",
        dosage: "500mg",
        frequency: "Twice daily",
        startDate: new Date("2021-08-10"),
        status: "active",
        notes: "For diabetes management"
      }
    ],
    allergies: [
      {
        allergen: "Penicillin",
        reaction: "Skin rash",
        severity: "moderate",
        notes: "Developed rash when taking penicillin"
      }
    ],
    vitalSigns: [
      {
        bloodPressure: { systolic: 135, diastolic: 85 },
        heartRate: 72,
        temperature: 98.6,
        respiratoryRate: 16,
        oxygenSaturation: 98,
        weight: 175,
        height: 70,
        recordedDate: new Date("2024-01-15")
      },
      {
        bloodPressure: { systolic: 130, diastolic: 82 },
        heartRate: 68,
        temperature: 98.4,
        weight: 173,
        height: 70,
        recordedDate: new Date("2024-01-01")
      }
    ],
    insurance: {
      provider: "Blue Cross Blue Shield",
      policyNumber: "BC123456789",
      groupNumber: "GRP001",
      policyHolderName: "Neel Patel",
      relationship: "self"
    },
    emergencyContacts: [
      {
        name: "Priya Patel",
        relationship: "spouse",
        phone: "(555) 234-5678",
        email: "priya.patel@example.com",
        isPrimary: true
      }
    ],
    healthSummary: {
      riskFactors: ["Diabetes", "Hypertension", "Family history of heart disease"],
      recommendations: ["Regular exercise", "Low sodium diet", "Annual eye exams"],
      lastAnalyzed: new Date(),
      overallRiskScore: 35
    },
    isActive: true
  }
];

const seedDatabase = async () => {
  try {
    console.log('🗑️  Clearing existing data...');
    await Patient.deleteMany({});
    await Doctor.deleteMany({});
    await Hospital.deleteMany({});

    console.log('🏥 Creating hospitals...');
    const hospitals = await Hospital.insertMany(sampleHospitals);
    console.log(`✅ Created ${hospitals.length} hospitals`);

    // Assign hospitals to doctors
    const doctorsWithHospitals = sampleDoctors.map((doctor, index) => ({
      ...doctor,
      hospital: hospitals[index % hospitals.length]._id
    }));

    console.log('👨‍⚕️ Creating doctors...');
    const doctors = await Doctor.insertMany(doctorsWithHospitals);
    console.log(`✅ Created ${doctors.length} doctors`);

    // Assign primary doctor to patients
    const patientsWithDoctors = samplePatients.map(patient => ({
      ...patient,
      primaryDoctor: doctors[0]._id // Assign Dr. Johnson as primary doctor
    }));

    console.log('👤 Creating patients...');
    const patients = await Patient.insertMany(patientsWithDoctors);
    console.log(`✅ Created ${patients.length} patients`);

    // Update hospitals with doctor references
    for (let i = 0; i < hospitals.length; i++) {
      const hospitalDoctors = doctors.filter(doctor => 
        doctor.hospital.toString() === hospitals[i]._id.toString()
      );
      
      await Hospital.findByIdAndUpdate(hospitals[i]._id, {
        doctors: hospitalDoctors.map(doc => doc._id)
      });
    }

    console.log('🔗 Updated hospital-doctor relationships');
    console.log('🎉 Database seeded successfully!');
    
    console.log('\n📋 Sample Data Summary:');
    console.log(`- Hospitals: ${hospitals.length}`);
    console.log(`- Doctors: ${doctors.length}`);
    console.log(`- Patients: ${patients.length}`);
    
    console.log('\n🔑 Sample Login Credentials:');
    console.log('Patient: neel.patel@example.com');
    console.log('Doctor: sarah.johnson@mountsinai.org');
    
    console.log('\n📍 Sample Patient ID for API testing:');
    console.log(`Patient ID: ${patients[0]._id}`);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  }
};

const runSetup = async () => {
  await connectDB();
  await seedDatabase();
  process.exit(0);
};

runSetup(); 