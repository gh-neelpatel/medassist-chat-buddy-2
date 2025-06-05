# Healthcare Management System

A comprehensive healthcare management system with AI-powered patient history summarization, intelligent doctor suggestions, and hospital locator functionality.

## 🌟 Features

### Core Features
- **Patient Management**: Complete patient profiles with medical history, medications, and vital signs
- **AI-Powered Summaries**: Generate comprehensive health summaries using OpenAI GPT-4
- **Smart Doctor Suggestions**: AI analyzes patient conditions to recommend appropriate specialists
- **Hospital Locator**: Find nearby hospitals with real-time capacity and directions
- **Emergency Services**: Quick access to emergency hospitals based on urgency level
- **Medication Management**: Track medications with interaction checking
- **Appointment Scheduling**: Book and manage medical appointments

### AI Features
- Patient health history summarization
- Doctor recommendations based on patient conditions
- Symptom analysis and specialty suggestions
- Health trend insights from vital signs data
- Medical chat assistant
- Risk assessment and preventive care recommendations

### Hospital Services
- Geographic search with distance calculations
- Emergency hospital routing with urgency levels
- Specialist finder by medical specialty
- Real-time hospital capacity monitoring
- Insurance and service filtering
- Google Maps integration for directions

## 🏗️ Architecture

### Backend (Express.js + MongoDB)
- RESTful API with comprehensive endpoints
- MongoDB with Mongoose ODM
- AI integration with OpenAI GPT-4
- Google Maps API for location services
- JWT authentication
- Rate limiting and security middleware

### Frontend (React + TypeScript)
- Modern React with TypeScript
- Tailwind CSS for styling
- shadcn/ui component library
- React Query for data fetching
- Responsive design

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or Atlas)
- OpenAI API key
- Google Maps API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd healthcare-management-system
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../
   npm install
   ```

4. **Set up environment variables**
   
   ⚠️ **Important**: You need to create a `.env` file in the `backend/` directory with your own API keys and configuration.
   
   ```bash
   cd backend
   touch .env  # or create .env file manually
   ```
   
   Add the following content to your `.env` file with your actual values:
   ```env
   # Server Configuration
   NODE_ENV=development
   PORT=5000
   
   # Database - Use your MongoDB connection string
   MONGODB_URI=mongodb://localhost:27017/healthcare_db
   
   # JWT Secret - Generate a strong secret key
   JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_complex
   
   # OpenAI API - Required for AI-powered features
   # Get your API key from: https://platform.openai.com/api-keys
   OPENAI_API_KEY=your_openai_api_key_here
   
   # Google Maps API - Required for hospital locator
   # Get your API key from: https://developers.google.com/maps/documentation/javascript/get-api-key
   GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
   
   # Rate Limiting (Optional)
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   
   # Frontend URL for CORS
   FRONTEND_URL=http://localhost:5173
   ```
   
   **Required API Keys:**
   - **OpenAI API Key**: Sign up at [OpenAI Platform](https://platform.openai.com/) and create an API key
   - **Google Maps API Key**: Create a project in [Google Cloud Console](https://console.cloud.google.com/) and enable the Maps JavaScript API

5. **Set up the database with sample data**
   ```bash
   cd backend
   npm run setup
   ```

6. **Start the backend server**
   ```bash
   npm run dev
   ```

7. **Start the frontend development server**
   ```bash
   cd ../
   npm run dev
   ```

8. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000
   - Health check: http://localhost:5000/health

## 📚 API Documentation

### AI Endpoints
- `POST /api/ai/patient-summary/:patientId` - Generate patient health summary
- `POST /api/ai/suggest-doctors/:patientId` - Get AI doctor recommendations
- `POST /api/ai/analyze-symptoms` - Analyze symptoms and suggest specialties
- `GET /api/ai/health-insights/:patientId` - Generate health trend insights
- `POST /api/ai/medical-chat` - AI medical chat assistant
- `POST /api/ai/risk-assessment/:patientId` - Generate risk assessment
- `POST /api/ai/medication-interactions` - Check medication interactions

### Hospital Endpoints
- `POST /api/hospitals/nearby` - Find nearby hospitals
- `POST /api/hospitals/emergency` - Find emergency hospitals
- `POST /api/hospitals/specialists` - Find specialists in area
- `GET /api/hospitals/:id/capacity` - Get real-time hospital capacity
- `POST /api/hospitals/:id/directions` - Get directions to hospital
- `GET /api/hospitals/search/:query` - Search hospitals by name

### Patient Endpoints
- `GET /api/patients/:id` - Get patient details
- `PUT /api/patients/:id` - Update patient information

### Doctor Endpoints
- `GET /api/doctors` - Get doctors with filtering
- `GET /api/doctors/:id` - Get doctor details
- `GET /api/doctors/:id/availability` - Get doctor availability

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/register/patient` - Patient registration
- `GET /api/auth/me` - Get current user

## 🧪 Sample Data

The setup script creates sample data including:

### Hospitals
- Mount Sinai Hospital (General)
- NewYork-Presbyterian Hospital (Teaching)
- NYU Langone Health (Research)

### Doctors
- Dr. Sarah Johnson (Cardiology)
- Dr. Michael Chen (Pediatrics)
- Dr. Emily Rodriguez (Dermatology)

### Sample Patient
- **Name**: Neel Patel
- **Email**: neel.patel@example.com
- **Conditions**: Hypertension, Type 2 Diabetes
- **Location**: New York, NY

## 🔧 Configuration

### Environment Variables

#### Required
- `MONGODB_URI` - MongoDB connection string
- `OPENAI_API_KEY` - OpenAI API key for AI features
- `GOOGLE_MAPS_API_KEY` - Google Maps API key for location services

#### Optional
- `NODE_ENV` - Environment (development/production)
- `PORT` - Backend server port (default: 5000)
- `JWT_SECRET` - JWT signing secret
- `FRONTEND_URL` - Frontend URL for CORS

### Database Setup

The application uses MongoDB with the following collections:
- `patients` - Patient records and medical history
- `doctors` - Doctor profiles and schedules
- `hospitals` - Hospital information and services

### AI Configuration

The AI service requires an OpenAI API key and uses GPT-4 for:
- Medical history summarization
- Doctor recommendations
- Symptom analysis
- Health insights generation

## 🌐 Deployment

### Backend Deployment

1. **Build for production**
   ```bash
   cd backend
   npm install --production
   ```

2. **Set environment variables**
   - Configure production MongoDB URI
   - Set production API keys
   - Set NODE_ENV=production

3. **Start the server**
   ```bash
   npm start
   ```

### Frontend Deployment

1. **Build for production**
   ```bash
   npm run build
   ```

2. **Configure API URL**
   ```bash
   echo "VITE_API_URL=https://your-backend-url.com/api" > .env.production
   ```

3. **Deploy static files**
   - Upload `dist/` folder to your hosting service
   - Configure routing for SPA

### Recommended Hosting
- **Backend**: Railway, Heroku, DigitalOcean
- **Frontend**: Vercel, Netlify, Railway
- **Database**: MongoDB Atlas

## 🧪 Testing

### Manual Testing

1. **Backend Health Check**
   ```bash
   curl http://localhost:5000/health
   ```

2. **Test AI Features**
   ```bash
   # Get patient summary
   curl -X POST http://localhost:5000/api/ai/patient-summary/PATIENT_ID
   
   # Find nearby hospitals
   curl -X POST http://localhost:5000/api/hospitals/nearby \
     -H "Content-Type: application/json" \
     -d '{"location": {"coordinates": [-73.9857, 40.7484]}}'
   ```

3. **Test Doctor Suggestions**
   ```bash
   curl -X POST http://localhost:5000/api/ai/suggest-doctors/PATIENT_ID \
     -H "Content-Type: application/json" \
     -d '{"location": {"latitude": 40.7484, "longitude": -73.9857}}'
   ```

## 🔐 Security Features

- Rate limiting (100 requests per 15 minutes)
- CORS protection
- Helmet security headers
- Input validation with Joi
- MongoDB injection protection
- JWT authentication
- Environment variable protection

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
1. Check the API documentation
2. Review the sample data structure
3. Test with provided sample patient ID
4. Ensure all environment variables are configured

## 🔄 Version History

- **v1.0.0** - Initial release with core features
  - Patient management
  - AI-powered summaries
  - Hospital locator
  - Doctor suggestions
  - Real-time hospital capacity

## 🎯 Future Enhancements

- Real-time appointment booking
- Telemedicine integration
- Advanced medication management
- Clinical decision support
- Patient portal
- Mobile application
- Integration with EHR systems
