import React, { useState, useEffect } from 'react';
import { getLocalData, saveLocalData } from '../utils/localStorage';
import { RootCause, TreatmentSchedule, TreatmentScheduleStep } from '../types';
import {
  Database,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Clock,
  Target,
  Leaf,
  Brain,
  Eye,
  ChevronRight,
  Award,
  RefreshCw,
  Download,
  Search,
  Filter,
  ExternalLink,
  Bug,
  Droplets,
  Scissors,
  HelpCircle
} from 'lucide-react';

const RootCauseManager: React.FC = () => {
  const [rootCauses, setRootCauses] = useState<RootCause[]>([]);
  const [filteredRootCauses, setFilteredRootCauses] = useState<RootCause[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [treatmentSchedules, setTreatmentSchedules] = useState<TreatmentSchedule[]>([]);
  const [selectedRootCause, setSelectedRootCause] = useState<RootCause | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'schedules'>('overview');
  const [isSyncing, setIsSyncing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [dynamicCategories, setDynamicCategories] = useState<Array<{
    id: string;
    name: string;
    icon: React.ReactNode;
    color: string;
    count: number;
  }>>([]);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [editingRootCause, setEditingRootCause] = useState<RootCause | null>(null);
  const [editingSchedule, setEditingSchedule] = useState<TreatmentSchedule | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const [formData, setFormData] = useState({
    name: '',
    category: 'disease' as RootCause['category'],
    description: '',
    visual_indicators: [''],
    standard_solutions: [''],
    standard_recommendations: [''],
    confidence_threshold: 0.7,
    seasonal_factors: ['']
  });

  const [scheduleFormData, setScheduleFormData] = useState({
    name: '',
    description: '',
    total_duration: '',
    difficulty_level: 'intermediate' as 'beginner' | 'intermediate' | 'expert',
    steps: [] as TreatmentScheduleStep[],
    success_indicators: ['']
  });

  useEffect(() => {
    loadRootCauses();
    
    // Listen for storage changes (cross-tab sync)
    const handleStorageChange = () => {
      loadRootCauses();
    };
    
    // Listen for custom events (same-tab updates)
    const handleRootCausesUpdate = () => {
      loadRootCauses();
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('rootCausesUpdated', handleRootCausesUpdate);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('rootCausesUpdated', handleRootCausesUpdate);
    };
  }, []);

  // Filter root causes when data or filters change
  useEffect(() => {
    let filtered = rootCauses;
    
    // Apply category filter
    if (activeFilter !== 'all') {
      filtered = filtered.filter(rc => rc.category === activeFilter);
    }
    
    // Apply search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(rc => 
        rc.name.toLowerCase().includes(search) ||
        rc.description.toLowerCase().includes(search) ||
        rc.visual_indicators.some(vi => vi.toLowerCase().includes(search))
      );
    }
    
    setFilteredRootCauses(filtered);
  }, [rootCauses, activeFilter, searchTerm]);

  // Auto-refresh when localStorage changes (new root causes added from other components)
  useEffect(() => {
    const handleStorageChange = () => {
      console.log('Storage changed, reloading root causes...');
      loadRootCauses();
    };

    // Listen for storage events (when other tabs/components modify localStorage)
    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom events when localStorage is modified in the same tab
    window.addEventListener('rootCausesUpdated', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('rootCausesUpdated', handleStorageChange);
    };
  }, []);

  const loadRootCauses = () => {
    setIsLoading(true);
    const localData = getLocalData();
    const causes = localData.root_causes || [];
    
    // Generate dynamic categories from actual root causes
    generateDynamicCategories(causes);
    const schedules = localData.treatment_schedules || [];
    setRootCauses(causes);
    setTreatmentSchedules(schedules);
    setIsLoading(false);
    console.log('Root causes loaded:', causes.length);
  };

  const generateDynamicCategories = (rootCauses: any[]) => {
    // Count root causes by category
    const categoryCounts: { [key: string]: number } = {};
    rootCauses.forEach(rc => {
      const category = rc.category || 'other';
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });

    // Create dynamic category buttons
    const categories = Object.entries(categoryCounts).map(([category, count]) => {
      const categoryInfo = getCategoryInfo(category);
      return {
        id: category,
        name: categoryInfo.name,
        icon: categoryInfo.icon,
        color: categoryInfo.color,
        count
      };
    });

    // Sort by count (descending) then by name
    categories.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
    
    setDynamicCategories(categories);
  };

  const getCategoryInfo = (category: string) => {
    const categoryMap: { [key: string]: { name: string; icon: React.ReactNode; color: string } } = {
      'pest': {
        name: 'Grubs & Insects',
        icon: <Bug className="w-4 h-4" />,
        color: 'bg-red-100 text-red-800 border-red-200'
      },
      'environmental': {
        name: 'Environmental',
        icon: <Droplets className="w-4 h-4" />,
        color: 'bg-blue-100 text-blue-800 border-blue-200'
      },
      'disease': {
        name: 'Fungal Disease',
        icon: <AlertTriangle className="w-4 h-4" />,
        color: 'bg-purple-100 text-purple-800 border-purple-200'
      },
      'weed': {
        name: 'Weeds',
        icon: <Leaf className="w-4 h-4" />,
        color: 'bg-green-100 text-green-800 border-green-200'
      },
      'maintenance': {
        name: 'Mowing Damage',
        icon: <Scissors className="w-4 h-4" />,
        color: 'bg-orange-100 text-orange-800 border-orange-200'
      },
      'other': {
        name: 'Other Issues',
        icon: <HelpCircle className="w-4 h-4" />,
        color: 'bg-gray-100 text-gray-800 border-gray-200'
      }
    };

    return categoryMap[category] || categoryMap['other'];
  };

  const handleSaveRootCause = () => {
    const localData = getLocalData();
    if (!localData.root_causes) {
      localData.root_causes = [];
    }

    const rootCause: RootCause = {
      id: editingRootCause?.id || `rc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: formData.name,
      category: formData.category,
      description: formData.description,
      visual_indicators: formData.visual_indicators.filter(vi => vi.trim()),
      standard_root_cause: formData.description,
      standard_solutions: formData.standard_solutions.filter(s => s.trim()),
      standard_recommendations: formData.standard_recommendations.filter(r => r.trim()),
      products: [],
      confidence_threshold: formData.confidence_threshold,
      success_rate: 0.8,
      case_count: 0,
      seasonal_factors: formData.seasonal_factors.filter(sf => sf.trim()),
      created_at: editingRootCause?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (editingRootCause) {
      const index = localData.root_causes.findIndex(rc => rc.id === editingRootCause.id);
      if (index !== -1) {
        localData.root_causes[index] = rootCause;
      }
    } else {
      localData.root_causes.push(rootCause);
    }

    saveLocalData(localData);
    loadRootCauses();
    resetForm();
  };

  const handleSaveSchedule = () => {
    const localData = getLocalData();
    if (!localData.treatment_schedules) {
      localData.treatment_schedules = [];
    }

    if (!selectedRootCause) {
      alert('Please select a root cause first');
      return;
    }

    const schedule: TreatmentSchedule = {
      id: editingSchedule?.id || `schedule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      root_cause_id: selectedRootCause.id,
      name: scheduleFormData.name,
      description: scheduleFormData.description,
      total_duration: scheduleFormData.total_duration,
      difficulty_level: scheduleFormData.difficulty_level,
      steps: scheduleFormData.steps.map((step, index) => ({
        ...step,
        step_number: index + 1
      })),
      success_indicators: scheduleFormData.success_indicators.filter(si => si.trim()),
      created_at: editingSchedule?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (editingSchedule) {
      const index = localData.treatment_schedules.findIndex(s => s.id === editingSchedule.id);
      if (index !== -1) {
        localData.treatment_schedules[index] = schedule;
      }
    } else {
      localData.treatment_schedules.push(schedule);
    }

    saveLocalData(localData);
    loadRootCauses();
    resetScheduleForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'disease',
      description: '',
      visual_indicators: [''],
      standard_solutions: [''],
      standard_recommendations: [''],
      confidence_threshold: 0.7,
      seasonal_factors: ['']
    });
    setEditingRootCause(null);
    setShowForm(false);
  };

  const resetScheduleForm = () => {
    setScheduleFormData({
      name: '',
      description: '',
      total_duration: '',
      difficulty_level: 'intermediate',
      steps: [],
      success_indicators: ['']
    });
    setEditingSchedule(null);
    setShowScheduleForm(false);
  };

  const handleEditRootCause = (rootCause: RootCause) => {
    setFormData({
      name: rootCause.name,
      category: rootCause.category,
      description: rootCause.description,
      visual_indicators: rootCause.visual_indicators.length > 0 ? rootCause.visual_indicators : [''],
      standard_solutions: rootCause.standard_solutions.length > 0 ? rootCause.standard_solutions : [''],
      standard_recommendations: rootCause.standard_recommendations.length > 0 ? rootCause.standard_recommendations : [''],
      confidence_threshold: rootCause.confidence_threshold,
      seasonal_factors: rootCause.seasonal_factors.length > 0 ? rootCause.seasonal_factors : ['']
    });
    setEditingRootCause(rootCause);
    setShowForm(true);
  };

  const handleDeleteRootCause = (id: string) => {
    if (confirm('Are you sure you want to delete this root cause?')) {
      const localData = getLocalData();
      localData.root_causes = localData.root_causes?.filter(rc => rc.id !== id) || [];
      // Also delete associated schedules
      localData.treatment_schedules = localData.treatment_schedules?.filter(s => s.root_cause_id !== id) || [];
      saveLocalData(localData);
      loadRootCauses();
      if (selectedRootCause?.id === id) {
        setSelectedRootCause(null);
      }
    }
  };

  const handleDeleteSchedule = (id: string) => {
    if (confirm('Are you sure you want to delete this treatment schedule?')) {
      const localData = getLocalData();
      localData.treatment_schedules = localData.treatment_schedules?.filter(s => s.id !== id) || [];
      saveLocalData(localData);
      loadRootCauses();
    }
  };

  const addArrayField = (field: string, value: string = '') => {
    setFormData(prev => ({
      ...prev,
      [field]: [...(prev[field] as string[]), value]
    }));
  };

  const updateArrayField = (field: string, index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field] as string[]).map((item, i) => i === index ? value : item)
    }));
  };

  const removeArrayField = (field: string, index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field] as string[]).filter((_, i) => i !== index)
    }));
  };

  const addScheduleArrayField = (field: string, value: string = '') => {
    setScheduleFormData(prev => ({
      ...prev,
      [field]: [...(prev[field] as string[]), value]
    }));
  };

  const updateScheduleArrayField = (field: string, index: number, value: string) => {
    setScheduleFormData(prev => ({
      ...prev,
      [field]: (prev[field] as string[]).map((item, i) => i === index ? value : item)
    }));
  };

  const removeScheduleArrayField = (field: string, index: number) => {
    setScheduleFormData(prev => ({
      ...prev,
      [field]: (prev[field] as string[]).filter((_, i) => i !== index)
    }));
  };

  const addStep = () => {
    const newStep: TreatmentScheduleStep = {
      id: `step_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      step_number: scheduleFormData.steps.length + 1,
      title: '',
      description: '',
      timing: '',
      season: '',
      products_needed: [],
      notes: '',
      is_critical: false
    };
    setScheduleFormData(prev => ({
      ...prev,
      steps: [...prev.steps, newStep]
    }));
  };

  const updateStep = (index: number, field: string, value: any) => {
    setScheduleFormData(prev => ({
      ...prev,
      steps: prev.steps.map((step, i) => 
        i === index ? { ...step, [field]: value } : step
      )
    }));
  };

  const removeStep = (index: number) => {
    setScheduleFormData(prev => ({
      ...prev,
      steps: prev.steps.filter((_, i) => i !== index).map((step, i) => ({
        ...step,
        step_number: i + 1
      }))
    }));
  };

  const getSchedulesForRootCause = (rootCauseId: string) => {
    return treatmentSchedules.filter(schedule => schedule.root_cause_id === rootCauseId);
  };

  const getCategoryColor = (category: string) => {
    const categoryInfo = getCategoryInfo(category);
    return categoryInfo.color;
  };

  const getDifficultyColor = (difficulty: string) => {
    const colorMap: { [key: string]: string } = {
      'beginner': 'bg-green-100 text-green-800',
      'intermediate': 'bg-yellow-100 text-yellow-800',
      'expert': 'bg-red-100 text-red-800'
    };
    return colorMap[difficulty] || 'bg-gray-100 text-gray-800';
  };

  const handleOpenScheduleForm = (rootCause: RootCause) => {
    setSelectedRootCause(rootCause);
    setShowScheduleForm(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Root Cause Manager</h2>
          <p className="text-gray-400">Manage lawn problems and treatment schedules</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Root Cause</span>
          </button>
          <button
            onClick={loadRootCauses}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search root causes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Dynamic category filters */}
          {dynamicCategories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
                selectedCategory === category.id
                  ? category.color
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {category.icon}
              <span className="font-medium">{category.name}</span>
              <span className={`px-2 py-0.5 text-xs rounded-full ${
                selectedCategory === category.id
                  ? 'bg-white bg-opacity-50'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {category.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Root Causes List */}
      <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-6">Root Causes ({rootCauses.length})</h3>
        
        {rootCauses.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Database className="w-8 h-8 text-gray-500" />
            </div>
            <h4 className="text-lg font-medium text-gray-300 mb-2">No Root Causes</h4>
            <p className="text-gray-500 mb-4">Create your first root cause to start building treatment schedules.</p>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors mx-auto"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Create First Root Cause</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {rootCauses.map((rootCause) => {
              const schedules = getSchedulesForRootCause(rootCause.id);
              return (
                <div key={rootCause.id} className="p-4 bg-gray-700 rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="text-lg font-medium text-white">{rootCause.name}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(rootCause.category)}`}>
                          {rootCause.category}
                        </span>
                        <span className="text-sm text-gray-400">
                          {schedules.length} schedule{schedules.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <p className="text-gray-300 mb-2">{rootCause.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-400">
                        <span>Confidence: {Math.round(rootCause.confidence_threshold * 100)}%</span>
                        <span>Cases: {rootCause.case_count}</span>
                        <span>Success: {Math.round(rootCause.success_rate * 100)}%</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {schedules.length > 0 ? (
                        <button
                          onClick={() => handleOpenScheduleForm(rootCause)}
                          className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Add Schedule</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleOpenScheduleForm(rootCause)}
                          className="flex items-center space-x-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <Calendar className="w-4 h-4" />
                          <span>Create First Schedule</span>
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedRootCause(rootCause)}
                        className="flex items-center space-x-1 px-3 py-1.5 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        <span>View</span>
                      </button>
                      <button
                        onClick={() => handleEditRootCause(rootCause)}
                        className="flex items-center space-x-1 px-3 py-1.5 bg-yellow-600 text-white text-sm rounded-lg hover:bg-yellow-700 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDeleteRootCause(rootCause.id)}
                        className="flex items-center space-x-1 px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>

                  {/* Show schedules for this root cause */}
                  {schedules.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-600">
                      <h5 className="text-sm font-medium text-gray-300 mb-3">Treatment Schedules:</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {schedules.map((schedule) => (
                          <div key={schedule.id} className="p-3 bg-gray-600 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <h6 className="font-medium text-white">{schedule.name}</h6>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(schedule.difficulty_level)}`}>
                                {schedule.difficulty_level}
                              </span>
                            </div>
                            <p className="text-sm text-gray-300 mb-2">{schedule.description}</p>
                            <div className="flex items-center justify-between text-xs text-gray-400">
                              <span>{schedule.steps.length} steps</span>
                              <span>{schedule.total_duration}</span>
                              <div className="flex space-x-1">
                                <button
                                  onClick={() => {
                                    setEditingSchedule(schedule);
                                    setScheduleFormData({
                                      name: schedule.name,
                                      description: schedule.description,
                                      total_duration: schedule.total_duration,
                                      difficulty_level: schedule.difficulty_level,
                                      steps: schedule.steps,
                                      success_indicators: schedule.success_indicators
                                    });
                                    setSelectedRootCause(rootCause);
                                    setShowScheduleForm(true);
                                  }}
                                  className="text-blue-400 hover:text-blue-300"
                                >
                                  <Edit className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => handleDeleteSchedule(schedule.id)}
                                  className="text-red-400 hover:text-red-300"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Root Cause Detail Modal */}
      {selectedRootCause && !showScheduleForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">{selectedRootCause.name}</h3>
                <button
                  onClick={() => setSelectedRootCause(null)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex space-x-1 mb-6">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'overview'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('schedules')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'schedules'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Treatment Schedules ({getSchedulesForRootCause(selectedRootCause.id).length})
                </button>
              </div>

              {/* Tab Content */}
              {activeTab === 'overview' && (
                <div className="p-6 space-y-6">
                  {/* Row: category/sub/threshold/success */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Category</label>
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(selectedRootCause.category)}`}>
                        {selectedRootCause.category}
                      </span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Confidence Threshold</label>
                      <p className="text-white">{Math.round(selectedRootCause.confidence_threshold * 100)}%</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Success Rate</label>
                      <p className="text-white">{Math.round(selectedRootCause.success_rate * 100)}%</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Case Count</label>
                      <p className="text-white">{selectedRootCause.case_count}</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Description</label>
                    <p className="text-white bg-gray-700 p-3 rounded-lg">{selectedRootCause.description}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Visual Indicators</label>
                      <ul className="space-y-1">
                        {selectedRootCause.visual_indicators.map((indicator, idx) => (
                          <li key={idx} className="flex items-center space-x-2 text-white">
                            <CheckCircle className="w-4 h-4 text-green-400" />
                            <span>{indicator}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Standard Solutions</label>
                      <ul className="space-y-1">
                        {selectedRootCause.standard_solutions.map((solution, idx) => (
                          <li key={idx} className="flex items-center space-x-2 text-white">
                            <Target className="w-4 h-4 text-blue-400" />
                            <span>{solution}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {selectedRootCause.seasonal_factors.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Seasonal Factors</label>
                      <div className="flex flex-wrap gap-2">
                        {selectedRootCause.seasonal_factors.map((factor, idx) => (
                          <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                            {factor}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'schedules' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-semibold text-white">Treatment Schedules</h4>
                    <button
                      onClick={() => handleOpenScheduleForm(selectedRootCause)}
                      className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Schedule</span>
                    </button>
                  </div>

                  {getSchedulesForRootCause(selectedRootCause.id).length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Calendar className="w-8 h-8 text-gray-500" />
                      </div>
                      <h4 className="text-lg font-medium text-gray-300 mb-2">No Treatment Schedules</h4>
                      <p className="text-gray-500 mb-4">Create a step-by-step treatment plan for this root cause.</p>
                      <button
                        onClick={() => handleOpenScheduleForm(selectedRootCause)}
                        className="flex items-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors mx-auto"
                      >
                        <Calendar className="w-5 h-5" />
                        <span>Create First Schedule</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {getSchedulesForRootCause(selectedRootCause.id).map((schedule) => (
                        <div key={schedule.id} className="p-6 bg-gray-700 rounded-lg">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h5 className="text-xl font-bold text-white">{schedule.name}</h5>
                              <p className="text-gray-300 mt-1">{schedule.description}</p>
                            </div>
                            <div className="flex items-center space-x-3">
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(schedule.difficulty_level)}`}>
                                {schedule.difficulty_level}
                              </span>
                              <span className="text-sm text-gray-400">
                                Duration: {schedule.total_duration}
                              </span>
                            </div>
                          </div>

                          {/* Treatment Steps */}
                          <div className="space-y-4">
                            <h6 className="font-semibold text-gray-300">Treatment Steps:</h6>
                            {schedule.steps.map((step, stepIndex) => (
                              <div key={stepIndex} className="flex items-start space-x-4 p-4 bg-gray-600 rounded-lg">
                                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                                  step.is_critical ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'
                                }`}>
                                  {step.step_number}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center space-x-3 mb-2">
                                    <h6 className="font-semibold text-white">{step.title}</h6>
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
                                  <p className="text-gray-300 mb-3">{step.description}</p>
                                  
                                  {step.products_needed && step.products_needed.length > 0 && (
                                    <div className="mb-2">
                                      <span className="text-sm font-medium text-gray-400">Products needed: </span>
                                      <span className="text-sm text-gray-300">{step.products_needed.join(', ')}</span>
                                    </div>
                                  )}
                                  
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
                          {schedule.success_indicators.length > 0 && (
                            <div className="mt-6 p-4 bg-green-50 rounded-lg">
                              <h6 className="font-semibold text-green-900 mb-3">Signs of Success:</h6>
                              <ul className="space-y-1">
                                {schedule.success_indicators.map((indicator, idx) => (
                                  <li key={idx} className="flex items-center space-x-2 text-green-800">
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                    <span className="text-sm">{indicator}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          <div className="flex items-center justify-end space-x-2 mt-4 pt-4 border-t border-gray-600">
                            <button
                              onClick={() => {
                                setEditingSchedule(schedule);
                                setScheduleFormData({
                                  name: schedule.name,
                                  description: schedule.description,
                                  total_duration: schedule.total_duration,
                                  difficulty_level: schedule.difficulty_level,
                                  steps: schedule.steps,
                                  success_indicators: schedule.success_indicators
                                });
                                setShowScheduleForm(true);
                              }}
                              className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => handleDeleteSchedule(schedule.id)}
                              className="flex items-center space-x-1 px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Root Cause Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">
                  {editingRootCause ? 'Edit Root Cause' : 'Add New Root Cause'}
                </h3>
                <button
                  onClick={resetForm}
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
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="e.g., Brown Patch Disease"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Category *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as RootCause['category'] }))}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="disease">Disease</option>
                      <option value="pest">Pest</option>
                      <option value="environmental">Environmental</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="weed">Weed</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    rows={3}
                    placeholder="Describe the root cause, its symptoms, and characteristics..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Confidence Threshold
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.1"
                    value={formData.confidence_threshold}
                    onChange={(e) => setFormData(prev => ({ ...prev, confidence_threshold: parseFloat(e.target.value) }))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>Low (0.1)</span>
                    <span>Current: {formData.confidence_threshold}</span>
                    <span>High (1.0)</span>
                  </div>
                </div>

                {/* Visual Indicators */}
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
                  {formData.visual_indicators.map((indicator, index) => (
                    <div key={index} className="flex items-center space-x-2 mb-2">
                      <input
                        type="text"
                        value={indicator}
                        onChange={(e) => updateArrayField('visual_indicators', index, e.target.value)}
                        className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="e.g., Circular brown patches with dark edges"
                      />
                      {formData.visual_indicators.length > 1 && (
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

                {/* Standard Solutions */}
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
                  {formData.standard_solutions.map((solution, index) => (
                    <div key={index} className="flex items-center space-x-2 mb-2">
                      <input
                        type="text"
                        value={solution}
                        onChange={(e) => updateArrayField('standard_solutions', index, e.target.value)}
                        className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="e.g., Apply fungicide containing propiconazole"
                      />
                      {formData.standard_solutions.length > 1 && (
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

                {/* Seasonal Factors */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-300">
                      Seasonal Factors
                    </label>
                    <button
                      onClick={() => addArrayField('seasonal_factors')}
                      className="text-green-400 hover:text-green-300 text-sm"
                    >
                      + Add Factor
                    </button>
                  </div>
                  {formData.seasonal_factors.map((factor, index) => (
                    <div key={index} className="flex items-center space-x-2 mb-2">
                      <input
                        type="text"
                        value={factor}
                        onChange={(e) => updateArrayField('seasonal_factors', index, e.target.value)}
                        className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="e.g., Most active in warm, humid conditions"
                      />
                      {formData.seasonal_factors.length > 1 && (
                        <button
                          onClick={() => removeArrayField('seasonal_factors', index)}
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
                  onClick={resetForm}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveRootCause}
                  className="flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingRootCause ? 'Update' : 'Save'} Root Cause</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Form Modal */}
      {showScheduleForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {editingSchedule ? 'Edit Treatment Schedule' : 'Create Treatment Schedule'}
                  </h3>
                  <p className="text-gray-400">
                    For: {selectedRootCause?.name}
                  </p>
                </div>
                <button
                  onClick={resetScheduleForm}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Schedule Name *
                    </label>
                    <input
                      type="text"
                      value={scheduleFormData.name}
                      onChange={(e) => setScheduleFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="e.g., Standard Brown Patch Treatment"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Difficulty Level
                    </label>
                    <select
                      value={scheduleFormData.difficulty_level}
                      onChange={(e) => setScheduleFormData(prev => ({ ...prev, difficulty_level: e.target.value as any }))}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="expert">Expert</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Description *
                    </label>
                    <textarea
                      value={scheduleFormData.description}
                      onChange={(e) => setScheduleFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      rows={3}
                      placeholder="Describe the treatment approach..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Total Duration
                    </label>
                    <input
                      type="text"
                      value={scheduleFormData.total_duration}
                      onChange={(e) => setScheduleFormData(prev => ({ ...prev, total_duration: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="e.g., 4-6 weeks, Full season"
                    />
                  </div>
                </div>

                {/* Treatment Steps */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-white">Treatment Steps</h4>
                    <button
                      onClick={addStep}
                      className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Step</span>
                    </button>
                  </div>

                  {scheduleFormData.steps.length === 0 ? (
                    <div className="text-center py-8 bg-gray-700 rounded-lg">
                      <Calendar className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                      <p className="text-gray-400 mb-4">No steps added yet</p>
                      <button
                        onClick={addStep}
                        className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors mx-auto"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add First Step</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {scheduleFormData.steps.map((step, index) => (
                        <div key={index} className="p-4 bg-gray-700 rounded-lg">
                          <div className="flex items-center justify-between mb-4">
                            <h5 className="font-medium text-white">Step {step.step_number}</h5>
                            <div className="flex items-center space-x-2">
                              <label className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={step.is_critical}
                                  onChange={(e) => updateStep(index, 'is_critical', e.target.checked)}
                                  className="w-4 h-4 text-red-600 border-gray-600 rounded focus:ring-red-500 bg-gray-700"
                                />
                                <span className="text-sm text-gray-300">Critical Step</span>
                              </label>
                              <button
                                onClick={() => removeStep(index)}
                                className="text-red-400 hover:text-red-300"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-400 mb-1">
                                Step Title *
                              </label>
                              <input
                                type="text"
                                value={step.title}
                                onChange={(e) => updateStep(index, 'title', e.target.value)}
                                className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="e.g., Apply Fungicide Treatment"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-400 mb-1">
                                Timing *
                              </label>
                              <input
                                type="text"
                                value={step.timing}
                                onChange={(e) => updateStep(index, 'timing', e.target.value)}
                                className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="e.g., Week 1, Day 3-5, Monthly"
                              />
                            </div>
                          </div>

                          <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-400 mb-1">
                              Description *
                            </label>
                            <textarea
                              value={step.description}
                              onChange={(e) => updateStep(index, 'description', e.target.value)}
                              className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              rows={2}
                              placeholder="Detailed instructions for this step..."
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-400 mb-1">
                                Season (Optional)
                              </label>
                              <select
                                value={step.season || ''}
                                onChange={(e) => updateStep(index, 'season', e.target.value || undefined)}
                                className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              >
                                <option value="">Any Season</option>
                                <option value="Spring">Spring</option>
                                <option value="Summer">Summer</option>
                                <option value="Fall">Fall</option>
                                <option value="Winter">Winter</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-400 mb-1">
                                Products Needed
                              </label>
                              <input
                                type="text"
                                value={(step.products_needed || []).join(', ')}
                                onChange={(e) => updateStep(index, 'products_needed', e.target.value.split(',').map(p => p.trim()).filter(p => p))}
                                className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Product 1, Product 2, Product 3"
                              />
                            </div>
                          </div>

                          <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-400 mb-1">
                              Notes (Optional)
                            </label>
                            <textarea
                              value={step.notes || ''}
                              onChange={(e) => updateStep(index, 'notes', e.target.value || undefined)}
                              className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              rows={2}
                              placeholder="Additional notes, warnings, or tips..."
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Success Indicators */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-300">
                      Success Indicators
                    </label>
                    <button
                      onClick={() => addScheduleArrayField('success_indicators')}
                      className="text-green-400 hover:text-green-300 text-sm"
                    >
                      + Add Indicator
                    </button>
                  </div>
                  {scheduleFormData.success_indicators.map((indicator, index) => (
                    <div key={index} className="flex items-center space-x-2 mb-2">
                      <input
                        type="text"
                        value={indicator}
                        onChange={(e) => updateScheduleArrayField('success_indicators', index, e.target.value)}
                        className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="e.g., New green growth appears, Brown patches stop spreading"
                      />
                      {scheduleFormData.success_indicators.length > 1 && (
                        <button
                          onClick={() => removeScheduleArrayField('success_indicators', index)}
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
                  onClick={resetScheduleForm}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveSchedule}
                  className="flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingSchedule ? 'Update' : 'Save'} Schedule</span>
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