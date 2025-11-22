import React, { useState, useRef } from 'react';
import api from '../api/config';

interface AnalysisResult {
  record_id: number;
  analysis_result: any;
  original_image_url: string;
  annotated_image_url: string | null;
  metadata: {
    drone_name: string;
    date_time: string;
    location: string;
    field_size: number;
    flight_time: number;
  };
}

const Analyze: React.FC = () => {
  const [formData, setFormData] = useState({
    drone_name: '',
    date_time: '',
    location: '',
    field_size: '',
    flight_time: '',
    latitude: '',
    longitude: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [harvestReadiness, setHarvestReadiness] = useState<{ percent: number; basis: string; recommendations: string[] }>({ percent: 0, basis: '', recommendations: [] });
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleChangeImageClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setFormData(prev => ({
          ...prev,
          latitude: latitude.toFixed(6),
          longitude: longitude.toFixed(6)
        }));
      },
      () => setError('Unable to retrieve your location'),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const computeHarvestInsights = (result: AnalysisResult) => {
    try {
      const preds = result.analysis_result?.predictions || [];
      if (!Array.isArray(preds) || preds.length === 0) {
        return {
          percent: 0,
          basis: 'No crop regions detected in this image. Unable to estimate harvest readiness.',
          recommendations: ['Capture a higher-resolution image that clearly contains the crop field and re-run the analysis.'],
        };
      }

      const polygonArea = (points: any[]): number => {
        if (!Array.isArray(points) || points.length < 3) return 0;
        let area = 0;
        for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
          const p1 = points[j];
          const p2 = points[i];
          area += (p1.x + p2.x) * (p1.y - p2.y);
        }
        return Math.abs(area) / 2;
      };

      let healthyArea = 0;
      let diseaseArea = 0;
      let pestArea = 0;
      let weedArea = 0;
      let healthyCount = 0;
      let diseaseCount = 0;
      let pestCount = 0;
      let weedCount = 0;

      let totalArea = 0;
      let totalConf = 0;

      preds.forEach((p: any) => {
        const cls = String(p.class || '').toLowerCase();
        let area = 0;
        if (Array.isArray(p.points) && p.points.length >= 3) {
          area = polygonArea(p.points);
        } else if (p.width && p.height) {
          area = Math.max(0, Number(p.width) * Number(p.height));
        }

        totalArea += area;
        totalConf += p.confidence || 0;

        if (cls.includes('healthy')) {
          healthyArea += area;
          healthyCount += 1;
        } else if (cls.includes('pest')) {
          pestArea += area;
          pestCount += 1;
        } else if (cls.includes('weed')) {
          weedArea += area;
          weedCount += 1;
        } else if (
          cls.includes('disease') ||
          cls.includes('blight') ||
          cls.includes('mildew') ||
          cls.includes('mold') ||
          cls.includes('rot') ||
          cls.includes('infect')
        ) {
          diseaseArea += area;
          diseaseCount += 1;
        }
      });

      if (totalArea <= 0) {
        return {
          percent: 0,
          basis: 'Detections found but with negligible area. Unable to compute a reliable readiness score.',
          recommendations: ['Re-fly the field at a consistent altitude and ensure the crop area fills most of the frame.'],
        };
      }

      const avgConf = totalConf / preds.length;
      const healthyRatio = healthyArea / totalArea;
      const diseaseRatio = diseaseArea / totalArea;
      const pestRatio = pestArea / totalArea;
      const weedRatio = weedArea / totalArea;

      let score = healthyRatio * 100;
      score -= diseaseRatio * 50;
      score -= pestRatio * 40;
      score -= weedRatio * 25;
      score += (avgConf - 0.5) * 30; // confidence slightly boosts or reduces score
      score = Math.max(0, Math.min(100, score));

      const toPct = (value: number) => (value * 100).toFixed(1);

      const basis = `Using relative area of detected regions (~100% total): Healthy ${toPct(healthyRatio)}%, disease ${toPct(diseaseRatio)}%, pests ${toPct(pestRatio)}%, weeds ${toPct(weedRatio)}%. ` +
        `Detected ${preds.length} regions: ${healthyCount} healthy, ${diseaseCount} disease (including Downy Mildew and leaf blights), ${pestCount} pest, ${weedCount} weed. ` +
        `Average model confidence ${(avgConf * 100).toFixed(1)}%.`;

      const recs: string[] = [];
      if (score >= 85 && diseaseRatio < 0.05 && pestRatio < 0.03 && weedRatio < 0.05) {
        recs.push('Field appears harvest-ready within 3–7 days. Confirm with on-ground checks on a few sample points.');
      } else if (score >= 70) {
        recs.push('Field is approaching harvest-ready. Monitor for 5–10 days and re-fly to confirm trends before scheduling harvest.');
      } else {
        recs.push('Field is not harvest-ready. Focus on correcting disease, pest, or weed issues, then reassess in 7–14 days.');
      }
      if (diseaseRatio > 0) {
        recs.push('Diseased regions detected (e.g., Downy Mildew Disease). Consider targeted fungicide or removal of heavily infected patches.');
      }
      if (pestRatio > 0) {
        recs.push('Pest-affected areas detected. Deploy pest control and re-fly in 3–5 days to verify improvement.');
      }
      if (weedRatio > 0) {
        recs.push('Weed pressure detected. Plan targeted weeding or spot spraying to reduce competition.');
      }

      return { percent: Math.round(score), basis, recommendations: recs };
    } catch (e) {
      return { percent: 0, basis: 'Insufficient data to compute readiness.', recommendations: [] };
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      // Check file size (16MB limit)
      if (file.size > 16 * 1024 * 1024) {
        setError('File size must be less than 16MB');
        setSelectedFile(null);
        setImagePreview(null);
        return;
      }
      // Check file type
      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        setError('Only PNG, JPG, JPEG, GIF files are allowed');
        setSelectedFile(null);
        setImagePreview(null);
        return;
      }
      
      // Create image preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
      
      setSelectedFile(file);
      setError(null);
    } else {
      setSelectedFile(null);
      setImagePreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      setError('Please select an image file');
      return;
    }

    if (!formData.drone_name || !formData.date_time || !formData.location || 
        !formData.field_size || !formData.flight_time || !formData.latitude || !formData.longitude) {
      setError('Please fill in all fields');
      return;
    }

    const lat = parseFloat(formData.latitude);
    const lng = parseFloat(formData.longitude);
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      setError('Please provide valid coordinates: latitude [-90,90], longitude [-180,180]');
      return;
    }

    setIsLoading(true);
    setLoadingMessage('Preparing image for analysis...');
    setError(null);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('image', selectedFile);
      formDataToSend.append('drone_name', formData.drone_name);
      formDataToSend.append('date_time', formData.date_time);
      const fusedLocation = `${formData.location} (${formData.latitude}, ${formData.longitude})`;
      formDataToSend.append('location', fusedLocation);
      formDataToSend.append('field_size', formData.field_size);
      formDataToSend.append('flight_time', formData.flight_time);
      formDataToSend.append('latitude', formData.latitude);
      formDataToSend.append('longitude', formData.longitude);

      setLoadingMessage('Uploading image and processing with AI model...');
      setLoadingMessage('⚡ Roboflow AI is analyzing your crop field...');
      
      const response = await api.post('/api/analyze', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 180000, // 3 minutes
      });

      setAnalysisResult(response.data);
      setHarvestReadiness(computeHarvestInsights(response.data));
    } catch (err: any) {
      console.error('Analysis error:', err);
      console.error('Error response:', err.response);
      console.error('Error data:', err.response?.data);
      
      let errorMessage = 'Analysis failed. Please try again.';
      
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.response?.status === 401) {
        errorMessage = 'Authentication failed. Please login again.';
      } else if (err.response?.status === 500) {
        errorMessage = 'Server error. Please check the console for details.';
      } else if (err.message) {
        errorMessage = `Network error: ${err.message}`;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const resetForm = () => {
    setFormData({
      drone_name: '',
      date_time: '',
      location: '',
      field_size: '',
      flight_time: '',
      latitude: '',
      longitude: '',
    });
    setSelectedFile(null);
    setImagePreview(null);
    setAnalysisResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="relative py-16 sm:py-20 animate-fade-in overflow-hidden">
        <div className="absolute inset-0 bg-grid-soft"></div>
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "url(https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: 0.35,
          }}
        ></div>
        <div className="overlay-gradient"></div>
        <div className="absolute -top-16 -left-24 w-96 h-96 bg-gradient-to-br from-green-300 to-emerald-500 rounded-full hero-shape animate-drift"></div>
        <div className="absolute -bottom-20 -right-28 w-[26rem] h-[26rem] bg-gradient-to-br from-emerald-400 to-green-600 rounded-full hero-shape animate-drift"></div>

        <div className="absolute top-16 right-8 icon-bubble animate-float">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14m7-7H5"/></svg>
        </div>
        <div className="absolute bottom-10 left-10 icon-bubble animate-float">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8"/></svg>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-3">Drone Image Analysis</h1>
          <p className="text-lg md:text-xl text-gray-700 max-w-3xl mx-auto">
            Upload your drone imagery and flight data for AI-powered crop analysis
          </p>
        </div>
      </section>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="grid lg:grid-cols-2 gap-8 animate-fade-in">
          {/* Analysis Form */}
          <div className="card card-hover">
            <h2 className="text-xl font-semibold mb-6">Flight Information</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="drone_name" className="block text-sm font-medium text-gray-700 mb-2">
                  Drone Name *
                </label>
                <input
                  type="text"
                  id="drone_name"
                  name="drone_name"
                  value={formData.drone_name}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="Enter drone model/name"
                  required
                />
              </div>

              <div>
                <label htmlFor="date_time" className="block text-sm font-medium text-gray-700 mb-2">
                  Date & Time *
                </label>
                <input
                  type="datetime-local"
                  id="date_time"
                  name="date_time"
                  value={formData.date_time}
                  onChange={handleInputChange}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                  Address *
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="Farm address (barangay, municipality, province)"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  Use a descriptive field address so it is easy to locate this flight later.
                </p>
              </div>

              <div>
                <label htmlFor="field_size" className="block text-sm font-medium text-gray-700 mb-2">
                  Field Size (hectares) *
                </label>
                <input
                  type="number"
                  id="field_size"
                  name="field_size"
                  value={formData.field_size}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="0.0"
                  min="0"
                  step="0.1"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  Enter the approximate field size in hectares (ha) for better context in reports.
                </p>
              </div>

              <div>
                <label htmlFor="flight_time" className="block text-sm font-medium text-gray-700 mb-2">
                  Flight Time (minutes) *
                </label>
                <input
                  type="number"
                  id="flight_time"
                  name="flight_time"
                  value={formData.flight_time}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="0"
                  min="0"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Coordinates (Latitude, Longitude) *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="number"
                    step="any"
                    id="latitude"
                    name="latitude"
                    value={formData.latitude}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="Latitude e.g., 14.5995"
                    required
                  />
                  <input
                    type="number"
                    step="any"
                    id="longitude"
                    name="longitude"
                    value={formData.longitude}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="Longitude e.g., 120.9842"
                    required
                  />
                  <button
                    type="button"
                    onClick={handleUseCurrentLocation}
                    className="btn-secondary"
                  >
                    Use Current Location
                  </button>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Drone Image *
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-primary-400 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="sr-only"
                    id="image-upload"
                    ref={fileInputRef}
                  />
                  {!imagePreview ? (
                    <label htmlFor="image-upload" className="cursor-pointer">
                      <div className="space-y-1 text-center">
                        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <div className="flex text-sm text-gray-600">
                          <span className="relative font-medium text-primary-600 hover:text-primary-500">
                            Click to upload
                          </span>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500">
                          PNG, JPG, JPEG, GIF up to 16MB
                        </p>
                      </div>
                    </label>
                  ) : (
                    <div className="w-full">
                      <label htmlFor="image-upload" className="cursor-pointer block">
                        <img 
                          src={imagePreview} 
                          alt="Drone Image Preview" 
                          className="w-full max-h-48 object-contain rounded"
                        />
                        <div className="mt-2 text-center">
                          <span className="text-sm text-primary-600 hover:text-primary-500 font-medium">
                            Click to change image
                          </span>
                        </div>
                      </label>
                      <div className="mt-3 flex justify-center">
                        <button
                          type="button"
                          onClick={handleChangeImageClick}
                          className="btn-secondary text-sm"
                        >
                          Change Image
                        </button>
                      </div>
                      {selectedFile && (
                        <div className="mt-2 p-2 bg-primary-50 rounded text-center">
                          <div className="text-xs text-primary-700">
                            <span className="font-medium">{selectedFile.name}</span>
                            <span className="ml-2">({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    'Analyze Image'
                  )}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="btn-secondary"
                >
                  Reset
                </button>
              </div>
            </form>
          </div>

          {/* Results Panel */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-6">Analysis Results</h2>
            
            {!analysisResult ? (
              <div className="text-center text-gray-500 py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 48 48">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p>Upload an image and submit the form to see analysis results</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Flight Info Summary */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-3">Flight Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-600">Drone:</span>
                      <span className="ml-2 font-medium">{analysisResult.metadata.drone_name}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Date:</span>
                      <span className="ml-2 font-medium">
                        {new Date(analysisResult.metadata.date_time).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Location:</span>
                      <span className="ml-2 font-medium">
                        {analysisResult.metadata.location || `${formData.location} (${formData.latitude}, ${formData.longitude})`}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Field Size:</span>
                      <span className="ml-2 font-medium">{analysisResult.metadata.field_size} acres</span>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-gray-600">Flight Time:</span>
                      <span className="ml-2 font-medium">{analysisResult.metadata.flight_time} minutes</span>
                    </div>
                  </div>
                </div>

                {/* Harvest Readiness */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Harvest Readiness</h3>
                  <div className="bg-white rounded-lg p-4 border">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">Estimated Readiness</span>
                      <span className="text-xl font-bold text-primary-700">{harvestReadiness.percent}%</span>
                    </div>
                    <div className="mt-3 h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary-600"
                        style={{ width: `${harvestReadiness.percent}%` }}
                      />
                    </div>
                    {harvestReadiness.basis && (
                      <p className="mt-3 text-sm text-gray-600">{harvestReadiness.basis}</p>
                    )}
                    {harvestReadiness.recommendations.length > 0 && (
                      <ul className="mt-3 list-disc list-inside text-sm text-gray-700 space-y-1">
                        {harvestReadiness.recommendations.map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                {/* Annotated Image */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">AI Instance Segmentation Result</h3>
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 text-center">
                      {analysisResult.annotated_image_url ? 'Crop Field Analysis with Polygon Detection' : 'No Objects Detected'}
                    </h4>
                    {analysisResult.annotated_image_url || analysisResult.original_image_url ? (
                      <div className="flex justify-center">
                        <div className="relative image-frame soft-hover max-w-7xl w-full mx-auto animate-fade-in">
                          <img
                            src={`${String((api.defaults.baseURL || '')).replace(/\/$/, '')}${analysisResult.annotated_image_url || analysisResult.original_image_url}`}
                            alt="AI analysis result with instance segmentation polygons"
                            className="w-full h-auto object-contain cursor-zoom-in"
                            style={{ maxHeight: '80vh' }}
                            onClick={() => setIsViewerOpen(true)}
                          />
                          <div className="absolute bottom-3 right-3 flex gap-2">
                            <button
                              type="button"
                              onClick={() => setIsViewerOpen(true)}
                              className="btn-ghost"
                            >
                              View Fullscreen
                            </button>
                            <a
                              href={`${String((api.defaults.baseURL || '')).replace(/\/$/, '')}${analysisResult.annotated_image_url || analysisResult.original_image_url}`}
                              download
                              className="btn-primary"
                            >
                              Download
                            </a>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-64 flex items-center justify-center bg-gray-100 rounded-lg border-2 border-dashed border-gray-300">
                        <p className="text-gray-500 text-lg">No crop areas detected in this image</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Analysis Results */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">AI Analysis Results</h3>
                  <div className="bg-primary-50 rounded-lg p-4">
                    <div className="space-y-3">
                      {analysisResult.analysis_result.predictions && analysisResult.analysis_result.predictions.length > 0 ? (
                        <>
                          <p className="font-medium text-primary-800">
                            Detected {analysisResult.analysis_result.predictions.length} objects
                          </p>
                          <div className="space-y-2">
                            {analysisResult.analysis_result.predictions.map((prediction: any, index: number) => (
                              <div key={index} className="bg-white rounded p-3 border">
                                <div className="flex justify-between items-center">
                                  <span className="font-medium text-gray-900">
                                    {prediction.class}
                                  </span>
                                  <span className="text-sm bg-primary-100 text-primary-800 px-2 py-1 rounded">
                                    {(prediction.confidence * 100).toFixed(1)}% confidence
                                  </span>
                                </div>
                                <div className="mt-2 text-xs text-gray-600">
                                  Instance Segmentation: {prediction.points ? `${prediction.points.length} polygon points` : 'Polygon shape detected'}
                                </div>
                                {prediction.class.toLowerCase().includes('healthy') && (
                                  <div className="mt-2 text-sm text-green-600">
                                    ✓ Healthy crop area detected
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <p className="text-primary-700">No specific objects detected in this image.</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Success Message */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"></path>
                    </svg>
                    <p className="text-sm text-green-700">
                      Analysis completed successfully! Record ID: {analysisResult.record_id}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {isViewerOpen && (analysisResult?.annotated_image_url || analysisResult?.original_image_url) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="relative max-w-[95vw] max-h-[90vh] w-full p-2 image-frame">
            <button
              type="button"
              onClick={() => setIsViewerOpen(false)}
              aria-label="Close"
              className="absolute top-3 right-3 btn-ghost"
            >
              Close
            </button>
            <img
              src={`${String((api.defaults.baseURL || '')).replace(/\/$/, '')}${analysisResult.annotated_image_url || analysisResult.original_image_url}`}
              alt="AI analysis result fullscreen"
              className="max-w-full max-h-[85vh] object-contain mx-auto"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Analyze;
