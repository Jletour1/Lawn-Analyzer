import React, { useState, useEffect } from 'react';
import { getLocalData, saveLocalData } from '../utils/localStorage';
import { RootCause, TreatmentSchedule, TreatmentStep, MaintenanceStep } from '../types';
import {
  Database,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  Target,
  Wrench,
  BookOpen,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const RootCauseManager: React.FC = () => {
  const [rootCauses, setRootCauses] = useState<RootCause[]>([]);
  const [selectedRootCause, setSelectedRootCause] = useState<RootCause | null>(null);
  const [showScheduleEditor, setShowScheduleEditor] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<TreatmentSchedule | null>(null);
  const [expandedSchedules, setExpandedSchedules] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadRootCauses();
  }, []);

  const loadRootCauses = () => {
    const localData = getLocalData();
    const causes = localData.root_causes || [];
    setRootCauses(causes);
  };

  const saveRootCauses = (causes: RootCause[]) => {
    const localData = getLocalData();
    localData.root_causes = causes;
    saveLocalData(localData);
    setRootCauses(causes);
  };

  const handleCreateSchedule = (rootCause: RootCause) => {
    const newSchedule: TreatmentSchedule = {
      id: `schedule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      root_cause_id: rootCause.id,
      title: `Treatment Plan for ${rootCause.name}`,
      description: '',
      total_duration: '4-6 weeks',
      difficulty_level: 'intermediate',
      estimated_cost: '$50-100',
      steps: [
        {
          id: `step_${Date.now()}_1`,
          step_number: 1,
          title: 'Initial Assessment',
          description: 'Evaluate the affected area and prepare for treatment',
          timing: 'Day 1',
          duration: '30 minutes',
          difficulty: 'easy',
          required_products: [],
          optional_products: [],
          tools_needed: [],
          detailed_instructions: ['Inspect the affected area thoroughly'],
          tips: []
        }
      ],
      maintenance_schedule: [],
      success_indicators: ['Improved grass color', 'Reduced affected area'],
      warning_signs: ['Spreading damage', 'Worsening symptoms'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    setEditingSchedule(newSchedule);
    setSelectedRootCause(rootCause);
    setShowScheduleEditor(true);
  };

  const handleEditSchedule = (rootCause: RootCause) => {
    if (rootCause.treatment_schedule) {
      setEditingSchedule(rootCause.treatment_schedule);
      setSelectedRootCause(rootCause);
      setShowScheduleEditor(true);
    }
  };

  const handleSaveSchedule = () => {
    if (!editingSchedule || !selectedRootCause) return;

    const updatedCauses = rootCauses.map(cause => {
      if (cause.id === selectedRootCause.id) {
        return {
          ...cause,
          treatment_schedule: {
            ...editingSchedule,
            updated_at: new Date().toISOString()
          }
        };
      }
      return cause;
    });

    saveRootCauses(updatedCauses);
    setShowScheduleEditor(false);
    setEditingSchedule(null);
    setSelectedRootCause(null);
  };

  const handleDeleteSchedule = (rootCauseId: string) => {
    const updatedCauses = rootCauses.map(cause => {
      if (cause.id === rootCauseId) {
        const { treatment_schedule, ...causeWithoutSchedule } = cause;
        return causeWithoutSchedule;
      }
      return cause;
    });

    saveRootCauses(updatedCauses);
  };

  const addTreatmentStep = () => {
    if (!editingSchedule) return;

    const newStep: TreatmentStep = {
      id: `step_${Date.now()}_${editingSchedule.steps.length + 1}`,
      step_number: editingSchedule.steps.length + 1,
      title: `Step ${editingSchedule.steps.length + 1}`,
      description: '',
      timing: `Week ${Math.ceil((editingSchedule.steps.length + 1) / 2)}`,
      duration: '30 minutes',
      difficulty: 'moderate',
      required_products: [],
      optional_products: [],
      tools_needed: [],
      detailed_instructions: [''],
      tips: []
    };

    setEditingSchedule({
      ...editingSchedule,
      steps: [...editingSchedule.steps, newStep]
    });
  };

  const updateTreatmentStep = (stepIndex: number, updatedStep: TreatmentStep) => {
    if (!editingSchedule) return;

    const updatedSteps = editingSchedule.steps.map((step, index) =>
      index === stepIndex ? updatedStep : step
    );

    setEditingSchedule({
      ...editingSchedule,
      steps: updatedSteps
    });
  };

  const removeTreatmentStep = (stepIndex: number) => {
    if (!editingSchedule) return;

    const updatedSteps = editingSchedule.steps.filter((_, index) => index !== stepIndex);
    
    setEditingSchedule({
      ...editingSchedule,
      steps: updatedSteps
    });
  };

  const addMaintenanceStep = () => {
    if (!editingSchedule) return;

    const newMaintenanceStep: MaintenanceStep = {
      id: `maintenance_${Date.now()}_${(editingSchedule.maintenance_schedule?.length || 0) + 1}`,
      title: 'Maintenance Task',
      description: '',
      frequency: 'Weekly',
      timing: 'Ongoing',
      products_needed: [],
      instructions: ['']
    };

    setEditingSchedule({
      ...editingSchedule,
      maintenance_schedule: [...(editingSchedule.maintenance_schedule || []), newMaintenanceStep]
    });
  };

  const toggleScheduleExpansion = (rootCauseId: string) => {
    const newExpanded = new Set(expandedSchedules);
    if (newExpanded.has(rootCauseId)) {
      newExpanded.delete(rootCauseId);
    } else {
      newExpanded.add(rootCauseId);
    }
    setExpandedSchedules(newExpanded);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
      case 'easy':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
      case 'moderate':
        return 'bg-yellow-100 text-yellow-800';
      case 'expert':
      case 'difficult':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-6">
        <div className="flex items-center space-x-3">
          <Database className="w-8 h-8 text-blue-400" />
          <div>
            <h2 className="text-2xl font-bold text-white">Root Cause Manager</h2>
            <p className="text-gray-400 mt-1">Manage diagnostic categories and treatment schedules</p>
          </div>
        </div>
      </div>

      {/* Root Causes List */}
      <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-6">Root Causes & Treatment Schedules</h3>
        
        {rootCauses.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Database className="w-8 h-8 text-gray-500" />
            </div>
            <h4 className="text-lg font-medium text-gray-300 mb-2">No Root Causes Found</h4>
            <p className="text-gray-500">Root causes will appear here after running AI analysis or adding manual categories.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {rootCauses.map((rootCause) => (
              <div key={rootCause.id} className="p-4 bg-gray-700 rounded-lg">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="text-lg font-medium text-white">{rootCause.name}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        rootCause.category === 'disease' ? 'bg-red-100 text-red-800' :
                        rootCause.category === 'pest' ? 'bg-orange-100 text-orange-800' :
                        rootCause.category === 'environmental' ? 'bg-blue-100 text-blue-800' :
                        rootCause.category === 'maintenance' ? 'bg-purple-100 text-purple-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {rootCause.category}
                      </span>
                      {rootCause.treatment_schedule && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>Has Schedule</span>
                        </span>
                      )}
                    </div>
                    <p className="text-gray-300 text-sm mb-2">{rootCause.description}</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-400">
                      <span>Cases: {rootCause.case_count}</span>
                      <span>Success: {Math.round(rootCause.success_rate * 100)}%</span>
                      <span>Created: {new Date(rootCause.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {rootCause.treatment_schedule ? (
                      <>
                        <button
                          onClick={() => toggleScheduleExpansion(rootCause.id)}
                          className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          {expandedSchedules.has(rootCause.id) ? (
                            <>
                              <ChevronUp className="w-4 h-4" />
                              <span>Hide Schedule</span>
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-4 h-4" />
                              <span>View Schedule</span>
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleEditSchedule(rootCause)}
                          className="flex items-center space-x-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteSchedule(rootCause.id)}
                          className="flex items-center space-x-1 px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Delete</span>
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleCreateSchedule(rootCause)}
                        className="flex items-center space-x-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Schedule</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded Schedule View */}
                {rootCause.treatment_schedule && expandedSchedules.has(rootCause.id) && (
                  <div className="mt-4 p-4 bg-gray-600 rounded-lg">
                    <div className="flex items-center space-x-3 mb-4">
                      <Calendar className="w-5 h-5 text-blue-400" />
                      <h5 className="text-lg font-medium text-white">{rootCause.treatment_schedule.title}</h5>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="text-sm">
                        <span className="text-gray-400">Duration:</span>
                        <span className="ml-2 text-white">{rootCause.treatment_schedule.total_duration}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-400">Cost:</span>
                        <span className="ml-2 text-white">{rootCause.treatment_schedule.estimated_cost}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-400">Difficulty:</span>
                        <span className={`ml-2 px-2 py-1 rounded-full text-xs ${getDifficultyColor(rootCause.treatment_schedule.difficulty_level)}`}>
                          {rootCause.treatment_schedule.difficulty_level}
                        </span>
                      </div>
                    </div>

                    <p className="text-gray-300 text-sm mb-4">{rootCause.treatment_schedule.description}</p>

                    {/* Treatment Steps */}
                    <div className="space-y-3">
                      <h6 className="text-md font-medium text-white flex items-center space-x-2">
                        <BookOpen className="w-4 h-4" />
                        <span>Treatment Steps</span>
                      </h6>
                      {rootCause.treatment_schedule.steps.map((step, index) => (
                        <div key={step.id} className="p-3 bg-gray-500 rounded-lg">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center space-x-3">
                              <span className="flex items-center justify-center w-6 h-6 bg-blue-600 text-white text-xs rounded-full">
                                {step.step_number}
                              </span>
                              <h7 className="font-medium text-white">{step.title}</h7>
                              <span className="text-xs text-gray-400">{step.timing}</span>
                              <span className={`px-2 py-1 rounded-full text-xs ${getDifficultyColor(step.difficulty)}`}>
                                {step.difficulty}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2 text-xs text-gray-400">
                              <Clock className="w-3 h-3" />
                              <span>{step.duration}</span>
                            </div>
                          </div>
                          <p className="text-gray-300 text-sm mb-2">{step.description}</p>
                          
                          {step.detailed_instructions.length > 0 && (
                            <div className="mb-2">
                              <span className="text-xs font-medium text-gray-400">Instructions:</span>
                              <ul className="text-xs text-gray-300 ml-4 mt-1">
                                {step.detailed_instructions.map((instruction, idx) => (
                                  <li key={idx} className="list-disc">{instruction}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {step.required_products.length > 0 && (
                            <div className="mb-2">
                              <span className="text-xs font-medium text-gray-400">Required Products:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {step.required_products.map((product, idx) => (
                                  <span key={idx} className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                                    {product}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {step.tools_needed.length > 0 && (
                            <div>
                              <span className="text-xs font-medium text-gray-400">Tools:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {step.tools_needed.map((tool, idx) => (
                                  <span key={idx} className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                                    {tool}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Success Indicators */}
                    {rootCause.treatment_schedule.success_indicators.length > 0 && (
                      <div className="mt-4">
                        <h6 className="text-md font-medium text-white flex items-center space-x-2 mb-2">
                          <CheckCircle className="w-4 h-4 text-green-400" />
                          <span>Success Indicators</span>
                        </h6>
                        <ul className="text-sm text-gray-300 space-y-1">
                          {rootCause.treatment_schedule.success_indicators.map((indicator, idx) => (
                            <li key={idx} className="flex items-center space-x-2">
                              <CheckCircle className="w-3 h-3 text-green-400" />
                              <span>{indicator}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Schedule Editor Modal */}
      {showScheduleEditor && editingSchedule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Treatment Schedule Editor</h3>
                <button
                  onClick={() => setShowScheduleEditor(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
                    <input
                      type="text"
                      value={editingSchedule.title}
                      onChange={(e) => setEditingSchedule({...editingSchedule, title: e.target.value})}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Total Duration</label>
                    <input
                      type="text"
                      value={editingSchedule.total_duration}
                      onChange={(e) => setEditingSchedule({...editingSchedule, total_duration: e.target.value})}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., 4-6 weeks"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Difficulty Level</label>
                    <select
                      value={editingSchedule.difficulty_level}
                      onChange={(e) => setEditingSchedule({...editingSchedule, difficulty_level: e.target.value as any})}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="expert">Expert</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Estimated Cost</label>
                    <input
                      type="text"
                      value={editingSchedule.estimated_cost}
                      onChange={(e) => setEditingSchedule({...editingSchedule, estimated_cost: e.target.value})}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., $50-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                  <textarea
                    value={editingSchedule.description}
                    onChange={(e) => setEditingSchedule({...editingSchedule, description: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Overview of the treatment plan..."
                  />
                </div>

                {/* Treatment Steps */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-medium text-white">Treatment Steps</h4>
                    <button
                      onClick={addTreatmentStep}
                      className="flex items-center space-x-2 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Step</span>
                    </button>
                  </div>

                  <div className="space-y-4">
                    {editingSchedule.steps.map((step, stepIndex) => (
                      <div key={step.id} className="p-4 bg-gray-700 rounded-lg">
                        <div className="flex items-center justify-between mb-4">
                          <h5 className="font-medium text-white">Step {step.step_number}</h5>
                          <button
                            onClick={() => removeTreatmentStep(stepIndex)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Title</label>
                            <input
                              type="text"
                              value={step.title}
                              onChange={(e) => updateTreatmentStep(stepIndex, {...step, title: e.target.value})}
                              className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Timing</label>
                            <input
                              type="text"
                              value={step.timing}
                              onChange={(e) => updateTreatmentStep(stepIndex, {...step, timing: e.target.value})}
                              className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="e.g., Week 1, Day 1-3"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Duration</label>
                            <input
                              type="text"
                              value={step.duration}
                              onChange={(e) => updateTreatmentStep(stepIndex, {...step, duration: e.target.value})}
                              className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="e.g., 30 minutes"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Difficulty</label>
                            <select
                              value={step.difficulty}
                              onChange={(e) => updateTreatmentStep(stepIndex, {...step, difficulty: e.target.value as any})}
                              className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="easy">Easy</option>
                              <option value="moderate">Moderate</option>
                              <option value="difficult">Difficult</option>
                            </select>
                          </div>
                        </div>

                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
                          <textarea
                            value={step.description}
                            onChange={(e) => updateTreatmentStep(stepIndex, {...step, description: e.target.value})}
                            className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            rows={2}
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Required Products (comma-separated)</label>
                            <input
                              type="text"
                              value={step.required_products.join(', ')}
                              onChange={(e) => updateTreatmentStep(stepIndex, {...step, required_products: e.target.value.split(',').map(p => p.trim()).filter(p => p)})}
                              className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Tools Needed (comma-separated)</label>
                            <input
                              type="text"
                              value={step.tools_needed.join(', ')}
                              onChange={(e) => updateTreatmentStep(stepIndex, {...step, tools_needed: e.target.value.split(',').map(t => t.trim()).filter(t => t)})}
                              className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Success Indicators */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Success Indicators (comma-separated)</label>
                  <input
                    type="text"
                    value={editingSchedule.success_indicators.join(', ')}
                    onChange={(e) => setEditingSchedule({...editingSchedule, success_indicators: e.target.value.split(',').map(i => i.trim()).filter(i => i)})}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Improved grass color, Reduced affected area"
                  />
                </div>

                {/* Warning Signs */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Warning Signs (comma-separated)</label>
                  <input
                    type="text"
                    value={editingSchedule.warning_signs.join(', ')}
                    onChange={(e) => setEditingSchedule({...editingSchedule, warning_signs: e.target.value.split(',').map(w => w.trim()).filter(w => w)})}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Spreading damage, Worsening symptoms"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-700 mt-6">
                <button
                  onClick={() => setShowScheduleEditor(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveSchedule}
                  className="flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Schedule</span>
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