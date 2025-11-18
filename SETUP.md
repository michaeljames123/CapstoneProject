# AgridroneInsight Setup Guide

This guide will help you set up the complete AgridroneInsight application with all its components.

## Prerequisites

- **Python 3.8+** (with pip)
- **Node.js 16+** (with npm)
- **Git** (optional, for version control)

## Quick Start

### 1. Backend Setup (Python Flask)

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Create a virtual environment (recommended):**
   ```bash
   # Windows
   python -m venv venv
   venv\Scripts\activate

   # macOS/Linux
   python -m venv venv
   source venv/bin/activate
   ```

3. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the Flask server:**
   ```bash
   python app.py
   ```

   The backend server will start on `http://localhost:5000`

### 2. Frontend Setup (React TypeScript)

1. **Open a new terminal and navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install Node.js dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm start
   ```

   The frontend will open automatically at `http://localhost:3000`

## Detailed Setup Instructions

### Backend Environment Configuration

The backend uses environment variables for configuration. The `.env` file is already created with default values:

```env
FLASK_ENV=development
SECRET_KEY=your-secret-key-here-change-in-production
JWT_SECRET_KEY=jwt-secret-key-change-in-production
ROBOFLOW_API_KEY=RlnFmttALS6BQzCy3M6d
ROBOFLOW_MODEL_ID=agridroneinsightdetection-zcptl/1
DATABASE_URL=sqlite:///agridrone.db
```

**Important:** Change the secret keys before deploying to production!

### Database Setup

The SQLite database is automatically created when you first run the Flask application. No additional setup is required.

### Frontend Configuration

The frontend is configured to proxy API requests to the backend server. This is handled automatically by the `proxy` setting in `package.json`.

## API Integration

The application integrates with the Roboflow API for AI-powered crop analysis:

- **API Endpoint:** `https://serverless.roboflow.com`
- **Model ID:** `agridroneinsightdetection-zcptl/1`
- **API Key:** Already configured in the backend

## Features

### 🔐 Authentication System
- User registration and login
- JWT-based authentication
- Protected routes

### 🚁 Drone Analysis
- Upload drone imagery (PNG, JPG, JPEG, GIF)
- Flight information form (drone name, date/time, location, field size, flight time)
- AI-powered crop health analysis
- Real-time results with confidence scores

### 📊 Modern UI/UX
- Responsive design with TailwindCSS
- Professional color scheme (green theme for agriculture)
- Smooth animations and transitions
- Intuitive navigation

### 🗄️ Data Management
- SQLite database for user data and analysis history
- Secure file upload handling
- Analysis result storage

## File Structure

```
AgridroneInsight/
├── backend/
│   ├── app.py              # Main Flask application
│   ├── requirements.txt    # Python dependencies
│   ├── .env               # Environment variables
│   └── uploads/           # Uploaded images (created automatically)
├── frontend/
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── contexts/      # React contexts
│   │   ├── pages/         # Page components
│   │   ├── App.tsx        # Main App component
│   │   ├── index.tsx      # Entry point
│   │   └── index.css      # Global styles
│   ├── public/            # Static files
│   ├── package.json       # Node.js dependencies
│   └── tailwind.config.js # TailwindCSS configuration
└── README.md              # Project documentation
```

## Usage Instructions

### 1. User Registration
1. Visit `http://localhost:3000`
2. Click "Sign Up" in the navigation
3. Fill in username, email, and password
4. Click "Create Account"

### 2. Login
1. Click "Sign In" in the navigation
2. Enter your username and password
3. Click "Sign In"

### 3. Analyze Drone Images
1. Navigate to the "Analyze" page (requires login)
2. Fill in the drone flight information:
   - Drone Name
   - Date & Time
   - Exact Location (GPS coordinates or address)
   - Field Size (in acres)
   - Flight Time (in minutes)
3. Upload an image (PNG, JPG, JPEG, GIF up to 16MB)
4. Click "Analyze Image"
5. View the AI analysis results

## Troubleshooting

### Common Issues

1. **Backend not starting:**
   - Ensure Python 3.8+ is installed
   - Check if all dependencies are installed: `pip install -r requirements.txt`
   - Verify the virtual environment is activated

2. **Frontend not starting:**
   - Ensure Node.js 16+ is installed
   - Delete `node_modules` and run `npm install` again
   - Check for port conflicts (default: 3000)

3. **API errors:**
   - Verify the Roboflow API key is correct
   - Check internet connectivity
   - Ensure backend server is running

4. **Database issues:**
   - The SQLite database is created automatically
   - If corrupted, delete `agridrone.db` and restart the backend

### Performance Tips

- Use optimized images (< 5MB recommended)
- Ensure stable internet connection for API calls
- Keep the backend server running while using the frontend

## Development

### Adding New Features

1. **Backend:** Add new routes in `app.py`
2. **Frontend:** Create new components in `src/components/` or `src/pages/`
3. **Styling:** Use TailwindCSS classes or add custom styles in `index.css`

### Environment Setup

- **Development:** Both servers run with hot reloading
- **Production:** Build the frontend (`npm run build`) and serve static files through Flask

## Security Notes

- Change default secret keys in production
- Use HTTPS in production
- Implement proper file validation
- Consider rate limiting for API endpoints

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review the code documentation
3. Test with the provided sample images

---

**Happy farming with AI! 🌾🚁**
