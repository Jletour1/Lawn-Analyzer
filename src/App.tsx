import React from 'react';
import { Leaf, Camera, Brain, Target } from 'lucide-react';

function App() {
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
        {/* Hero Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="flex items-center justify-center w-16 h-16 bg-green-600 rounded-full mx-auto mb-6">
            <Camera className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Upload Your Lawn Photo</h2>
          <p className="text-gray-600 mb-8">Get professional AI-powered diagnosis and treatment recommendations</p>
          
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 hover:border-green-500 transition-colors">
            <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">Click to upload your lawn photo</p>
            <p className="text-gray-600">Supports JPG, PNG, WebP up to 10MB</p>
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

        {/* Admin Link */}
        <div className="mt-8 text-center">
          <a 
            href="/admin" 
            className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <span>Admin Dashboard</span>
            <span>→</span>
          </a>
        </div>
      </main>
    </div>
  );
}

export default App;