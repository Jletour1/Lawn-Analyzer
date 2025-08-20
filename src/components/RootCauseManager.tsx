import React, { useState, useEffect } from 'react';
import { getLocalData, saveLocalData } from '../utils/localStorage';
import { RootCause, TreatmentSchedule } from '../types';
import {
  Database,
  Plus,
  Edit,
  Trash2,
  Eye,
  Save,
  X,
  Calendar,
  Target,
  CheckCircle,
  AlertTriangle,
  Package,
  Clock,
  Brain,
  FileText,
  Code
} from 'lucide-react';

const RootCauseManager: React.FC = () => {
  const [rootCauses, setRootCauses] = useState<RootCause[]>([]);
  const [treatmentSchedules, setTreatmentSchedules] = useState<TreatmentSchedule[]>([]);
  const [selectedRootCause, setSelectedRootCause] = useState<RootCause | null>(null);
  const [editingRootCause, setEditingRootCause] = useState<RootCause | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showAIDocumentation, setShowAIDocumentation] = useState<RootCause | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    category: 'environmental' as const,
    description: '',
    visual_indicators: [''],
    standard_solutions: [''],
    confidence_threshold: 0.7,
    success_rate: 0.8
  });

  const [newRootCause, setNewRootCause] = useState({
    name: '',
    category: 'environmental' as const,
    description: '',
    visual_indicators: [''],
    standard_solutions: [''],
    products: []
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const localData = getLocalData();
    setRootCauses(localData.root_causes || []);
    setTreatmentSchedules(localData.treatment_schedules || []);
  };

  const handleEdit = (rootCause: RootCause) => {
    setEditingRootCause(rootCause);
    setEditForm({
      name: rootCause.name,
      category: rootCause.category,
      description: rootCause.description,
      visual_indicators: rootCause.visual_indicators.length > 0 ? rootCause.visual_indicators : [''],
      standard_solutions: rootCause.standard_solutions.length > 0 ? rootCause.standard_solutions : [''],
      confidence_threshold: rootCause.confidence_threshold || 0.7,
      success_rate: rootCause.success_rate || 0.8
    });
  };

  const handleSaveEdit = () => {
    if (!editingRootCause) return;

    const localData = getLocalData();
    const rootCauseIndex = localData.root_causes?.findIndex(rc => rc.id === editingRootCause.id);
    
    if (rootCauseIndex !== undefined && rootCauseIndex >= 0 && localData.root_causes) {
      localData.root_causes[rootCauseIndex] = {
        ...editingRootCause,
        name: editForm.name,
        category: editForm.category,
        description: editForm.description,
        visual_indicators: editForm.visual_indicators.filter(vi => vi.trim()),
        standard_root_cause: editForm.description,
        standard_solutions: editForm.standard_solutions.filter(s => s.trim()),
        standard_recommendations: editForm.standard_solutions.filter(s => s.trim()).map(s => `Consider: ${s}`),
        confidence_threshold: editForm.confidence_threshold,
        success_rate: editForm.success_rate,
        updated_at: new Date().toISOString()
      };

      saveLocalData(localData);
      loadData();
      setEditingRootCause(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingRootCause(null);
    setEditForm({
      name: '',
      category: 'environmental',
      description: '',
      visual_indicators: [''],
      standard_solutions: [''],
      confidence_threshold: 0.7,
      success_rate: 0.8
    });
  };

  const handleSave = () => {
    const localData = getLocalData();
    
    const rootCause: RootCause = {
      id: `rc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: newRootCause.name,
      category: newRootCause.category,
      description: newRootCause.description,
      visual_indicators: newRootCause.visual_indicators.filter(vi => vi.trim()),
      standard_root_cause: newRootCause.description,
      standard_solutions: newRootCause.standard_solutions.filter(s => s.trim()),
      standard_recommendations: newRootCause.standard_solutions.filter(s => s.trim()).map(s => `Consider: ${s}`),
      products: [],
      confidence_threshold: 0.7,
      success_rate: 0.8,
      case_count: 0,
      seasonal_factors: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (!localData.root_causes) {
      localData.root_causes = [];
    }
    localData.root_causes.push(rootCause);
    saveLocalData(localData);
    
    loadData();
    setShowCreateForm(false);
    setNewRootCause({
      name: '',
      category: 'environmental',
      description: '',
      visual_indicators: [''],
      standard_solutions: [''],
      products: []
    });
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this root cause?')) {
      const localData = getLocalData();
      if (localData.root_causes) {
        localData.root_causes = localData.root_causes.filter(rc => rc.id !== id);
        saveLocalData(localData);
        loadData();
      }
    }
  };

  const addArrayField = (field: 'visual_indicators' | 'standard_solutions') => {
    setNewRootCause(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const updateArrayField = (field: 'visual_indicators' | 'standard_solutions', index: number, value: string) => {
    setNewRootCause(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const removeArrayField = (field: 'visual_indicators' | 'standard_solutions', index: number) => {
    setNewRootCause(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const addEditArrayField = (field: 'visual_indicators' | 'standard_solutions') => {
    setEditForm(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const updateEditArrayField = (field: 'visual_indicators' | 'standard_solutions', index: number, value: string) => {
    setEditForm(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const removeEditArrayField = (field: 'visual_indicators' | 'standard_solutions', index: number) => {
    setEditForm(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'disease': return 'bg-red-100 text-red-800';
      case 'pest': return 'bg-orange-100 text-orange-800';
      case 'weed': return 'bg-yellow-100 text-yellow-800';
      case 'environmental': return 'bg-blue-100 text-blue-800';
      case 'maintenance': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getScheduleCount = (rootCauseId: string) => {
    return treatmentSchedules.filter(schedule => schedule.root_cause_id === rootCauseId).length;
  };

  const formatConfidence = (value: number | undefined): string => {
    if (value === undefined || isNaN(value)) return '0%';
    return `${Math.round(value * 100)}%`;
  };

  const formatSuccessRate = (value: number | undefined): string => {
    if (value === undefined || isNaN(value)) return '0%';
    return `${Math.round(value * 100)}%`;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Database className="w-8 h-8 text-green-400" />
            <div>
              <h2 className="text-2xl font-bold text-white">Root Cause Manager</h2>
              <p className="text-gray-400 mt-1">Manage diagnostic categories and treatment protocols</p>
            </div>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Root Cause</span>
          </button>
        </div>
      </div>

      {/* Root Causes List */}
      <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-6">Root Causes Database</h3>
        
        {rootCauses.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Database className="w-8 h-8 text-gray-500" />
            </div>
            <h4 className="text-lg font-medium text-gray-300 mb-2">No Root Causes Found</h4>
            <p className="text-gray-500">Run AI Analysis to generate root causes from your data, or add them manually.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {rootCauses.map((rootCause) => (
              <div key={rootCause.id} className="p-4 bg-gray-700 rounded-lg">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="text-lg font-medium text-white">{rootCause.name}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(rootCause.category)}`}>
                        {rootCause.category}
                      </span>
                      <span className="px-2 py-1 bg-gray-600 text-gray-300 text-xs rounded-full">
                        {getScheduleCount(rootCause.id)} schedules
                      </span>
                    </div>
                    <p className="text-gray-300 mb-2">{rootCause.description}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-400">
                      <span>Confidence: {formatConfidence(rootCause.confidence_threshold)}</span>
                      <span>Cases: {rootCause.case_count || 0}</span>
                      <span>Success: {formatSuccessRate(rootCause.success_rate)}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setShowAIDocumentation(rootCause)}
                      className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Brain className="w-4 h-4" />
                      <span>AI Data</span>
                    </button>
                    <button
                      onClick={() => setSelectedRootCause(rootCause)}
                      className="flex items-center space-x-1 px-3 py-1.5 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View</span>
                    </button>
                    <button
                      onClick={() => setEditingRootCause(rootCause)}
                      className="flex items-center space-x-1 px-3 py-1.5 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDelete(rootCause.id)}
                      className="flex items-center space-x-1 px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>

                {/* Visual Indicators */}
                {rootCause.visual_indicators.length > 0 && (
                  <div className="mt-3">
                    <h5 className="text-sm font-medium text-gray-300 mb-2">Visual Indicators:</h5>
                    <div className="flex flex-wrap gap-2">
                      {rootCause.visual_indicators.map((indicator, idx) => (
                        <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {indicator}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Products */}
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="text-sm font-medium text-gray-300">Recommended Products ({rootCause.products?.length || 0})</h5>
                    <button className="flex items-center space-x-1 text-green-400 hover:text-green-300 text-sm">
                      <Plus className="w-4 h-4" />
                      <span>Add Product</span>
                    </button>
                  </div>
                  {rootCause.products && rootCause.products.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {rootCause.products.slice(0, 2).map((product, idx) => (
                        <div key={idx} className="p-2 bg-gray-600 rounded text-xs">
                          <div className="font-medium text-white">{product.name}</div>
                          <div className="text-gray-400">{product.category} • {product.price_range}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No products added yet</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AI Documentation Modal */}
      {showAIDocumentation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <Brain className="w-6 h-6 text-blue-400" />
                  <h3 className="text-xl font-bold text-white">AI Documentation</h3>
                </div>
                <button
                  onClick={() => setShowAIDocumentation(null)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Basic Info */}
                <div className="bg-gray-700 rounded-lg p-4">
                  <h4 className="text-lg font-medium text-white mb-3">{showAIDocumentation.name}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Category:</span>
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs ${getCategoryColor(showAIDocumentation.category)}`}>
                        {showAIDocumentation.category}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">Confidence:</span>
                      <span className="ml-2 text-white">{formatConfidence(showAIDocumentation.confidence_threshold)}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Success Rate:</span>
                      <span className="ml-2 text-white">{formatSuccessRate(showAIDocumentation.success_rate)}</span>
                    </div>
                  </div>
                </div>

                {/* AI Generated Data */}
                <div className="bg-gray-700 rounded-lg p-4">
                  <h4 className="text-md font-medium text-white mb-3 flex items-center space-x-2">
                    <Code className="w-5 h-5 text-blue-400" />
                    <span>AI Generated Analysis</span>
                  </h4>
                  
                  <div className="space-y-4">
                    {/* Standard Root Cause */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Standard Root Cause</label>
                      <div className="bg-gray-600 rounded-lg p-3">
                        <p className="text-gray-200 text-sm">{showAIDocumentation.standard_root_cause}</p>
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">AI Description</label>
                      <div className="bg-gray-600 rounded-lg p-3">
                        <p className="text-gray-200 text-sm">{showAIDocumentation.description}</p>
                      </div>
                    </div>

                    {/* Visual Indicators */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">AI Identified Visual Indicators</label>
                      <div className="bg-gray-600 rounded-lg p-3">
                        {showAIDocumentation.visual_indicators.length > 0 ? (
                          <ul className="space-y-1">
                            {showAIDocumentation.visual_indicators.map((indicator, idx) => (
                              <li key={idx} className="flex items-center space-x-2 text-sm text-gray-200">
                                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                                <span>{indicator}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-gray-400 text-sm">No visual indicators documented</p>
                        )}
                      </div>
                    </div>

                    {/* Standard Solutions */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">AI Generated Solutions</label>
                      <div className="bg-gray-600 rounded-lg p-3">
                        {showAIDocumentation.standard_solutions.length > 0 ? (
                          <ul className="space-y-1">
                            {showAIDocumentation.standard_solutions.map((solution, idx) => (
                              <li key={idx} className="flex items-center space-x-2 text-sm text-gray-200">
                                <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                                <span>{solution}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-gray-400 text-sm">No solutions documented</p>
                        )}
                      </div>
                    </div>

                    {/* Standard Recommendations */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">AI Recommendations</label>
                      <div className="bg-gray-600 rounded-lg p-3">
                        {showAIDocumentation.standard_recommendations.length > 0 ? (
                          <ul className="space-y-1">
                            {showAIDocumentation.standard_recommendations.map((rec, idx) => (
                              <li key={idx} className="flex items-center space-x-2 text-sm text-gray-200">
                                <div className="w-1.5 h-1.5 bg-purple-400 rounded-full"></div>
                                <span>{rec}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-gray-400 text-sm">No recommendations documented</p>
                        )}
                      </div>
                    </div>

                    {/* Seasonal Factors */}
                    {showAIDocumentation.seasonal_factors.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Seasonal Factors</label>
                        <div className="bg-gray-600 rounded-lg p-3">
                          <div className="flex flex-wrap gap-2">
                            {showAIDocumentation.seasonal_factors.map((factor, idx) => (
                              <span key={idx} className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                                {factor}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Metadata */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">AI Metadata</label>
                      <div className="bg-gray-600 rounded-lg p-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-400">Case Count:</span>
                            <span className="ml-2 text-white">{showAIDocumentation.case_count || 0}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">Confidence Threshold:</span>
                            <span className="ml-2 text-white">{formatConfidence(showAIDocumentation.confidence_threshold)}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">Created:</span>
                            <span className="ml-2 text-white">{new Date(showAIDocumentation.created_at).toLocaleDateString()}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">Last Updated:</span>
                            <span className="ml-2 text-white">{new Date(showAIDocumentation.updated_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Products */}
                    {showAIDocumentation.products && showAIDocumentation.products.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">AI Recommended Products</label>
                        <div className="bg-gray-600 rounded-lg p-3">
                          <div className="space-y-2">
                            {showAIDocumentation.products.map((product, idx) => (
                              <div key={idx} className="p-2 bg-gray-500 rounded text-sm">
                                <div className="font-medium text-white">{product.name}</div>
                                <div className="text-gray-300">{product.category}</div>
                                <div className="text-gray-400 text-xs">{product.description}</div>
                                <div className="flex items-center justify-between mt-1">
                                  <span className="text-gray-300">{product.price_range}</span>
                                  <span className="text-yellow-400">★ {product.effectiveness_rating}/5</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Raw JSON Data */}
                <div className="mt-6 border-t border-gray-600 pt-4">
                  <details>
                    <summary className="text-sm font-medium text-gray-300 cursor-pointer hover:text-white">
                      View Raw AI Data (JSON)
                    </summary>
                    <div className="mt-3 bg-gray-900 rounded-lg p-3 overflow-auto">
                      <pre className="text-xs text-gray-300 whitespace-pre-wrap">
                        {JSON.stringify(showAIDocumentation, null, 2)}
                      </pre>
                    </div>
                  </details>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Root Cause Modal */}
      {selectedRootCause && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Root Cause Details</h3>
                <button
                  onClick={() => setSelectedRootCause(null)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-medium text-white mb-2">{selectedRootCause.name}</h4>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(selectedRootCause.category)}`}>
                    {selectedRootCause.category}
                  </span>
                </div>

                <div>
                  <h5 className="text-sm font-medium text-gray-300 mb-2">Description</h5>
                  <p className="text-gray-200">{selectedRootCause.description}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h5 className="text-sm font-medium text-gray-300 mb-2">Visual Indicators</h5>
                    <ul className="text-sm text-gray-200 space-y-1">
                      {selectedRootCause.visual_indicators.map((indicator, idx) => (
                        <li key={idx} className="flex items-center space-x-2">
                          <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                          <span>{indicator}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h5 className="text-sm font-medium text-gray-300 mb-2">Standard Solutions</h5>
                    <ul className="text-sm text-gray-200 space-y-1">
                      {selectedRootCause.standard_solutions.map((solution, idx) => (
                        <li key={idx} className="flex items-center space-x-2">
                          <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                          <span>{solution}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="bg-gray-700 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-white">{formatConfidence(selectedRootCause.confidence_threshold)}</div>
                    <div className="text-gray-400">Confidence</div>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-white">{selectedRootCause.case_count || 0}</div>
                    <div className="text-gray-400">Cases</div>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-white">{formatSuccessRate(selectedRootCause.success_rate)}</div>
                    <div className="text-gray-400">Success</div>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-white">{getScheduleCount(selectedRootCause.id)}</div>
                    <div className="text-gray-400">Schedules</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Root Cause Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Create New Root Cause</h3>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Name *
                    </label>
                    <input
                      type="text"
                      value={newRootCause.name}
                      onChange={(e) => setNewRootCause(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="e.g., Brown Patch Disease"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Category *
                    </label>
                    <select
                      value={newRootCause.category}
                      onChange={(e) => setNewRootCause(prev => ({ ...prev, category: e.target.value as any }))}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="disease">Disease</option>
                      <option value="pest">Pest</option>
                      <option value="weed">Weed</option>
                      <option value="environmental">Environmental</option>
                      <option value="maintenance">Maintenance</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={newRootCause.description}
                    onChange={(e) => setNewRootCause(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    rows={3}
                    placeholder="Describe the root cause and its characteristics..."
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-300">
                      Visual Indicators
                    </label>
                    <button
                      onClick={() => addArrayField('visual_indicators')}
                      className="text-green-400 hover:text-green-300 text-sm"
                    >
                      + Add Indicator
                    </button>
                  </div>
                  {newRootCause.visual_indicators.map((indicator, index) => (
                    <div key={index} className="flex items-center space-x-2 mb-2">
                      <input
                        type="text"
                        value={indicator}
                        onChange={(e) => updateArrayField('visual_indicators', index, e.target.value)}
                        className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="e.g., Circular brown patches with dark edges"
                      />
                      {newRootCause.visual_indicators.length > 1 && (
                        <button
                          onClick={() => removeArrayField('visual_indicators', index)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-300">
                      Standard Solutions
                    </label>
                    <button
                      onClick={() => addArrayField('standard_solutions')}
                      className="text-green-400 hover:text-green-300 text-sm"
                    >
                      + Add Solution
                    </button>
                  </div>
                  {newRootCause.standard_solutions.map((solution, index) => (
                    <div key={index} className="flex items-center space-x-2 mb-2">
                      <input
                        type="text"
                        value={solution}
                        onChange={(e) => updateArrayField('standard_solutions', index, e.target.value)}
                        className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="e.g., Apply fungicide containing propiconazole"
                      />
                      {newRootCause.standard_solutions.length > 1 && (
                        <button
                          onClick={() => removeArrayField('standard_solutions', index)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-700 mt-6">
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>Create Root Cause</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Root Cause Modal */}
      {editingRootCause && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Edit Root Cause</h3>
                <button
                  onClick={handleCancelEdit}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Name *
                    </label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="e.g., Brown Patch Disease"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Category *
                    </label>
                    <select
                      value={editForm.category}
                      onChange={(e) => setEditForm(prev => ({ ...prev, category: e.target.value as any }))}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="disease">Disease</option>
                      <option value="pest">Pest</option>
                      <option value="weed">Weed</option>
                      <option value="environmental">Environmental</option>
                      <option value="maintenance">Maintenance</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    rows={3}
                    placeholder="Describe the root cause and its characteristics..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Confidence Threshold
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="1"
                      step="0.1"
                      value={editForm.confidence_threshold}
                      onChange={(e) => setEditForm(prev => ({ ...prev, confidence_threshold: parseFloat(e.target.value) }))}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Success Rate
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="1"
                      step="0.1"
                      value={editForm.success_rate}
                      onChange={(e) => setEditForm(prev => ({ ...prev, success_rate: parseFloat(e.target.value) }))}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-300">
                      Visual Indicators
                    </label>
                    <button
                      onClick={() => addEditArrayField('visual_indicators')}
                      className="text-green-400 hover:text-green-300 text-sm"
                    >
                      + Add Indicator
                    </button>
                  </div>
                  {editForm.visual_indicators.map((indicator, index) => (
                    <div key={index} className="flex items-center space-x-2 mb-2">
                      <input
                        type="text"
                        value={indicator}
                        onChange={(e) => updateEditArrayField('visual_indicators', index, e.target.value)}
                        className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="e.g., Circular brown patches with dark edges"
                      />
                      {editForm.visual_indicators.length > 1 && (
                        <button
                          onClick={() => removeEditArrayField('visual_indicators', index)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-300">
                      Standard Solutions
                    </label>
                    <button
                      onClick={() => addEditArrayField('standard_solutions')}
                      className="text-green-400 hover:text-green-300 text-sm"
                    >
                      + Add Solution
                    </button>
                  </div>
                  {editForm.standard_solutions.map((solution, index) => (
                    <div key={index} className="flex items-center space-x-2 mb-2">
                      <input
                        type="text"
                        value={solution}
                        onChange={(e) => updateEditArrayField('standard_solutions', index, e.target.value)}
                        className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="e.g., Apply fungicide containing propiconazole"
                      />
                      {editForm.standard_solutions.length > 1 && (
                        <button
                          onClick={() => removeEditArrayField('standard_solutions', index)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-700 mt-6">
                <button
                  onClick={handleCancelEdit}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RootCauseManager;