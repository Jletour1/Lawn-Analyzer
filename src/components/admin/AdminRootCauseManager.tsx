import React, { useState, useEffect } from 'react';
import { Edit3, Save, X, Plus, Trash2, ExternalLink } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  link: string;
  price: string;
  description: string;
}

interface RootCause {
  id: string;
  name: string;
  description: string;
  recommendation: string;
  products: Product[];
  isCustom: boolean; // Track if user has customized this entry
}

const AdminRootCauseManager: React.FC = () => {
  const [rootCauses, setRootCauses] = useState<RootCause[]>([]);
  const [discoveredProblems, setDiscoveredProblems] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<RootCause | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newRootCause, setNewRootCause] = useState<Omit<RootCause, 'id' | 'isCustom'>>({
    name: '',
    description: '',
    recommendation: '',
    products: Array(5).fill(null).map((_, i) => ({
      id: `new_${i}`,
      name: '',
      link: '',
      price: '',
      description: ''
    }))
  });

  // Initialize with default root causes
  useEffect(() => {
    // Load discovered problems from AI analysis
    const loadDiscoveredProblems = () => {
      // Simulate AI-discovered problems from post analysis
      const mockDiscovered = [
        {
          id: 'armyworm_infestation',
          name: 'Armyworm Infestation',
          description: 'Large patches of grass eaten down to soil level, often in irregular patterns. Active at night.',
          confidence: 0.87,
          postCount: 23,
          examples: [
            'Woke up to find huge patches of my lawn completely eaten overnight',
            'Grass looks like it was mowed down to dirt in random spots',
            'Found small green caterpillars when I looked closely at damaged areas'
          ],
          suggestedProducts: ['Insecticide for caterpillars', 'Lawn repair seed', 'Beneficial nematodes']
        },
        {
          id: 'snow_mold',
          name: 'Snow Mold Disease',
          description: 'Circular patches of matted, grayish-white grass that appear after snow melts.',
          confidence: 0.82,
          postCount: 18,
          examples: [
            'After snow melted, found circular gray patches all over lawn',
            'Grass looks matted down and grayish white in spots',
            'Patches appeared right where snow piles were heaviest'
          ],
          suggestedProducts: ['Fungicide treatment', 'Lawn rake', 'Spring fertilizer']
        },
        {
          id: 'vole_damage',
          name: 'Vole Runway Damage',
          description: 'Narrow trails or runways through grass, often in serpentine patterns under snow.',
          confidence: 0.79,
          postCount: 15,
          examples: [
            'Found weird trails running through my grass after winter',
            'Looks like tiny highways carved through the lawn',
            'Narrow paths of dead grass in winding patterns'
          ],
          suggestedProducts: ['Vole repellent', 'Hardware cloth', 'Grass seed mix']
        }
      ];
      setDiscoveredProblems(mockDiscovered);
    };

    loadDiscoveredProblems();

    const defaultRootCauses: RootCause[] = [
      {
        id: 'dog_urine_spots',
        name: 'Dog Urine Spots',
        description: 'Round, dead patches with dark green rings caused by concentrated nitrogen from pet urine.',
        recommendation: 'Flush affected areas with water immediately after urination. Apply gypsum to neutralize salt buildup. Remove dead grass and overseed with urine-resistant varieties.',
        products: [
          { id: '1', name: 'Gypsum Soil Conditioner', link: '', price: '$15-25', description: 'Neutralizes salt buildup' },
          { id: '2', name: 'Dog Spot Aid', link: '', price: '$20-30', description: 'Prevents urine damage' },
          { id: '3', name: 'Perennial Ryegrass Seed', link: '', price: '$25-40', description: 'Urine-resistant grass' },
          { id: '4', name: 'Starter Fertilizer', link: '', price: '$15-20', description: 'For new grass growth' },
          { id: '5', name: 'Lawn Repair Kit', link: '', price: '$30-50', description: 'Complete spot repair' }
        ],
        isCustom: false
      },
      {
        id: 'dull_mower_blades',
        name: 'Dull Mower Blades',
        description: 'Grass tips appear frayed, shredded, or brown caused by dull mower blades tearing instead of cutting cleanly.',
        recommendation: 'Stop mowing until blades are sharpened. Sharpen or replace mower blades immediately. Water lawn lightly to help damaged tips recover.',
        products: [
          { id: '1', name: 'Mower Blade Sharpening Service', link: '', price: '$15-30', description: 'Professional sharpening' },
          { id: '2', name: 'Replacement Mower Blades', link: '', price: '$20-50', description: 'High-quality blades' },
          { id: '3', name: 'Blade Sharpening Kit', link: '', price: '$25-40', description: 'DIY sharpening tools' },
          { id: '4', name: 'Lawn Recovery Fertilizer', link: '', price: '$20-35', description: 'Helps grass recover' },
          { id: '5', name: 'Grass Repair Spray', link: '', price: '$15-25', description: 'Quick tip recovery' }
        ],
        isCustom: false
      },
      {
        id: 'fertilizer_burn',
        name: 'Fertilizer Burn',
        description: 'Yellow or brown streaks/patches after fertilizing caused by overapplication of fertilizer.',
        recommendation: 'Water heavily to flush excess fertilizer from soil. Continue daily watering for 1-2 weeks. Use slow-release fertilizers in future.',
        products: [
          { id: '1', name: 'Gypsum for Recovery', link: '', price: '$15-25', description: 'Soil improvement' },
          { id: '2', name: 'Slow-Release Fertilizer', link: '', price: '$30-50', description: 'Prevents future burn' },
          { id: '3', name: 'Grass Seed Mix', link: '', price: '$25-40', description: 'For reseeding damaged areas' },
          { id: '4', name: 'Soil Test Kit', link: '', price: '$10-20', description: 'Check nutrient levels' },
          { id: '5', name: 'Sprinkler Timer', link: '', price: '$40-80', description: 'Consistent watering' }
        ],
        isCustom: false
      },
      {
        id: 'grubs',
        name: 'Grub Infestation',
        description: 'Brown patches that peel back like carpet with white C-shaped larvae visible. Often attracts digging animals.',
        recommendation: 'Apply grub control insecticide immediately. Water treatment in thoroughly. Repair damaged areas by reseeding after control.',
        products: [
          { id: '1', name: 'Grub Control Insecticide', link: '', price: '$30-50', description: 'Kills grubs effectively' },
          { id: '2', name: 'Milky Spore (Organic)', link: '', price: '$25-40', description: 'Natural grub control' },
          { id: '3', name: 'Lawn Repair Seed', link: '', price: '$20-35', description: 'For damaged areas' },
          { id: '4', name: 'Starter Fertilizer', link: '', price: '$15-25', description: 'Helps new grass' },
          { id: '5', name: 'Beneficial Nematodes', link: '', price: '$30-45', description: 'Biological control' }
        ],
        isCustom: false
      },
      {
        id: 'broadleaf_weeds',
        name: 'Broadleaf Weeds',
        description: 'Weeds with broad, flat leaves and often flowers including dandelions, clover, plantain, and thistle.',
        recommendation: 'Apply selective broadleaf herbicide. Hand-pull individual weeds when soil is moist. Maintain thick turf to prevent re-establishment.',
        products: [
          { id: '1', name: 'Selective Broadleaf Herbicide', link: '', price: '$25-45', description: 'Kills weeds, not grass' },
          { id: '2', name: 'Weed Puller Tool', link: '', price: '$15-30', description: 'Manual weed removal' },
          { id: '3', name: 'Corn Gluten Meal', link: '', price: '$20-35', description: 'Organic pre-emergent' },
          { id: '4', name: 'Thick Lawn Seed Mix', link: '', price: '$30-50', description: 'Crowds out weeds' },
          { id: '5', name: 'Lawn Thickener Fertilizer', link: '', price: '$25-40', description: 'Promotes dense growth' }
        ],
        isCustom: false
      }
    ];

    // Load from localStorage if available, otherwise use defaults
    const saved = localStorage.getItem('rootCausesData');
    if (saved) {
      setRootCauses(JSON.parse(saved));
    } else {
      setRootCauses(defaultRootCauses);
    }
  }, []);

  // Save to localStorage whenever rootCauses changes
  useEffect(() => {
    if (rootCauses.length > 0) {
      localStorage.setItem('rootCausesData', JSON.stringify(rootCauses));
    }
  }, [rootCauses]);

  const startEditing = (rootCause: RootCause) => {
    setEditingId(rootCause.id);
    setEditingData({ ...rootCause });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingData(null);
  };

  const saveEditing = () => {
    if (!editingData) return;

    setRootCauses(prev => prev.map(rc => 
      rc.id === editingData.id 
        ? { ...editingData, isCustom: true }
        : rc
    ));
    setEditingId(null);
    setEditingData(null);
  };

  const startAddingNew = () => {
    setIsAddingNew(true);
    setNewRootCause({
      name: '',
      description: '',
      recommendation: '',
      products: Array(5).fill(null).map((_, i) => ({
        id: `new_${i}`,
        name: '',
        link: '',
        price: '',
        description: ''
      }))
    });
  };

  const cancelAddingNew = () => {
    setIsAddingNew(false);
  };

  const saveNewRootCause = () => {
    if (!newRootCause.name.trim()) {
      alert('Please enter a root cause name');
      return;
    }

    const newEntry: RootCause = {
      id: `custom_${Date.now()}`,
      ...newRootCause,
      isCustom: true
    };

    setRootCauses(prev => [...prev, newEntry]);
    setIsAddingNew(false);
    
    // Update the global analyzer with new root cause
    if ((window as any).updateRootCauses) {
      (window as any).updateRootCauses([...rootCauses, newEntry]);
    }
  };

  const updateNewRootCause = (field: keyof Omit<RootCause, 'id' | 'isCustom'>, value: any) => {
    setNewRootCause(prev => ({ ...prev, [field]: value }));
  };

  const updateNewProduct = (productIndex: number, field: keyof Product, value: string) => {
    const updatedProducts = [...newRootCause.products];
    updatedProducts[productIndex] = { ...updatedProducts[productIndex], [field]: value };
    setNewRootCause(prev => ({ ...prev, products: updatedProducts }));
  };

  const updateEditingData = (field: keyof RootCause, value: any) => {
    if (!editingData) return;
    setEditingData(prev => prev ? { ...prev, [field]: value } : null);
  };

  const updateProduct = (productIndex: number, field: keyof Product, value: string) => {
    if (!editingData) return;
    const updatedProducts = [...editingData.products];
    updatedProducts[productIndex] = { ...updatedProducts[productIndex], [field]: value };
    setEditingData(prev => prev ? { ...prev, products: updatedProducts } : null);
  };

  const deleteRootCause = (id: string) => {
    if (confirm('Are you sure you want to delete this root cause?')) {
      setRootCauses(prev => prev.filter(rc => rc.id !== id));
    }
  };

  const acceptDiscoveredProblem = (problem: any) => {
    const newRootCause: RootCause = {
      id: `discovered_${Date.now()}`,
      name: problem.name,
      description: problem.description,
      recommendation: `AI-discovered problem. ${problem.description} Consider professional assessment for proper treatment.`,
      products: problem.suggestedProducts.slice(0, 5).map((product: string, index: number) => ({
        id: `discovered_${Date.now()}_${index}`,
        name: product,
        link: '',
        price: 'TBD',
        description: 'AI-suggested product'
      })),
      isCustom: true
    };

    setRootCauses(prev => [...prev, newRootCause]);
    setDiscoveredProblems(prev => prev.filter(p => p.id !== problem.id));
    
    // Update the global analyzer
    if ((window as any).updateRootCauses) {
      (window as any).updateRootCauses([...rootCauses, newRootCause]);
    }
  };

  const dismissDiscoveredProblem = (index: number) => {
    setDiscoveredProblems(prev => prev.filter((_, i) => i !== index));
  };

  // Expose root causes globally for the analyzer
  useEffect(() => {
    if ((window as any).updateRootCauses) {
      (window as any).updateRootCauses(rootCauses);
    }
  }, [rootCauses]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Root Cause Management</h2>
            <p className="text-gray-400 mt-1">Manage problem descriptions, recommendations, and affiliate product links</p>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-400">
            <button
              onClick={startAddingNew}
              className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Root Cause</span>
            </button>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-400">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span>{rootCauses.filter(rc => rc.isCustom).length} customized entries</span>
          </div>
        </div>
      </div>

      {/* Add New Root Cause Form */}
      {isAddingNew && (
        <div className="bg-green-900/20 border border-green-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-green-300">Add New Root Cause</h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={saveNewRootCause}
                className="flex items-center space-x-2 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Save</span>
              </button>
              <button
                onClick={cancelAddingNew}
                className="flex items-center space-x-2 bg-gray-600 text-white px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <X className="w-4 h-4" />
                <span>Cancel</span>
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-green-300 mb-2">Root Cause Name</label>
              <input
                type="text"
                value={newRootCause.name}
                onChange={(e) => updateNewRootCause('name', e.target.value)}
                placeholder="e.g., Armyworm Infestation"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-green-300 mb-2">Description</label>
              <textarea
                value={newRootCause.description}
                onChange={(e) => updateNewRootCause('description', e.target.value)}
                placeholder="Describe the problem and its symptoms..."
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg resize-none"
                rows={3}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-green-300 mb-2">Recommendation</label>
              <textarea
                value={newRootCause.recommendation}
                onChange={(e) => updateNewRootCause('recommendation', e.target.value)}
                placeholder="Treatment recommendations..."
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg resize-none"
                rows={3}
              />
            </div>
          </div>
          
          <div className="mt-4">
            <label className="block text-sm font-medium text-green-300 mb-2">Products (Optional)</label>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {[0, 1, 2, 3, 4].map((index) => (
                <div key={index} className="space-y-2">
                  <input type="text" placeholder="Product name" value={newRootCause.products[index]?.name || ''} onChange={(e) => updateNewProduct(index, 'name', e.target.value)} className="w-full px-2 py-1 bg-gray-700 border border-gray-600 text-white rounded text-sm" />
                  <input type="text" placeholder="Affiliate link" value={newRootCause.products[index]?.link || ''} onChange={(e) => updateNewProduct(index, 'link', e.target.value)} className="w-full px-2 py-1 bg-gray-700 border border-gray-600 text-white rounded text-sm" />
                  <input type="text" placeholder="Price" value={newRootCause.products[index]?.price || ''} onChange={(e) => updateNewProduct(index, 'price', e.target.value)} className="w-full px-2 py-1 bg-gray-700 border border-gray-600 text-white rounded text-sm" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* AI Discovered Problems Section */}
      {discoveredProblems.length > 0 && (
        <div className="bg-gray-800 border border-purple-500 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <h3 className="text-xl font-bold text-white">🤖 AI Discovered Problems</h3>
              <span className="px-3 py-1 bg-purple-600 text-white text-sm rounded-full font-medium">
                {discoveredProblems.length} New
              </span>
            </div>
            <div className="text-sm text-gray-300">
              Review and accept AI-discovered lawn problems
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {discoveredProblems.map((problem, index) => (
              <div key={index} className="bg-gray-900 border border-gray-600 rounded-lg p-6 hover:border-purple-500 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-2">{problem.name}</h4>
                    <p className="text-gray-200 text-sm mb-3">{problem.description}</p>
                    <div className="flex items-center space-x-4 text-xs">
                      <span className={`px-2 py-1 rounded-full font-medium ${
                        problem.confidence > 0.8 ? 'bg-green-900 text-green-300' :
                        problem.confidence > 0.6 ? 'bg-yellow-900 text-yellow-300' :
                        'bg-red-900 text-red-300'
                      }`}>
                        {Math.round(problem.confidence * 100)}% confidence
                      </span>
                      <span className="text-gray-300">{problem.postCount} supporting posts</span>
                    </div>
                  </div>
                </div>
                
                <div className="mb-4">
                  <h5 className="text-sm font-medium text-purple-400 mb-2">Example User Descriptions:</h5>
                  <div className="space-y-1">
                    {problem.examples.slice(0, 2).map((example, i) => (
                      <p key={i} className="text-xs text-gray-300 italic bg-gray-800 p-2 rounded">"{example}"</p>
                    ))}
                  </div>
                </div>
                
                <div className="mb-4">
                  <h5 className="text-sm font-medium text-purple-400 mb-2">Suggested Products:</h5>
                  <div className="flex flex-wrap gap-1">
                    {problem.suggestedProducts.map((product, i) => (
                      <span key={i} className="px-2 py-1 bg-purple-900/30 text-purple-200 text-xs rounded border border-purple-700">
                        {product}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => acceptDiscoveredProblem(problem)}
                    className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                  >
                    Accept & Add
                  </button>
                  <button
                    onClick={() => dismissDiscoveredProblem(index)}
                    className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Root Causes Table */}
      <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-200">Root Cause</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-200">Description</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-200">Recommendation</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-200">Product 1</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-200">Product 2</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-200">Product 3</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-200">Product 4</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-200">Product 5</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-200">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {rootCauses.map((rootCause) => (
                <tr key={rootCause.id} className="hover:bg-gray-700/50">
                  {/* Root Cause Name */}
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-white">{rootCause.name}</span>
                      {rootCause.isCustom && (
                        <span className="px-2 py-1 bg-green-900 text-green-300 text-xs rounded-full">
                          Custom
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Description */}
                  <td className="px-6 py-4">
                    {editingId === rootCause.id ? (
                      <textarea
                        value={editingData?.description || ''}
                        onChange={(e) => updateEditingData('description', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg text-sm resize-none"
                        rows={3}
                      />
                    ) : (
                      <p className="text-gray-300 text-sm max-w-xs">{rootCause.description}</p>
                    )}
                  </td>

                  {/* Recommendation */}
                  <td className="px-6 py-4">
                    {editingId === rootCause.id ? (
                      <textarea
                        value={editingData?.recommendation || ''}
                        onChange={(e) => updateEditingData('recommendation', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg text-sm resize-none"
                        rows={3}
                      />
                    ) : (
                      <p className="text-gray-300 text-sm max-w-xs">{rootCause.recommendation}</p>
                    )}
                  </td>

                  {/* Products */}
                  {[0, 1, 2, 3, 4].map((productIndex) => (
                    <td key={productIndex} className="px-6 py-4">
                      {editingId === rootCause.id ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            placeholder="Product name"
                            value={editingData?.products[productIndex]?.name || ''}
                            onChange={(e) => updateProduct(productIndex, 'name', e.target.value)}
                            className="w-full px-2 py-1 bg-gray-700 border border-gray-600 text-white rounded text-xs"
                          />
                          <input
                            type="text"
                            placeholder="Affiliate link"
                            value={editingData?.products[productIndex]?.link || ''}
                            onChange={(e) => updateProduct(productIndex, 'link', e.target.value)}
                            className="w-full px-2 py-1 bg-gray-700 border border-gray-600 text-white rounded text-xs"
                          />
                          <input
                            type="text"
                            placeholder="Price range"
                            value={editingData?.products[productIndex]?.price || ''}
                            onChange={(e) => updateProduct(productIndex, 'price', e.target.value)}
                            className="w-full px-2 py-1 bg-gray-700 border border-gray-600 text-white rounded text-xs"
                          />
                          <input
                            type="text"
                            placeholder="Description"
                            value={editingData?.products[productIndex]?.description || ''}
                            onChange={(e) => updateProduct(productIndex, 'description', e.target.value)}
                            className="w-full px-2 py-1 bg-gray-700 border border-gray-600 text-white rounded text-xs"
                          />
                        </div>
                      ) : (
                        rootCause.products[productIndex] && (
                          <div className="space-y-1">
                            <div className="flex items-center space-x-1">
                              <p className="text-white text-sm font-medium">
                                {rootCause.products[productIndex].name}
                              </p>
                              {rootCause.products[productIndex].link && (
                                <a
                                  href={rootCause.products[productIndex].link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-400 hover:text-blue-300"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                            <p className="text-green-400 text-xs">{rootCause.products[productIndex].price}</p>
                            <p className="text-gray-400 text-xs">{rootCause.products[productIndex].description}</p>
                          </div>
                        )
                      )}
                    </td>
                  ))}

                  {/* Actions */}
                  <td className="px-6 py-4">
                    {editingId === rootCause.id ? (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={saveEditing}
                          className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="p-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => startEditing(rootCause)}
                          className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        {rootCause.isCustom && (
                          <button
                            onClick={() => deleteRootCause(rootCause.id)}
                            className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-gray-800 border border-gray-600 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">📋 Root Cause Management Instructions</h3>
        <div className="space-y-4">
          <div className="bg-gray-700 rounded-lg p-4">
            <h4 className="text-green-400 font-semibold mb-2">🤖 AI-Powered Discovery</h4>
            <ul className="space-y-1 text-gray-200 text-sm ml-4">
              <li>• System automatically analyzes Reddit posts to discover new lawn problems</li>
              <li>• AI identifies recurring issues not in the current database</li>
              <li>• Each discovery includes confidence level and supporting post count</li>
              <li>• Review AI-discovered problems and accept the ones that look accurate</li>
            </ul>
          </div>
          
          <div className="bg-gray-700 rounded-lg p-4">
            <h4 className="text-blue-400 font-semibold mb-2">✏️ Manual Management</h4>
            <ul className="space-y-1 text-gray-200 text-sm ml-4">
              <li>• Click "Add New Root Cause" to create custom problem types</li>
              <li>• Click the edit button to modify any root cause entry</li>
              <li>• Once you save changes, the entry is marked as "Custom"</li>
              <li>• Custom root causes can be deleted using the trash icon</li>
            </ul>
          </div>
          
          <div className="bg-gray-700 rounded-lg p-4">
            <h4 className="text-yellow-400 font-semibold mb-2">💰 Product Integration</h4>
            <ul className="space-y-1 text-gray-200 text-sm ml-4">
              <li>• Add your affiliate links in the product link fields</li>
              <li>• Product links will open in new tabs when users click them</li>
              <li>• Price ranges help users understand expected costs</li>
              <li>• Up to 5 products can be recommended per root cause</li>
            </ul>
          </div>
          
          <div className="bg-gray-700 rounded-lg p-4">
            <h4 className="text-purple-400 font-semibold mb-2">💾 Data Management</h4>
            <ul className="space-y-1 text-gray-200 text-sm ml-4">
              <li>• All changes are automatically saved to your browser's local storage</li>
              <li>• New root causes are immediately available in the AI analysis system</li>
              <li>• Custom entries won't be overwritten by system updates</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminRootCauseManager;