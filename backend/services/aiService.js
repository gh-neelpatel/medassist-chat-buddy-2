import OpenAI from 'openai';
import Patient from '../models/Patient.js';
import Doctor from '../models/Doctor.js';
import Hospital from '../models/Hospital.js';

class AIService {
  constructor() {
    // Check if we have a real OpenAI API key
    const apiKey = process.env.OPENAI_API_KEY;
    this.hasRealApiKey = apiKey && apiKey.startsWith('sk-') && !apiKey.includes('placeholder');
    
    if (this.hasRealApiKey) {
      this.openai = new OpenAI({
        apiKey: apiKey,
      });
    } else {
      console.log('⚠️  Using placeholder OpenAI API key - AI features will use demo responses');
      this.openai = null;
    }
  }

  /**
   * Generate comprehensive patient history summary using AI
   */
  async generatePatientSummary(patientId) {
    try {
      const patient = await Patient.findById(patientId)
        .populate('primaryDoctor', 'firstName lastName specializations')
        .lean();

      if (!patient) {
        throw new Error('Patient not found');
      }

      // Prepare medical data for AI analysis
      const medicalData = this.prepareMedicalDataForAI(patient);
      
      const prompt = `
        As a medical AI assistant, analyze the following patient data and provide a comprehensive health summary.
        
        Patient Information:
        ${JSON.stringify(medicalData, null, 2)}
        
        Please provide:
        1. Current Health Status Overview
        2. Key Risk Factors
        3. Medication Summary and Interactions
        4. Recommended Preventive Care
        5. Lifestyle Recommendations
        6. Priority Health Concerns
        7. Follow-up Care Suggestions
        
        Format the response in a clear, structured manner that a patient can understand while maintaining medical accuracy.
      `;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a medical AI assistant that provides comprehensive patient health summaries. Always prioritize patient safety and recommend consulting healthcare providers for medical decisions."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.3
      });

      const summary = completion.choices[0].message.content;
      
      // Extract risk factors and recommendations for structured storage
      const structuredData = await this.extractStructuredInsights(summary, patient);
      
      // Update patient record with AI insights
      await Patient.findByIdAndUpdate(patientId, {
        'healthSummary.lastAnalyzed': new Date(),
        'healthSummary.riskFactors': structuredData.riskFactors,
        'healthSummary.recommendations': structuredData.recommendations,
        'healthSummary.overallRiskScore': structuredData.riskScore
      });

      return {
        summary,
        structuredData,
        generatedAt: new Date()
      };

    } catch (error) {
      console.error('Error generating patient summary:', error);
      throw new Error('Failed to generate patient summary');
    }
  }

  /**
   * Suggest doctors based on patient's medical conditions and location
   */
  async suggestDoctors(patientId, options = {}) {
    try {
      const patient = await Patient.findById(patientId).lean();
      
      if (!patient) {
        throw new Error('Patient not found');
      }

      const {
        specialty = null,
        location = null,
        radius = 25, // km
        maxResults = 10,
        preferredLanguage = null,
        insuranceProvider = null
      } = options;

      // Get patient's active conditions
      const activeConditions = patient.medicalHistory
        .filter(condition => condition.status === 'active' || condition.status === 'chronic')
        .map(condition => condition.condition);

      // Build doctor search criteria
      let searchCriteria = {
        isActive: true,
        isVerified: true,
        acceptingNewPatients: true
      };

      // Add specialty filter if specified
      if (specialty) {
        searchCriteria.specializations = { $in: [specialty] };
      }

      // Add language preference
      if (preferredLanguage) {
        searchCriteria.languagesSpoken = { $in: [preferredLanguage] };
      }

      // Add insurance filter
      if (insuranceProvider) {
        searchCriteria.acceptedInsurance = { $in: [insuranceProvider] };
      }

      // Add location-based search if coordinates provided
      if (location && location.coordinates) {
        searchCriteria['officeAddress.location'] = {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: location.coordinates
            },
            $maxDistance: radius * 1000 // Convert km to meters
          }
        };
      } else if (patient.address && patient.address.zipCode) {
        // Use patient's zip code for location-based search
        searchCriteria['officeAddress.zipCode'] = patient.address.zipCode;
      }

      // Find doctors matching criteria
      let doctors = await Doctor.find(searchCriteria)
        .populate('hospital', 'name address phone')
        .limit(maxResults * 2) // Get more to allow for AI ranking
        .lean();

      // Use AI to rank doctors based on patient conditions
      const rankedDoctors = await this.rankDoctorsByPatientConditions(doctors, activeConditions, patient);

      // Generate personalized recommendations for each doctor
      const recommendations = await Promise.all(
        rankedDoctors.slice(0, maxResults).map(async (doctor) => {
          const recommendation = await this.generateDoctorRecommendation(doctor, patient, activeConditions);
          return {
            doctor,
            recommendation,
            matchScore: doctor.matchScore,
            reasons: doctor.matchReasons
          };
        })
      );

      return {
        recommendations,
        searchCriteria,
        totalFound: doctors.length,
        generatedAt: new Date()
      };

    } catch (error) {
      console.error('Error suggesting doctors:', error);
      throw new Error('Failed to suggest doctors');
    }
  }

  /**
   * Analyze patient symptoms and suggest appropriate medical specialties
   */
  async analyzeSymptoms(symptoms, patientAge, patientGender) {
    try {
      const prompt = `
        As a medical AI, analyze these symptoms and suggest appropriate medical specialties for consultation:
        
        Patient: ${patientAge} year old ${patientGender}
        Symptoms: ${symptoms.join(', ')}
        
        Please provide:
        1. Most likely specialties to consult (in order of priority)
        2. Urgency level (routine, urgent, emergency)
        3. General recommendations
        4. Red flag symptoms to watch for
        
        Respond in JSON format with clear medical reasoning.
      `;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a medical AI that helps triage symptoms to appropriate specialists. Always err on the side of caution and recommend professional medical evaluation."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.2
      });

      return JSON.parse(completion.choices[0].message.content);

    } catch (error) {
      console.error('Error analyzing symptoms:', error);
      throw new Error('Failed to analyze symptoms');
    }
  }

  /**
   * Prepare medical data for AI analysis
   */
  prepareMedicalDataForAI(patient) {
    return {
      demographics: {
        age: patient.age,
        gender: patient.gender,
        bloodType: patient.bloodType
      },
      conditions: patient.medicalHistory.map(condition => ({
        condition: condition.condition,
        status: condition.status,
        severity: condition.severity,
        diagnosedDate: condition.diagnosedDate
      })),
      medications: patient.currentMedications
        .filter(med => med.status === 'active')
        .map(med => ({
          name: med.name,
          dosage: med.dosage,
          frequency: med.frequency
        })),
      allergies: patient.allergies.map(allergy => ({
        allergen: allergy.allergen,
        severity: allergy.severity,
        reaction: allergy.reaction
      })),
      vitals: patient.vitalSigns.length > 0 ? patient.vitalSigns[patient.vitalSigns.length - 1] : null,
      familyHistory: patient.familyHistory || []
    };
  }

  /**
   * Extract structured insights from AI summary
   */
  async extractStructuredInsights(summary, patient) {
    try {
      const prompt = `
        Extract structured data from this medical summary:
        
        ${summary}
        
        Return JSON with:
        - riskFactors: array of key risk factors
        - recommendations: array of actionable recommendations
        - riskScore: overall risk score (0-100)
      `;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 500,
        temperature: 0.1
      });

      return JSON.parse(completion.choices[0].message.content);

    } catch (error) {
      console.error('Error extracting structured insights:', error);
      return {
        riskFactors: [],
        recommendations: [],
        riskScore: 0
      };
    }
  }

  /**
   * Rank doctors based on patient conditions using AI
   */
  async rankDoctorsByPatientConditions(doctors, conditions, patient) {
    // Simple ranking algorithm - can be enhanced with more sophisticated AI
    const rankedDoctors = doctors.map(doctor => {
      let matchScore = 0;
      let matchReasons = [];

      // Check specialty match
      const specialtyMatch = doctor.getSpecializationMatch(conditions);
      matchScore += specialtyMatch * 20;
      
      if (specialtyMatch > 0) {
        matchReasons.push(`Specializes in conditions related to: ${conditions.join(', ')}`);
      }

      // Add rating bonus
      matchScore += doctor.averageRating * 5;
      
      if (doctor.averageRating > 4) {
        matchReasons.push(`Highly rated (${doctor.averageRating}/5)`);
      }

      // Add experience bonus
      if (doctor.yearsOfExperience > 10) {
        matchScore += 10;
        matchReasons.push(`Experienced (${doctor.yearsOfExperience} years)`);
      }

      // Add hospital affiliation bonus
      if (doctor.hospital) {
        matchScore += 5;
        matchReasons.push('Affiliated with reputable hospital');
      }

      return {
        ...doctor,
        matchScore,
        matchReasons
      };
    });

    // Sort by match score
    return rankedDoctors.sort((a, b) => b.matchScore - a.matchScore);
  }

  /**
   * Generate personalized doctor recommendation
   */
  async generateDoctorRecommendation(doctor, patient, conditions) {
    try {
      const prompt = `
        Generate a brief, personalized recommendation for why this doctor would be good for this patient:
        
        Doctor: Dr. ${doctor.firstName} ${doctor.lastName}
        Specializations: ${doctor.specializations.join(', ')}
        Experience: ${doctor.yearsOfExperience} years
        Rating: ${doctor.averageRating}/5
        
        Patient Conditions: ${conditions.join(', ')}
        Patient Age: ${patient.age}
        
        Write a 2-3 sentence recommendation explaining why this doctor is a good match.
      `;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 150,
        temperature: 0.7
      });

      return completion.choices[0].message.content;

    } catch (error) {
      console.error('Error generating doctor recommendation:', error);
      return `Dr. ${doctor.firstName} ${doctor.lastName} is a qualified ${doctor.specializations[0]} with ${doctor.yearsOfExperience} years of experience.`;
    }
  }

  /**
   * Generate health insights based on trends in patient data
   */
  async generateHealthInsights(patientId) {
    try {
      const patient = await Patient.findById(patientId).lean();
      
      if (!patient || !patient.vitalSigns || patient.vitalSigns.length < 2) {
        throw new Error('Insufficient data for trend analysis');
      }

      // Analyze vital signs trends
      const vitalsAnalysis = this.analyzeVitalsTrends(patient.vitalSigns);
      
      const prompt = `
        Analyze these health trends and provide insights:
        
        Patient: ${patient.age} year old ${patient.gender}
        Current Conditions: ${patient.medicalHistory.map(c => c.condition).join(', ')}
        
        Vital Signs Trends:
        ${JSON.stringify(vitalsAnalysis, null, 2)}
        
        Provide actionable health insights and recommendations based on these trends.
      `;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a medical AI that analyzes health trends and provides actionable insights for patients."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 800,
        temperature: 0.3
      });

      return {
        insights: completion.choices[0].message.content,
        trends: vitalsAnalysis,
        generatedAt: new Date()
      };

    } catch (error) {
      console.error('Error generating health insights:', error);
      throw new Error('Failed to generate health insights');
    }
  }

  /**
   * Analyze trends in vital signs
   */
  analyzeVitalsTrends(vitalSigns) {
    const trends = {};
    const metrics = ['bloodPressure', 'heartRate', 'weight', 'bmi'];
    
    metrics.forEach(metric => {
      const values = vitalSigns
        .filter(vital => vital[metric] !== null && vital[metric] !== undefined)
        .map(vital => ({
          value: metric === 'bloodPressure' ? vital[metric].systolic : vital[metric],
          date: vital.recordedDate
        }))
        .sort((a, b) => new Date(a.date) - new Date(b.date));

      if (values.length >= 2) {
        const recent = values[values.length - 1].value;
        const previous = values[values.length - 2].value;
        const change = recent - previous;
        const percentChange = (change / previous) * 100;

        trends[metric] = {
          current: recent,
          previous: previous,
          change: change,
          percentChange: percentChange.toFixed(1),
          trend: change > 0 ? 'increasing' : change < 0 ? 'decreasing' : 'stable'
        };
      }
    });

    return trends;
  }

  /**
   * Generate health summary from uploaded text file
   */
  async generateHistorySummaryFromText(textContent) {
    try {
      // If no real API key, provide a demo response
      if (!this.hasRealApiKey) {
        return this.generateDemoSummary(textContent);
      }

      const prompt = `
        As a medical AI assistant, analyze the following patient history text and provide a comprehensive summary:
        
        Patient History Text:
        ${textContent}
        
        Please provide:
        1. Executive Summary of the patient's medical history
        2. Key Medical Findings and Diagnoses
        3. Current Health Status Assessment
        4. Risk Factors Identified
        5. Recommended Follow-up Actions
        6. Preventive Care Recommendations
        
        Format the response in a clear, structured manner suitable for healthcare providers.
      `;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a medical AI assistant that analyzes patient histories and provides comprehensive summaries. Always prioritize patient safety and recommend professional medical evaluation when appropriate."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 2500,
        temperature: 0.3
      });

      const summary = completion.choices[0].message.content;
      
      // Extract structured data from the summary
      const structuredData = await this.extractStructuredDataFromSummary(summary);
      
      return {
        summary,
        keyFindings: structuredData.keyFindings,
        recommendations: structuredData.recommendations,
        riskFactors: structuredData.riskFactors,
        generatedAt: new Date()
      };

    } catch (error) {
      console.error('Error generating history summary from text:', error);
      throw new Error('Failed to generate history summary from text');
    }
  }

  /**
   * Generate demo summary for demonstration purposes
   */
  generateDemoSummary(textContent) {
    // Extract patient info from text content for more realistic demo
    const hasAsthma = textContent.toLowerCase().includes('asthma');
    const hasDiabetes = textContent.toLowerCase().includes('diabetes');
    const hasHypertension = textContent.toLowerCase().includes('hypertension') || textContent.toLowerCase().includes('blood pressure');
    const hasKawasaki = textContent.toLowerCase().includes('kawasaki');
    const hasOsteoporosis = textContent.toLowerCase().includes('osteoporosis');

    let summary = `**AI-Generated Patient Summary (Demo Mode)**

**Executive Summary:**
This patient presents with a complex medical history requiring ongoing multidisciplinary care and monitoring. The uploaded medical history indicates multiple active conditions that require coordinated management.

**Key Medical Findings:**`;

    const keyFindings = [];
    const riskFactors = [];
    const recommendations = [];

    if (hasAsthma) {
      summary += `
- Chronic asthma with a history of respiratory symptoms
- Current management with bronchodilators and inhaled corticosteroids`;
      keyFindings.push('Chronic asthma requiring ongoing management');
      riskFactors.push('Respiratory complications from poorly controlled asthma');
      recommendations.push('Continue asthma action plan and avoid known triggers');
    }

    if (hasDiabetes) {
      summary += `
- Type 2 diabetes mellitus requiring metabolic monitoring
- Medication management with ongoing glucose control assessment`;
      keyFindings.push('Type 2 diabetes mellitus');
      riskFactors.push('Cardiovascular complications from diabetes');
      recommendations.push('Regular HbA1c monitoring and diabetic foot care');
    }

    if (hasHypertension) {
      summary += `
- Hypertension requiring antihypertensive therapy
- Blood pressure monitoring and cardiovascular risk assessment`;
      keyFindings.push('Hypertension');
      riskFactors.push('Cardiovascular disease risk');
      recommendations.push('Regular blood pressure monitoring and lifestyle modifications');
    }

    if (hasKawasaki) {
      summary += `
- History of Kawasaki disease with cardiac monitoring requirements
- Ongoing cardiology follow-up for coronary artery assessment`;
      keyFindings.push('History of Kawasaki disease');
      riskFactors.push('Potential cardiac complications');
      recommendations.push('Regular echocardiograms and cardiology follow-up');
    }

    if (hasOsteoporosis) {
      summary += `
- Osteoporosis with fracture risk requiring bone health management
- Current treatment with calcium, vitamin D, and bisphosphonates`;
      keyFindings.push('Osteoporosis');
      riskFactors.push('Increased fracture risk');
      recommendations.push('Fall prevention strategies and bone density monitoring');
    }

    summary += `

**Current Health Status:**
The patient requires ongoing monitoring and coordinated care for multiple chronic conditions. Current medications appear to be managing symptoms effectively, but regular follow-up is essential.

**Risk Assessment:**
Moderate to high risk profile due to multiple comorbidities requiring proactive management and preventive care strategies.

**Recommended Follow-up Actions:**
- Regular primary care visits for chronic disease management
- Specialist consultations as indicated
- Medication adherence monitoring
- Laboratory monitoring as appropriate for current medications

**Preventive Care Recommendations:**
- Age-appropriate screening examinations
- Vaccination updates
- Lifestyle counseling for diet, exercise, and risk factor modification
- Regular monitoring of chronic conditions

*Note: This summary is generated in demo mode. For actual clinical use, please ensure proper API configuration and professional medical review.*`;

    return {
      summary,
      keyFindings: keyFindings.length > 0 ? keyFindings : ['Multiple chronic conditions requiring ongoing care'],
      recommendations: recommendations.length > 0 ? recommendations : [
        'Regular medical follow-up',
        'Medication adherence',
        'Lifestyle modifications',
        'Preventive care measures'
      ],
      riskFactors: riskFactors.length > 0 ? riskFactors : ['Multiple chronic conditions'],
      generatedAt: new Date()
    };
  }

  /**
   * Medical chat AI functionality
   */
  async chatWithMedicalAI(message, conversationHistory = []) {
    try {
      // If no real API key, provide fallback response
      if (!this.hasRealApiKey) {
        return {
          message: "Hello! I'm MedAssist, your personal healthcare assistant. How can I help you today?",
          suggestions: this.generateMedicalSuggestions(message),
          timestamp: new Date()
        };
      }

      // Prepare conversation context
      const messages = [
        {
          role: "system",
          content: `You are MedAssist, a helpful medical AI assistant. You provide general health information and guidance, but you always emphasize that you are not a replacement for professional medical advice. 

Key guidelines:
- Provide helpful, accurate medical information
- Always recommend consulting healthcare providers for specific medical concerns
- Be empathetic and supportive
- If symptoms suggest urgency, recommend immediate medical attention
- Keep responses concise but informative
- Do not provide specific diagnoses or treatment plans`
        }
      ];

      // Add conversation history
      conversationHistory.forEach(item => {
        messages.push({ role: 'user', content: item.user });
        messages.push({ role: 'assistant', content: item.assistant });
      });

      // Add current message
      messages.push({ role: 'user', content: message });

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: messages,
        max_tokens: 800,
        temperature: 0.7
      });

      return {
        message: completion.choices[0].message.content,
        suggestions: this.generateMedicalSuggestions(message),
        timestamp: new Date()
      };

    } catch (error) {
      console.error('Error in medical chat:', error);
      return {
        message: "I understand you need assistance. Could you provide more details about what you're looking for? I can help with health records, finding doctors, medication reminders, or scheduling appointments.",
        suggestions: [
          "What's in my health record?",
          "Find a doctor near me",
          "Remind me about my medications",
          "I need an appointment"
        ],
        timestamp: new Date()
      };
    }
  }

  /**
   * Generate contextual medical suggestions
   */
  generateMedicalSuggestions(message) {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('pain') || lowerMessage.includes('hurt')) {
      return [
        "Consider scheduling an appointment with your primary care physician",
        "If pain is severe or sudden, seek immediate medical attention",
        "Track your pain levels and what triggers them"
      ];
    } else if (lowerMessage.includes('medication') || lowerMessage.includes('prescription')) {
      return [
        "Check your current medications in your health record",
        "Consult your pharmacist about medication interactions",
        "Never stop prescribed medications without consulting your doctor"
      ];
    } else if (lowerMessage.includes('doctor') || lowerMessage.includes('appointment')) {
      return [
        "Find a doctor near me",
        "Check available appointment slots",
        "Prepare questions for your doctor visit"
      ];
    } else {
      return [
        "What's in my health record?",
        "Find a doctor near me",
        "Remind me about my medications",
        "I need an appointment"
      ];
    }
  }

  /**
   * Extract structured data from summary text
   */
  async extractStructuredDataFromSummary(summary) {
    try {
      const prompt = `
        Extract structured data from this medical summary:
        
        ${summary}
        
        Return JSON with:
        - keyFindings: array of key medical findings and diagnoses
        - recommendations: array of actionable recommendations
        - riskFactors: array of identified risk factors
      `;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 500,
        temperature: 0.1
      });

      return JSON.parse(completion.choices[0].message.content);

    } catch (error) {
      console.error('Error extracting structured data from summary:', error);
      return {
        keyFindings: [],
        recommendations: [],
        riskFactors: []
      };
    }
  }
}

// Export the class instead of an instance to avoid early instantiation
export default AIService; 