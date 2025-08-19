import React, { useState, useEffect } from 'react';
import { getLocalData, saveLocalData } from '../utils/localStorage';
import { CategorySuggestion, CategoryApproval } from '../types';
import {
  Brain,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Plus,
  AlertTriangle,
  Lightbulb,
  Target,
  TrendingUp,
  Filter,
  Search
} from 'lucide-react';

const CategorySuggestionManager: React.FC = () => {
  const [suggestions, setSuggestions] = useState<CategorySuggestion[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSuggestion, setSelectedSuggestion] = useState<CategorySuggestion | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualCategory, setManualCategory] = useState({
    category: '',
    subcategory: '',
    description: '',
    visualIndicators: [''],
    solutions: [''],
    products: ['']
  });

  useEffect(() => {
    loadSuggestions();
  }, []);

  const loadSuggestions = () => {
    const localData = getLocalData();
    const categorySuggestions = localData.category_suggestions || [];
    setSuggestions(categorySuggestions);
  };

  const handleApproval = (suggestionId: string, approved: boolean, notes: string) => {
    const localData = getLocalData();
    const suggestionIndex = localData.category_suggestions?.findIndex(s => s.id === suggestionId);
    
    if (suggestionIndex !== undefined && suggestionIndex >= 0 && localData.category_suggestions) {
      const suggestion = localData.category_suggestions[suggestionIndex];
      
      // Update suggestion status
      localData.category_suggestions[suggestionIndex] = {
        ...suggestion,
        status: approved ? 'approved' : 'rejected',
        admin_notes: notes,
        reviewed_at: new Date().toISOString(),
        reviewed_by: 'admin'
      };

      // If approved, add to root causes
      if (approved) {
        if (!localData.root_causes) {
          localData.root_causes = [];
        }

        const newRootCause = {
          id: `rc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: suggestion.suggested_category,
          category: categorizeNewCategory(suggestion.suggested_category),
          description: suggestion.description,
          visual_indicators: suggestion.visual_indicators,
          standard_root_cause: suggestion.description,
          standard_solutions: suggestion.suggested_solutions,
          standard_recommendations: suggestion.suggested_solutions.map(s => `Consider: ${s}`),
          products: suggestion.suggested_products.map((product, idx) => ({
            id: `prod_${idx}`,
            name: product,
            category: 'General',
            description: `Recommended for ${suggestion.suggested_category}`,
            affiliate_link: '',
            price_range: '$20-50',
            effectiveness_rating: 4,
            application_timing: ['As needed'],
            product_type: 'treatment' as const
          })),
          confidence_threshold: Math.max(0.7, suggestion.confidence),
          success_rate: suggestion.confidence,
          case_count: suggestion.supporting_cases.length,
          seasonal_factors: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        localData.root_causes.push(newRootCause);
        console.log('Added new root cause from approved suggestion:', newRootCause.name);
      }

      saveLocalData(localData);
      
      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('rootCausesUpdated'));
      
      loadSuggestions();
      setSelectedSuggestion(null);
      setAdminNotes('');
    }
  };

  const handleManualSubmit = () => {
    if (!manualCategory.category.trim() || !manualCategory.description.trim()) {
      alert('Please provide at least a category name and description');
      return;
    }

    const localData = getLocalData();
    if (!localData.root_causes) {
      localData.root_causes = [];
    }

    const newRootCause = {
      id: `rc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: manualCategory.category,
      category: categorizeNewCategory(manualCategory.category),
      description: manualCategory.description,
      visual_indicators: manualCategory.visualIndicators.filter(vi => vi.trim()),
      standard_root_cause: manualCategory.description,
      standard_solutions: manualCategory.solutions.filter(s => s.trim()),
      standard_recommendations: manualCategory.solutions.filter(s => s.trim()).map(s => `Consider: ${s}`),
      products: manualCategory.products.filter(p => p.trim()).map((product, idx) => ({
        id: `prod_${idx}`,
        name: product,
        category: 'General',
        description: `Recommended for ${manualCategory.category}`,
        affiliate_link: '',
        price_range: '$20-50',
        effectiveness_rating: 4,
        application_timing: ['As needed'],
        product_type: 'treatment' as const
      })),
      confidence_threshold: 0.8,
      success_rate: 0.8,
      case_count: 0,
      seasonal_factors: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    localData.root_causes.push(newRootCause);
    saveLocalData(localData);
    
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('rootCausesUpdated'));

    // Reset form
    setManualCategory({
      category: '',
      subcategory: '',
      description: '',
      visualIndicators: [''],
      solutions: [''],
      products: ['']
    });
    setShowManualForm(false);

    console.log('Added manual root cause:', newRootCause.name);
    alert('Category added successfully!');
  };

  const addArrayField = (field: 'visualIndicators' | 'solutions' | 'products') => {
    setManualCategory(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const updateArrayField = (field: 'visualIndicators' | 'solutions' | 'products', index: number, value: string) => {
    setManualCategory(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const removeArrayField = (field: 'visualIndicators' | 'solutions' | 'products', index: number) => {
    setManualCategory(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };
  const categorizeNewCategory = (categoryName: string): 'disease' | 'pest' | 'environmental' | 'maintenance' | 'weed' => {
    const name = categoryName.toLowerCase();
    if (name.includes('disease') || name.includes('fungal') || name.includes('blight') || name.includes('rot')) return 'disease';
    if (name.includes('pest') || name.includes('insect') || name.includes('bug') || name.includes('grub')) return 'pest';
    if (name.includes('weed') || name.includes('invasive') || name.includes('unwanted')) return 'weed';
    if (name.includes('mowing') || name.includes('maintenance') || name.includes('equipment') || name.includes('fertilizer')) return 'maintenance';
    return 'environmental';
  };

  const filteredSuggestions = suggestions
    .filter(suggestion => {
      if (filter !== 'all' && suggestion.status !== filter) return false;
      if (searchTerm && !suggestion.suggested_category.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !suggestion.description.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const stats = {
    total: suggestions.length,
    pending: suggestions.filter(s => s.status === 'pending').length,
    approved: suggestions.filter(s => s.status === 'approved').length,
    rejected: suggestions.filter(s => s.status === 'rejected').length,
    avgConfidence: suggestions.length > 0 
      ? suggestions.reduce((sum, s) => sum + s.confidence, 0) / suggestions.length 
      : 0
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-6">
        <div className="flex items-center space-x-3">
          <Brain className="w-8 h-8 text-purple-400" />
          <div>
            <h2 className="text-2xl font-bold text-white">AI Category Suggestions</h2>
            <p className="text-gray-400 mt-1">Review and approve new diagnostic categories suggested by AI</p>
          </div>
          <div className="ml-auto">
            <button
              onClick={() => setShowManualForm(true)}
              className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Manual Category</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Total Suggestions</p>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
            </div>
            <Lightbulb className="w-8 h-8 text-blue-400" />
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Pending Review</p>
              <p className="text-2xl font-bold text-white">{stats.pending}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-400" />
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Approved</p>
              <p className="text-2xl font-bold text-white">{stats.approved}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Rejected</p>
              <p className="text-2xl font-bold text-white">{stats.rejected}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-400" />
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Avg Confidence</p>
              <p className="text-2xl font-bold text-white">{Math.round(stats.avgConfidence * 100)}%</p>
            </div>
            <Target className="w-8 h-8 text-purple-400" />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <Filter className="w-5 h-5 text-gray-400" />
            <div className="flex space-x-2">
              {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    filter === status
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                  {status !== 'all' && (
                    <span className="ml-1 text-xs">
                      ({status === 'pending' ? stats.pending : 
                        status === 'approved' ? stats.approved : stats.rejected})
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search suggestions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Suggestions List */}
      <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-6">Category Suggestions</h3>
        
        {filteredSuggestions.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Brain className="w-8 h-8 text-gray-500" />
            </div>
            <h4 className="text-lg font-medium text-gray-300 mb-2">No Suggestions Found</h4>
            <p className="text-gray-500">
              {filter === 'pending' 
                ? 'No pending suggestions. AI will create suggestions when it encounters new problem types.'
                : `No ${filter} suggestions found.`
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSuggestions.map((suggestion) => (
              <div key={suggestion.id} className="p-4 bg-gray-700 rounded-lg">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="text-lg font-medium text-white">{suggestion.suggested_category}</h4>
                      {suggestion.suggested_subcategory && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {suggestion.suggested_subcategory}
                        </span>
                      )}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor(suggestion.status)}`}>
                        {getStatusIcon(suggestion.status)}
                        <span>{suggestion.status}</span>
                      </span>
                    </div>
                    <p className="text-gray-300 mb-2">{suggestion.description}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-400">
                      <span>Confidence: {Math.round(suggestion.confidence * 100)}%</span>
                      <span>Cases: {suggestion.supporting_cases.length}</span>
                      <span>Created: {new Date(suggestion.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {suggestion.status === 'pending' && (
                      <>
                        <button
                          onClick={() => setSelectedSuggestion(suggestion)}
                          className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          <span>Review</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
                
                {/* Reasoning */}
                <div className="mt-3 p-3 bg-gray-600 rounded-lg">
                  <h5 className="text-sm font-medium text-gray-300 mb-1">AI Reasoning:</h5>
                  <p className="text-sm text-gray-400">{suggestion.reasoning}</p>
                </div>

                {/* Visual Indicators */}
                {suggestion.visual_indicators.length > 0 && (
                  <div className="mt-3">
                    <h5 className="text-sm font-medium text-gray-300 mb-2">Visual Indicators:</h5>
                    <div className="flex flex-wrap gap-2">
                      {suggestion.visual_indicators.map((indicator, idx) => (
                        <span key={idx} className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                          {indicator}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Admin Notes */}
                {suggestion.admin_notes && (
                  <div className="mt-3 p-3 bg-gray-600 rounded-lg">
                    <h5 className="text-sm font-medium text-gray-300 mb-1">Admin Notes:</h5>
                    <p className="text-sm text-gray-400">{suggestion.admin_notes}</p>
                    {suggestion.reviewed_at && (
                      <p className="text-xs text-gray-500 mt-1">
                        Reviewed on {new Date(suggestion.reviewed_at).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Manual Category Creation Modal */}
      {showManualForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Add Manual Category</h3>
                <button
                  onClick={() => setShowManualForm(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Category Name *
                    </label>
                    <input
                      type="text"
                      value={manualCategory.category}
                      onChange={(e) => setManualCategory(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="e.g., Fairy Ring Disease"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Subcategory (Optional)
                    </label>
                    <input
                      type="text"
                      value={manualCategory.subcategory}
                      onChange={(e) => setManualCategory(prev => ({ ...prev, subcategory: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="e.g., Fungal Disease"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={manualCategory.description}
                    onChange={(e) => setManualCategory(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    rows={3}
                    placeholder="Describe the problem, its causes, and characteristics..."
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-300">
                      Visual Indicators
                    </label>
                    <button
                      onClick={() => addArrayField('visualIndicators')}
                      className="text-green-400 hover:text-green-300 text-sm"
                    >
                      + Add Indicator
                    </button>
                  </div>
                  {manualCategory.visualIndicators.map((indicator, index) => (
                    <div key={index} className="flex items-center space-x-2 mb-2">
                      <input
                        type="text"
                        value={indicator}
                        onChange={(e) => updateArrayField('visualIndicators', index, e.target.value)}
                        className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="e.g., Circular brown patches with dark edges"
                      />
                      {manualCategory.visualIndicators.length > 1 && (
                        <button
                          onClick={() => removeArrayField('visualIndicators', index)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-300">
                      Treatment Solutions
                    </label>
                    <button
                      onClick={() => addArrayField('solutions')}
                      className="text-green-400 hover:text-green-300 text-sm"
                    >
                      + Add Solution
                    </button>
                  </div>
                  {manualCategory.solutions.map((solution, index) => (
                    <div key={index} className="flex items-center space-x-2 mb-2">
                      <input
                        type="text"
                        value={solution}
                        onChange={(e) => updateArrayField('solutions', index, e.target.value)}
                        className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="e.g., Apply fungicide containing propiconazole"
                      />
                      {manualCategory.solutions.length > 1 && (
                        <button
                          onClick={() => removeArrayField('solutions', index)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-300">
                      Recommended Products
                    </label>
                    <button
                      onClick={() => addArrayField('products')}
                      className="text-green-400 hover:text-green-300 text-sm"
                    >
                      + Add Product
                    </button>
                  </div>
                  {manualCategory.products.map((product, index) => (
                    <div key={index} className="flex items-center space-x-2 mb-2">
                      <input
                        type="text"
                        value={product}
                        onChange={(e) => updateArrayField('products', index, e.target.value)}
                        className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="e.g., BioAdvanced Disease Control for Lawns"
                      />
                      {manualCategory.products.length > 1 && (
                        <button
                          onClick={() => removeArrayField('products', index)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-700 mt-6">
                <button
                  onClick={() => setShowManualForm(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleManualSubmit}
                  className="flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Category</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {selectedSuggestion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Review Category Suggestion</h3>
                <button
                  onClick={() => setSelectedSuggestion(null)}
                  className="text-gray-400 hover:text-white"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-medium text-white mb-2">{selectedSuggestion.suggested_category}</h4>
                  {selectedSuggestion.suggested_subcategory && (
                    <p className="text-gray-300 mb-2">Subcategory: {selectedSuggestion.suggested_subcategory}</p>
                  )}
                  <p className="text-gray-300">{selectedSuggestion.description}</p>
                </div>

                <div>
                  <h5 className="text-sm font-medium text-gray-300 mb-2">AI Reasoning:</h5>
                  <p className="text-sm text-gray-400 bg-gray-700 p-3 rounded-lg">{selectedSuggestion.reasoning}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="text-sm font-medium text-gray-300 mb-2">Visual Indicators:</h5>
                    <ul className="text-sm text-gray-400 space-y-1">
                      {selectedSuggestion.visual_indicators.map((indicator, idx) => (
                        <li key={idx} className="flex items-center space-x-2">
                          <div className="w-1.5 h-1.5 bg-purple-400 rounded-full"></div>
                          <span>{indicator}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h5 className="text-sm font-medium text-gray-300 mb-2">Suggested Solutions:</h5>
                    <ul className="text-sm text-gray-400 space-y-1">
                      {selectedSuggestion.suggested_solutions.map((solution, idx) => (
                        <li key={idx} className="flex items-center space-x-2">
                          <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                          <span>{solution}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div>
                  <h5 className="text-sm font-medium text-gray-300 mb-2">Admin Notes:</h5>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add notes about your decision..."
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    rows={3}
                  />
                </div>

                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-700">
                  <button
                    onClick={() => {
                      setSelectedSuggestion(null);
                      setAdminNotes('');
                    }}
                    className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleApproval(selectedSuggestion.id, false, adminNotes)}
                    className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Reject</span>
                  </button>
                  <button
                    onClick={() => handleApproval(selectedSuggestion.id, true, adminNotes)}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Approve & Add</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategorySuggestionManager;