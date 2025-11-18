# AgridroneInsight

A modern agricultural drone analysis platform built with React TypeScript and Python Flask.

## Features

- 🚁 Drone flight data management
- 🖼️ AI-powered crop analysis using Roboflow API
- 🔐 Secure authentication system
- 📊 Real-time analysis results
- 🎨 Modern, responsive UI/UX

## Tech Stack

### Frontend
- React 18 with TypeScript
- TailwindCSS for styling
- React Router for navigation
- Axios for API calls

### Backend
- Python Flask
- SQLite database
- JWT authentication
- Roboflow API integration

## Project Structure

```
AgridroneInsight/
├── frontend/          # React TypeScript application
├── backend/           # Python Flask API
├── database/          # SQLite database files
└── docs/              # Documentation
```

## Setup Instructions

### Backend Setup
1. Navigate to backend directory
2. Install dependencies: `pip install -r requirements.txt`
3. Run the server: `python app.py`

### Frontend Setup
1. Navigate to frontend directory
2. Install dependencies: `npm install`
3. Start development server: `npm start`

## API Integration

The application uses Roboflow API for crop health analysis:
- Model: agridroneinsightdetection-zcptl/1
- Endpoint: https://serverless.roboflow.com

## License

MIT License
