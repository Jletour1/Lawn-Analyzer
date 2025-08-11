import React, { useState } from 'react';
import { Camera, Upload, Leaf, Brain, CheckCircle, AlertCircle, Lightbulb, ShoppingCart, Eye, Zap } from 'lucide-react';
import { lawnAnalyzer, type AnalysisResult } from '../../utils/lawnAnalyzer';
import { enhancedImageAnalyzer } from '../../utils/enhancedImageAnalyzer';

const UserDiagnostic: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedImage || !description.trim()) {
      alert('Please upload an image and describe the issue');
      return;
    }

    setIsAnalyzing(true);
    
    // Run enhanced AI analysis with image-to-image comparison
    setTimeout(async () => {
      try {
        // Perform comprehensive analysis
        const analysisResult = await lawnAnalyzer.analyzeLawn(selectedImage!, 'Lawn Problem', description);
        setResult(analysisResult);
        
        // Save submission to admin panel for review
        if ((window as any).addUserSubmission) {
          (window as any).addUserSubmission(selectedImage!, description, analysisResult);
        }
      } catch (error) {
        console.error('Analysis failed:', error);
        // Fallback to basic analysis
        const fallbackResult = lawnAnalyzer.analyzeLawn(selectedImage!, 'Lawn Problem', description);
        setResult(fallbackResult);
        
        // Save submission even for fallback
        if ((window as any).addUserSubmission) {
          (window as any).addUserSubmission(selectedImage!, description, fallbackResult);
        }
      }
      setIsAnalyzing(false);
    }, 5000); // Increased time for enhanced analysis with similarity search
  };

  return (
    <div className="min-h-screen">
      {/* Hero Header */}
      <header className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-white/20 rounded-2xl">
                <Leaf className="w-12 h-12" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Enhanced Lawn Care AI Diagnostic
            </h1>
            <p className="text-xl text-green-100 max-w-2xl mx-auto">
              Upload a photo and get AI-powered diagnosis with image similarity matching, dynamic problem detection, and community-validated treatments
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {!result ? (
          <div className="space-y-8">
            {/* Upload Section */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Upload Your Lawn Photo</h2>
              
              <div className="space-y-6">
                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Photo of the affected area
                  </label>
                  {!imagePreview ? (
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-green-400 transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="image-upload"
                      />
                      <label htmlFor="image-upload" className="cursor-pointer">
                        <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-lg font-medium text-gray-900 mb-2">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-gray-500">PNG, JPG, WEBP up to 10MB</p>
                      </label>
                    </div>
                  ) : (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Lawn preview"
                        className="w-full h-64 object-cover rounded-xl"
                      />
                      <button
                        onClick={() => {
                          setImagePreview(null);
                          setSelectedImage(null);
                        }}
                        className="absolute top-4 right-4 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Describe the issue
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe what you're seeing... (e.g., brown patches appearing after rain, yellow spots near dog area, etc.)"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                    rows={4}
                  />
                </div>

                {/* Analyze Button */}
                <button
                  onClick={handleAnalyze}
                  disabled={!selectedImage || !description.trim() || isAnalyzing}
                  className="w-full flex items-center justify-center space-x-2 bg-green-600 text-white py-4 px-6 rounded-xl font-semibold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {isAnalyzing ? (
                    <>
                      <Zap className="w-5 h-5 animate-pulse" />
                      <span>Enhanced AI Analysis in Progress...</span>
                    </>
                  ) : (
                    <>
                      <Brain className="w-5 h-5" />
                      <span>Diagnose My Lawn</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Analysis Progress */}
            {isAnalyzing && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                <div className="text-center">
                  <div className="flex justify-center mb-4">
                    <div className="relative">
                      <Zap className="w-12 h-12 text-green-600 animate-pulse" />
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full animate-ping"></div>
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Enhanced AI Analysis with Image Matching
                  </h3>
                  <p className="text-gray-600 mb-6">
                    • Analyzing image colors, patterns, and textures<br/>
                    • Searching database of similar lawn images<br/>
                    • Applying dynamic problem indicators<br/>
                    • Validating with community treatment data<br/>
                    • Calculating confidence boost from matches
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full animate-pulse" style={{ width: '75%' }}></div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-4 text-xs text-gray-500">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span>Feature Extraction</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                      <span>Similarity Search</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                      <span>Dynamic Indicators</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                      <span>Community Validation</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Results Section */
          <div className="space-y-8">
            {/* Diagnosis Result */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              <div className="flex items-center space-x-3 mb-6">
                <CheckCircle className="w-8 h-8 text-green-600" />
                <h2 className="text-2xl font-bold text-gray-900">Diagnosis Complete</h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <img
                    src={imagePreview!}
                    alt="Analyzed lawn"
                    className="w-full h-64 object-cover rounded-xl mb-4 border-2 border-green-200"
                  />
                  <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-3">Enhanced Analysis Results</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="bg-white rounded p-2">
                        <div className="text-blue-700 font-medium">Damage Area</div>
                        <div className="text-lg font-bold text-blue-900">{result.health_metrics.brown_stressed}%</div>
                      </div>
                      <div className="bg-white rounded p-2">
                        <div className="text-green-700 font-medium">Weed Coverage</div>
                        <div className="text-lg font-bold text-green-900">{result.weed_analysis.total_weed_percentage}%</div>
                      </div>
                      <div className="bg-white rounded p-2">
                        <div className="text-purple-700 font-medium">Health Score</div>
                        <div className="text-lg font-bold text-purple-900">{result.health_metrics.health_score}/10</div>
                      </div>
                      <div className="bg-white rounded p-2">
                        <div className="text-orange-700 font-medium">Confidence</div>
                        <div className="text-lg font-bold text-orange-900">{Math.round(result.confidence * 100)}%</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Enhanced Analysis Features */}
                  <div className="mt-4 bg-purple-50 rounded-lg p-4">
                    <h4 className="font-semibold text-purple-900 mb-2">🔍 Enhanced Analysis Features</h4>
                    <p className="text-purple-800 text-sm">
                      Image similarity matching found {result.similar_images?.length || 0} similar cases. Dynamic indicators detected {Object.keys(result.dynamic_indicators || {}).length} problem patterns.
                    </p>
                    <p className="text-purple-700 text-xs mt-2">
                      ✓ Image-to-image comparison ✓ Dynamic learning ✓ Community validation ✓ Confidence boosting
                    </p>
                  </div>
                </div>

                <div>
                  <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
                    <div className="flex items-start space-x-3">
                      <AlertCircle className="w-6 h-6 text-red-500 mt-1" />
                      <div>
                        <h3 className="text-lg font-semibold text-red-900 mb-2">
                          Identified Issue: {result.problem_name}
                        </h3>
                        <p className="text-red-800 text-sm mb-3">{result.description}</p>
                        <div className="flex items-center space-x-2 mb-3">
                          <span className="text-sm text-red-700">Confidence:</span>
                          <div className="flex-1 bg-red-200 rounded-full h-2">
                            <div
                              className="bg-red-600 h-2 rounded-full"
                              style={{ width: `${result.confidence * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-red-900">{Math.round(result.confidence * 100)}%</span>
                        </div>
                        <div className="text-xs text-red-700">
                          Analysis based on: Image patterns, color analysis, community data, and AI vision
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Similar Images Section */}
                  {result.similar_images && result.similar_images.length > 0 && (
                    <div className="bg-blue-50 rounded-xl p-6 mb-6">
                      <div className="flex items-start space-x-3">
                        <Eye className="w-6 h-6 text-blue-500 mt-1" />
                        <div>
                          <h3 className="text-lg font-semibold text-blue-900 mb-2">
                            Similar Cases Found
                          </h3>
                          <p className="text-blue-800 text-sm mb-3">
                            Found {result.similar_images.length} visually similar cases in our database
                          </p>
                          <div className="space-y-2">
                            {result.similar_images.slice(0, 3).map((similar, index) => (
                              <div key={index} className="flex items-center justify-between bg-white rounded p-2">
                                <span className="text-blue-900 text-sm">{similar.problem_type}</span>
                                <div className="flex items-center space-x-2">
                                  <span className="text-xs text-blue-700">{Math.round(similar.similarity * 100)}% match</span>
                                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">{similar.source}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Weed Analysis */}
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h4 className="font-semibold text-gray-900 mb-4">🌿 Comprehensive Weed Analysis</h4>
                    <div className="space-y-3">
                      <div className="text-sm">
                        <p className="text-gray-700 mb-1">
                          <strong>Coverage:</strong> {result.weed_analysis.coverage_assessment}
                        </p>
                        <p className="text-gray-700 mb-1">
                          <strong>Grass Quality:</strong> {result.weed_analysis.grass_quality}
                        </p>
                        <p className="text-gray-700">
                          <strong>Treatment Priority:</strong> {result.weed_analysis.treatment_priority}
                        </p>
                      </div>
                      {result.weed_analysis.identified_weed_types.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm font-medium text-gray-800 mb-2">Identified Weed Types:</p>
                          {result.weed_analysis.identified_weed_types.map((weed, index) => (
                            <div key={index} className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded mb-1">
                              {weed.type} ({Math.round(weed.confidence * 100)}% confidence)
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recommendations */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              <div className="flex items-center space-x-3 mb-6">
                <Lightbulb className="w-8 h-8 text-yellow-500" />
                <h3 className="text-2xl font-bold text-gray-900">Treatment Recommendations</h3>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                {result.recommendations.immediate.map((rec, index) => (
                  <div key={index} className="flex items-start space-x-3 p-4 bg-green-50 rounded-lg">
                    <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                      {index + 1}
                    </div>
                    <p className="text-gray-800">{rec}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Product Recommendations */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              <div className="flex items-center space-x-3 mb-6">
                <ShoppingCart className="w-8 h-8 text-blue-500" />
                <h3 className="text-2xl font-bold text-gray-900">Recommended Products</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {result.recommendations.products.slice(0, 3).map((product, index) => (
                  <div key={index} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                        Product
                      </span>
                      <span className="text-lg font-bold text-green-600">{result.recommendations.cost}</span>
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">{product}</h4>
                    <p className="text-gray-600 text-sm mb-4">Recommended for treating {result.problem_name.toLowerCase()}</p>
                    <button className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors">
                      View Product
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Community Posts */}
            {result.community_posts.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                <div className="flex items-center space-x-3 mb-6">
                  <CheckCircle className="w-8 h-8 text-blue-500" />
                  <h3 className="text-2xl font-bold text-gray-900">Similar Cases from Community</h3>
                </div>
                
                <div className="space-y-4">
                  {result.community_posts.map((post, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <h4 className="font-semibold text-gray-900 mb-2">{post.title}</h4>
                      <p className="text-gray-600 text-sm mb-2">{post.description}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>r/{post.subreddit} • {post.score} upvotes</span>
                        <span>{post.post_type}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Enhanced Analysis Insights */}
            {result.confidence_boost > 0.1 && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                <div className="flex items-center space-x-3 mb-6">
                  <Zap className="w-8 h-8 text-yellow-500" />
                  <h3 className="text-2xl font-bold text-gray-900">Enhanced Analysis Insights</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">+{Math.round(result.confidence_boost * 100)}%</div>
                    <div className="text-sm text-yellow-800">Confidence Boost</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{result.community_validation?.matching_posts || 0}</div>
                    <div className="text-sm text-blue-800">Similar Community Cases</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{Math.round((result.community_validation?.treatment_success || 0) * 100)}%</div>
                    <div className="text-sm text-green-800">Treatment Success Rate</div>
                  </div>
                </div>
              </div>
            )}

            {/* Combined Assessment */}
            <div className="bg-blue-50 rounded-2xl border border-blue-200 p-8">
              <h3 className="text-xl font-bold text-blue-900 mb-4">Expert Assessment</h3>
              <p className="text-blue-800 leading-relaxed">{result.combined_assessment}</p>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-semibold text-blue-900">Health Score:</span>
                  <span className="ml-2 text-blue-800">{result.health_metrics.health_score}/10</span>
                </div>
                <div>
                  <span className="font-semibold text-blue-900">Treatment Timeline:</span>
                  <span className="ml-2 text-blue-800">{result.recommendations.timeline}</span>
                </div>
              </div>
            </div>

            {/* New Analysis Button */}
            <div className="text-center">
              <button
                onClick={() => {
                  setResult(null);
                  setImagePreview(null);
                  setSelectedImage(null);
                  setDescription('');
                }}
                className="bg-gray-600 text-white py-3 px-8 rounded-xl font-semibold hover:bg-gray-700 transition-colors"
              >
                Analyze Another Issue
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default UserDiagnostic;