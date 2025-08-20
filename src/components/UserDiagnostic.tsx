import React, { useState } from 'react';
import { Camera, Upload, Send, Loader, CheckCircle, AlertTriangle, Leaf, Brain, Target, Clock } from 'lucide-react';
import { addUserSubmission, LocalUserSubmission } from '../utils/localStorage';
import { performRealAnalysis } from '../utils/realAnalysis';
import { performMockAnalysis } from '../utils/mockAnalysis';
import { config } from '../utils/config';

const UserDiagnostic: React.FC = () => {
  const [step, setStep] = useState<'upload' | 'details' | 'analyzing' | 'results'>('upload');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    phone: '',
    problemDescription: '',
    grassType: '',
    location: '',
    season: 'spring',
    recentTreatments: '',
    petTraffic: false,
    hasDog: false
  });
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string>('');
  const [availableGrassTypes, setAvailableGrassTypes] = useState<string[]>([]);

  // Load available categories for better grass type suggestions
  React.useEffect(() => {
    const categoryNames = getCategoryNames();
    // Extract grass types from category names that might contain grass type info
    const grassTypes = [
      'bermuda', 'zoysia', 'st-augustine', 'kentucky-bluegrass', 
      'tall-fescue', 'perennial-ryegrass', 'unknown'
    ];
    setAvailableGrassTypes(grassTypes);
  }, []);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      setStep('details');
    }
  };

  const handleSubmit = async () => {
    if (!imageFile || !formData.problemDescription.trim()) {
      setError('Please provide an image and problem description');
      return;
    }

    setIsAnalyzing(true);
    setStep('analyzing');
    setError('');

    try {
      // Create submission object
      const submission: LocalUserSubmission = {
        id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        user_email: formData.email,
        user_name: formData.name,
        user_phone: formData.phone,
        image_data: imagePreview,
        image_filename: imageFile.name,
        problem_description: formData.problemDescription,
        grass_type: formData.grassType,
        location: formData.location,
        season: formData.season,
        recent_treatments: formData.recentTreatments,
        pet_traffic: formData.petTraffic,
        has_dog: formData.hasDog,
        flagged_for_review: false,
        admin_reviewed: false,
        created_at: new Date().toISOString()
      };

      // Perform analysis (real or mock based on API availability)
      let result;
      if (config.openai.apiKey) {
        console.log('Using real OpenAI analysis');
        result = await performRealAnalysis(submission);
      } else {
        console.log('Using mock analysis (no API key)');
        result = await performMockAnalysis(submission);
      }

      // Add analysis result to submission
      submission.analysis_result = result;

      // Save to localStorage
      addUserSubmission(submission);

      setAnalysisResult(result);
      setStep('results');
    } catch (error: any) {
      console.error('Analysis failed:', error);
      setError(error.message || 'Analysis failed. Please try again.');
      setStep('details');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetForm = () => {
    setStep('upload');
    setImageFile(null);
    setImagePreview('');
    setFormData({
      email: '',
      name: '',
      phone: '',
      problemDescription: '',
      grassType: '',
      location: '',
      season: 'spring',
      recentTreatments: '',
      petTraffic: false,
      hasDog: false
    });
    setAnalysisResult(null);
    setError('');
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-green-600 rounded-lg">
              <Leaf className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Lawn Analyzer</h1>
              <p className="text-sm text-gray-600">AI-Powered Lawn Diagnostics</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Analysis Progress - Show at top when analyzing */}
        {step === 'analyzing' && (
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center mb-8">
            <div className="flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mx-auto mb-6">
              <Brain className="w-8 h-8 text-white animate-pulse" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Analyzing Your Lawn</h2>
            <p className="text-gray-600 mb-8">Our AI is examining your photo and processing your information...</p>
            
            <div className="space-y-4">
              <div className="flex items-center justify-center space-x-3">
                <Loader className="w-5 h-5 text-blue-600 animate-spin" />
                <span className="text-gray-700">Processing image features</span>
              </div>
              <div className="flex items-center justify-center space-x-3">
                <Loader className="w-5 h-5 text-blue-600 animate-spin" />
                <span className="text-gray-700">Identifying problems</span>
              </div>
              <div className="flex items-center justify-center space-x-3">
                <Loader className="w-5 h-5 text-blue-600 animate-spin" />
                <span className="text-gray-700">Generating recommendations</span>
              </div>
            </div>
          </div>
        )}

        {step === 'upload' && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center w-16 h-16 bg-green-600 rounded-full mx-auto mb-4">
                <Camera className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Upload Your Lawn Photo</h2>
              <p className="text-gray-600">Get professional AI-powered diagnosis and treatment recommendations</p>
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-green-500 transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
              />
              <label htmlFor="image-upload" className="cursor-pointer">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-900 mb-2">Click to upload your lawn photo</p>
                <p className="text-gray-600">Supports JPG, PNG, WebP up to 10MB</p>
              </label>
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Camera className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-medium text-gray-900 mb-1">Take Clear Photos</h3>
                <p className="text-sm text-gray-600">Good lighting and focus help our AI provide better diagnosis</p>
              </div>
              <div className="text-center p-4">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Brain className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-medium text-gray-900 mb-1">AI Analysis</h3>
                <p className="text-sm text-gray-600">Advanced computer vision identifies problems and solutions</p>
              </div>
              <div className="text-center p-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Target className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-medium text-gray-900 mb-1">Get Solutions</h3>
                <p className="text-sm text-gray-600">Receive specific treatment plans and product recommendations</p>
              </div>
            </div>
          </div>
        )}

        {step === 'details' && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex items-center space-x-4 mb-8">
              <img src={imagePreview} alt="Lawn preview" className="w-24 h-24 object-cover rounded-lg" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Provide Additional Details</h2>
                <p className="text-gray-600">Help our AI provide more accurate diagnosis</p>
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <p className="text-red-800">{error}</p>
                </div>
              </div>
            )}

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Your name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Problem Description *
                </label>
                <textarea
                  value={formData.problemDescription}
                  onChange={(e) => setFormData(prev => ({ ...prev, problemDescription: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  rows={4}
                  placeholder="Describe what you're seeing: brown spots, yellowing, bare patches, weeds, etc."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Grass Type
                  </label>
                  <select
                    value={formData.grassType}
                    onChange={(e) => setFormData(prev => ({ ...prev, grassType: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">Select grass type</option>
                    <option value="bermuda">Bermuda</option>
                    <option value="zoysia">Zoysia</option>
                    <option value="st-augustine">St. Augustine</option>
                    <option value="kentucky-bluegrass">Kentucky Bluegrass</option>
                    <option value="tall-fescue">Tall Fescue</option>
                    <option value="perennial-ryegrass">Perennial Ryegrass</option>
                    <option value="unknown">Unknown</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="City, State"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Season
                  </label>
                  <select
                    value={formData.season}
                    onChange={(e) => setFormData(prev => ({ ...prev, season: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="spring">Spring</option>
                    <option value="summer">Summer</option>
                    <option value="fall">Fall</option>
                    <option value="winter">Winter</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recent Treatments
                </label>
                <input
                  type="text"
                  value={formData.recentTreatments}
                  onChange={(e) => setFormData(prev => ({ ...prev, recentTreatments: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Fertilizer, herbicide, fungicide, etc."
                />
              </div>

              <div>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.petTraffic}
                    onChange={(e) => setFormData(prev => ({ ...prev, petTraffic: e.target.checked }))}
                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <span className="text-sm font-medium text-gray-700">This area receives heavy pet traffic</span>
                </label>
              </div>
              <div>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.hasDog}
                    onChange={(e) => setFormData(prev => ({ ...prev, hasDog: e.target.checked }))}
                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Do you have a dog?</span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={() => setStep('upload')}
                className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors"
              >
                ← Back to Upload
              </button>
              <button
                onClick={handleSubmit}
                className="flex items-center space-x-2 bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                <Send className="w-5 h-5" />
                <span>Analyze My Lawn</span>
              </button>
            </div>
          </div>
        )}

        {step === 'results' && analysisResult && (
          <div className="space-y-8">
            {/* Analysis Summary */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="flex items-center space-x-4 mb-6">
                <img src={imagePreview} alt="Analyzed lawn" className="w-20 h-20 object-cover rounded-lg" />
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Analysis Complete</h2>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Target className="w-5 h-5 text-blue-600" />
                      <span className="text-sm text-gray-600">
                        Confidence: {Math.round(analysisResult.confidence * 100)}%
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-5 h-5 text-purple-600" />
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUrgencyColor(analysisResult.urgency)}`}>
                        {analysisResult.urgency} urgency
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Root Cause</h3>
                <p className="text-gray-700">{analysisResult.rootCause}</p>
              </div>

              {/* Category Suggestions Alert */}
              {analysisResult.categorySuggestions && analysisResult.categorySuggestions.length > 0 && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center space-x-2 mb-2">
                    <Brain className="w-5 h-5 text-purple-600" />
                    <h4 className="font-medium text-purple-900">New Category Discovered</h4>
                  </div>
                  <p className="text-purple-800 text-sm">
                    Our AI has identified a potentially new type of lawn problem that doesn't fit existing categories. 
                    This suggestion has been sent to our experts for review and may be added to help future diagnoses.
                  </p>
                  <div className="mt-3">
                    {analysisResult.categorySuggestions.map((suggestion: any, idx: number) => (
                      <div key={idx} className="text-sm text-purple-700">
                        <strong>Suggested Category:</strong> {suggestion.suggested_category}
                        {suggestion.suggested_subcategory && (
                          <span> → {suggestion.suggested_subcategory}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Treatment Solutions</h3>
                  <ul className="space-y-2">
                    {analysisResult.solutions.map((solution: string, index: number) => (
                      <li key={index} className="flex items-start space-x-2">
                        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{solution}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Treatment Details</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Health Score:</span>
                      <span className="font-medium">{analysisResult.healthScore}/10</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Difficulty:</span>
                      <span className="font-medium capitalize">{analysisResult.difficulty}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Est. Cost:</span>
                      <span className="font-medium">{analysisResult.costEstimate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Timeline:</span>
                      <span className="font-medium">{analysisResult.timeline}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Treatment Schedules */}
            {analysisResult.treatmentSchedules && analysisResult.treatmentSchedules.length > 0 && (
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Step-by-Step Treatment Plan</h3>
                {analysisResult.treatmentSchedules.map((schedule: any, scheduleIndex: number) => (
                  <div key={scheduleIndex} className="mb-8 last:mb-0">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="text-xl font-bold text-gray-900">{schedule.name}</h4>
                        <p className="text-gray-600 mt-1">{schedule.description}</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          schedule.difficulty_level === 'beginner' ? 'bg-green-100 text-green-800' :
                          schedule.difficulty_level === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {schedule.difficulty_level}
                        </span>
                        <span className="text-sm text-gray-500">
                          Duration: {schedule.total_duration}
                        </span>
                      </div>
                    </div>

                    {/* Treatment Steps */}
                    <div className="space-y-4">
                      {schedule.steps.map((step: any, stepIndex: number) => (
                        <div key={stepIndex} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                          <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                            step.is_critical ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'
                          }`}>
                            {step.step_number}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h5 className="font-semibold text-gray-900">{step.title}</h5>
                              {step.is_critical && (
                                <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full font-medium">
                                  Critical Step
                                </span>
                              )}
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                {step.timing}
                              </span>
                              {step.season && (
                                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                  {step.season}
                                </span>
                              )}
                            </div>
                            <p className="text-gray-700 mb-3">{step.description}</p>
                            
                            {/* Products Needed */}
                            {step.products_needed && step.products_needed.length > 0 && (
                              <div className="mb-2">
                                <span className="text-sm font-medium text-gray-600">Products needed: </span>
                                <span className="text-sm text-gray-700">{step.products_needed.join(', ')}</span>
                              </div>
                            )}
                            
                            {/* Notes */}
                            {step.notes && (
                              <div className="mt-2 p-2 bg-yellow-50 border-l-4 border-yellow-400">
                                <p className="text-sm text-yellow-800">
                                  <strong>Note:</strong> {step.notes}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Success Indicators */}
                    {schedule.success_indicators && schedule.success_indicators.length > 0 && (
                      <div className="mt-6 p-4 bg-green-50 rounded-lg">
                        <h5 className="font-semibold text-green-900 mb-3">Signs of Success</h5>
                        <ul className="space-y-1">
                          {schedule.success_indicators.map((indicator: string, idx: number) => (
                            <li key={idx} className="flex items-center space-x-2 text-green-800">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              <span className="text-sm">{indicator}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Similar Cases */}
            {analysisResult.similarCases && analysisResult.similarCases.length > 0 && (
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Similar Cases from Database</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {analysisResult.similarCases.slice(0, 4).map((case_: any, index: number) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-900">
                          {Math.round(case_.similarity_score * 100)}% similar
                        </span>
                        <span className="text-xs text-gray-500">
                          Success: {Math.round(case_.success_rate * 100)}%
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{case_.root_cause}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Products */}
            {analysisResult.products && analysisResult.products.length > 0 && (
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Recommended Products</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {analysisResult.products.map((product: any, index: number) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">{product.name}</h4>
                      <p className="text-sm text-gray-600 mb-2">{product.category}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-green-600">{product.price}</span>
                        {product.affiliateLink && (
                          <a
                            href={product.affiliateLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            View Product
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">What's Next?</h3>
                  <p className="text-gray-600">Your analysis has been saved and can be reviewed by our experts if needed.</p>
                </div>
                <div className="flex space-x-4">
                  <button
                    onClick={resetForm}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                  >
                    Analyze Another Photo
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default UserDiagnostic;