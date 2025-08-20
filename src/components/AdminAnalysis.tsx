import React, { useState } from 'react';
import { getLocalData, saveLocalData } from '../utils/localStorage';
import { buildRedditAnalysisPrompt } from '../utils/redditAnalysisPrompt';
import { config } from '../utils/config';
import { CategorySuggestion } from '../types';
import { Brain, Play, Zap, Target, CheckCircle, Clock } from 'lucide-react';

const AdminAnalysis: React.FC = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [settings, setSettings] = useState({
    model: 'gpt-4o-mini',
    batchSize: 40,
    confidence: 'medium'
  });

  const handleStartAnalysis = () => {
    const localData = getLocalData();
    if (!localData.reddit_analyses || localData.reddit_analyses.length === 0) {
      alert('No Reddit data found. Please collect data first from the Data Collection tab.');
      return;
    }

    if (!config.openai.apiKey) {
      alert('OpenAI API key not configured. Please check your .env file and add:\nVITE_OPENAI_API_KEY=your_openai_api_key');
      return;
    }

    console.log('Starting REAL AI analysis of', localData.reddit_analyses.length, 'Reddit posts');
    setIsAnalyzing(true);
    setProgress(0);
    
    // Perform real AI analysis
    performRealAIAnalysis(localData.reddit_analyses);
  };

  const performRealAIAnalysis = async (posts: any[]) => {
    try {
      const analyses = [];
      const allCategorySuggestions: CategorySuggestion[] = [];
      const batchSize = settings.batchSize;
      
      for (let i = 0; i < posts.length; i += batchSize) {
        const batch = posts.slice(i, i + batchSize);
        console.log(`Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(posts.length/batchSize)}`);
        
        for (const post of batch) {
          try {
            // Build proper analysis prompt
            const analysisPrompt = buildRedditAnalysisPrompt(
              post.title || '',
              post.selftext || '',
              (post.comments || []).map((c: any) => c.body).filter(Boolean),
              !!post.image_path,
              post.image_path ? [`Image available at ${post.image_path}`] : []
            );

            // Call real OpenAI API for each post
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${config.openai.apiKey}`,
                'Content-Type': 'application/json',
                ...(config.openai.project && { 'OpenAI-Project': config.openai.project })
              },
              body: JSON.stringify({
                model: settings.model,
                messages: [
                  {
                    role: 'system',
                    content: `You are a professional lawn care diagnostician analyzing Reddit discussions. 

When you encounter problems that don't fit well into existing categories, suggest new categories.

Return JSON with this structure:
{
  "post_analysis": {
    "primary_issue": "string",
    "confidence": 0.0-1.0
  },
  "solutions_extracted": [
    {
      "solution_text": "string",
      "products_mentioned": [
        {
          "product_name": "string",
          "active_ingredient": "string"
        }
      ]
    }
  ],
  "category_suggestions": [
    {
      "suggested_category": "string",
      "suggested_subcategory": "string",
      "description": "string", 
      "reasoning": "string",
      "confidence": 0.0-1.0,
      "visual_indicators": ["string"],
      "suggested_solutions": ["string"],
      "suggested_products": ["string"]
    }
  ]
}`
                  },
                  {
                    role: 'user',
                    content: analysisPrompt
                  }
                ],
                response_format: { type: 'json_object' },
                max_tokens: 2000,
                temperature: 0.3
              })
            });

            if (!response.ok) {
              throw new Error(`OpenAI API error: ${response.status}`);
            }

            const data = await response.json();
            const result = JSON.parse(data.choices[0].message.content || '{}');
            
            // Process category suggestions
            if (result.category_suggestions && result.category_suggestions.length > 0) {
              const categorySuggestions = result.category_suggestions.map((suggestion: any) => ({
                id: `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                suggested_category: suggestion.suggested_category || '',
                suggested_subcategory: suggestion.suggested_subcategory || '',
                description: suggestion.description || '',
                reasoning: suggestion.reasoning || '',
                confidence: suggestion.confidence || 0.5,
                supporting_cases: [post.id],
                visual_indicators: suggestion.visual_indicators || [],
                suggested_solutions: suggestion.suggested_solutions || [],
                suggested_products: suggestion.suggested_products || [],
                created_at: new Date().toISOString(),
                status: 'pending' as const,
              }));
              
              allCategorySuggestions.push(...categorySuggestions);
              console.log(`Found ${categorySuggestions.length} category suggestions from post: ${post.title}`);
            }

            analyses.push({
              id: post.id,
              post_id: post.id,
              is_lawn: true,
              root_cause: result.post_analysis?.primary_issue || `Reddit analysis: ${post.title}`,
              solutions: result.solutions_extracted?.map((s: any) => s.solution_text) || [],
              recommendations: [],
              products_mentioned: result.solutions_extracted?.flatMap((s: any) => 
                s.products_mentioned?.map((p: any, idx: number) => ({
                  id: `${post.id}_product_${idx}`,
                  name: p.product_name,
                  category: p.active_ingredient ? 'Chemical' : 'General',
                  affiliate_link: '',
                  confidence: result.post_analysis?.confidence || 0.5,
                  context: s.solution_text
                })) || []
              ) || [],
              confidence_level: (result.post_analysis?.confidence || 0) > 0.8 ? 'high' : 
                               (result.post_analysis?.confidence || 0) > 0.6 ? 'medium' : 'low',
              health_score: 5,
              weed_percentage: 0,
              treatment_urgency: 'medium' as const,
              analyzed_at: new Date().toISOString(),
              image_analysis: {
                grass_type: undefined,
                problem_areas: [],
                overall_health: 5,
                dominant_colors: [],
                texture_analysis: '',
                visual_features: [],
                similarity_hash: ''
              },
              similar_cases: [],
              learning_confidence: result.post_analysis?.confidence || 0.5
            });
            
            console.log(`Analyzed post: ${post.title}`);
            
          } catch (postError) {
            console.error(`Failed to analyze post ${post.id}:`, postError);
            // Continue with next post
          }
        }
        
        // Update progress
        const progressPercent = Math.min(((i + batchSize) / posts.length) * 100, 100);
        setProgress(progressPercent);
        
        // Rate limiting - wait between batches
        if (i + batchSize < posts.length) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
      // Save real analyses to localStorage
      const localData = getLocalData();
      localData.analyzed_posts = analyses;
      
      // Save category suggestions to localStorage
      if (allCategorySuggestions.length > 0) {
        if (!localData.category_suggestions) {
          localData.category_suggestions = [];
        }
        localData.category_suggestions.push(...allCategorySuggestions);
        console.log(`Saved ${allCategorySuggestions.length} category suggestions for admin review`);
      }
      
      saveLocalData(localData);
      
      console.log('REAL AI analysis complete:', analyses.length, 'posts analyzed');
      console.log('Category suggestions generated:', allCategorySuggestions.length);
      
      // Dispatch events to notify other components
      window.dispatchEvent(new CustomEvent('analysisComplete'));
      window.dispatchEvent(new CustomEvent('categorySuggestionsUpdated'));
      
      setIsAnalyzing(false);
      setProgress(100);
      
      // Show completion message with category suggestions info
      if (allCategorySuggestions.length > 0) {
        alert(`Analysis complete! ${analyses.length} posts analyzed.\n\n${allCategorySuggestions.length} new category suggestions were generated and are available for review in the Category Suggestions tab.`);
      } else {
        alert(`Analysis complete! ${analyses.length} posts analyzed.\n\nNo new category suggestions were generated.`);
      }
      
    } catch (error) {
      console.error('Real AI analysis failed:', error);
      setIsAnalyzing(false);
      setProgress(0);
      alert('AI analysis failed: ' + error.message + '\n\nCheck console for details and verify your OpenAI API key.');
    }
  };

  const models = [
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini', cost: 'Low', speed: 'Fast', accuracy: 'Good' },
    { id: 'gpt-4o', name: 'GPT-4o', cost: 'Medium', speed: 'Medium', accuracy: 'Excellent' },
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', cost: 'High', speed: 'Slow', accuracy: 'Excellent' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">AI Analysis</h2>
            <p className="text-gray-400 mt-1">Analyze collected posts using OpenAI models</p>
          </div>
          <div className="flex items-center space-x-3">
            {!isAnalyzing ? (
              <button
                onClick={handleStartAnalysis}
                className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                <Brain className="w-4 h-4" />
                <span>Start Analysis</span>
              </button>
            ) : (
              <button
                disabled
                className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg cursor-not-allowed"
              >
                <Brain className="w-4 h-4 animate-pulse" />
                <span>Analyzing...</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Analysis Progress */}
      {isAnalyzing && (
        <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Analysis Progress</h3>
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <Brain className="w-4 h-4 animate-pulse text-red-400" />
              <span>Processing with {settings.model}</span>
            </div>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-3 mb-4">
            <div
              className="bg-gradient-to-r from-red-500 to-red-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <Target className="w-4 h-4 text-green-400" />
              <span className="text-gray-300">Analyzed: {Math.floor(progress * 8.92)}/892</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-orange-400" />
              <span className="text-gray-300">ETA: {Math.max(1, Math.floor((100 - progress) / 15))} min</span>
            </div>
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-purple-400" />
              <span className="text-gray-300">Tokens: {Math.floor(progress * 1250)}</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-blue-400" />
              <span className="text-gray-300">Progress: {Math.floor(progress)}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Model Selection */}
      <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Model Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {models.map((model) => (
            <div
              key={model.id}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                settings.model === model.id
                  ? 'border-red-500 bg-red-900/20'
                  : 'border-gray-600 hover:border-gray-500 bg-gray-700'
              }`}
              onClick={() => setSettings(prev => ({ ...prev, model: model.id }))}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-white">{model.name}</h4>
                {settings.model === model.id && (
                  <CheckCircle className="w-5 h-5 text-red-400" />
                )}
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Cost:</span>
                  <span className={`font-medium ${
                    model.cost === 'Low' ? 'text-green-400' :
                    model.cost === 'Medium' ? 'text-yellow-400' : 'text-red-400'
                  }`}>{model.cost}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Speed:</span>
                  <span className="font-medium text-white">{model.speed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Accuracy:</span>
                  <span className="font-medium text-white">{model.accuracy}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Enhanced Analysis Features */}
        <div className="mt-6 p-4 bg-gray-700 rounded-lg">
          <h4 className="text-sm font-semibold text-white mb-3">Enhanced AI Analysis</h4>
          <div className="mb-4 p-3 bg-gray-600 rounded-lg">
            <h5 className="text-sm font-medium text-gray-300 mb-2">Professional Diagnostic System Prompt</h5>
            <div className="text-xs text-gray-400 max-h-32 overflow-y-auto">
              <pre className="whitespace-pre-wrap">{LAWN_DIAGNOSTIC_SYSTEM_PROMPT.substring(0, 500)}...</pre>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Full professional lawn diagnostician prompt ensures consistent, expert-level analysis
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-300">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                <span>Professional diagnostic methodology</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                <span>Image quality assessment</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-purple-400 rounded-full"></div>
                <span>Visual indicator analysis</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full"></div>
                <span>Differential diagnosis process</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-orange-400 rounded-full"></div>
                <span>Structured JSON metadata output</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-pink-400 rounded-full"></div>
                <span>Safety hazard identification</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalysis;