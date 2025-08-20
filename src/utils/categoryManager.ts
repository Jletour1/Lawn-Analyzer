// Category management utilities for dynamic category handling
import { getLocalData, saveLocalData } from './localStorage';
import { RootCause } from '../types';

export interface CategoryInfo {
  id: string;
  name: string;
  category: 'disease' | 'pest' | 'environmental' | 'maintenance' | 'weed';
  description: string;
  visual_indicators: string[];
  standard_solutions: string[];
  keywords: string[];
}

// Get all available categories from root causes
export const getAllCategories = (): CategoryInfo[] => {
  const localData = getLocalData();
  const rootCauses = localData.root_causes || [];
  
  return rootCauses.map((rc: RootCause) => ({
    id: rc.id,
    name: rc.name,
    category: rc.category,
    description: rc.description,
    visual_indicators: rc.visual_indicators,
    standard_solutions: rc.standard_solutions,
    keywords: extractKeywords(rc.name, rc.description, rc.visual_indicators)
  }));
};

// Get category names for dropdowns
export const getCategoryNames = (): string[] => {
  const categories = getAllCategories();
  return categories.map(cat => cat.name).sort();
};

// Get categories by type
export const getCategoriesByType = (type: 'disease' | 'pest' | 'environmental' | 'maintenance' | 'weed'): CategoryInfo[] => {
  const categories = getAllCategories();
  return categories.filter(cat => cat.category === type);
};

// Extract keywords from category data for AI matching
const extractKeywords = (name: string, description: string, visualIndicators: string[]): string[] => {
  const text = `${name} ${description} ${visualIndicators.join(' ')}`.toLowerCase();
  const words = text.match(/\b\w{3,}\b/g) || [];
  return [...new Set(words)]; // Remove duplicates
};

// Generate AI prompt with dynamic categories
export const generateCategoryPromptSection = (): string => {
  const categories = getAllCategories();
  
  if (categories.length === 0) {
    return "No existing categories found. Please suggest appropriate categories for any lawn problems you identify.";
  }
  
  const categoryList = categories.map(cat => 
    `- ${cat.name} (${cat.category}): ${cat.description.substring(0, 100)}...`
  ).join('\n');
  
  return `Existing categories in the system:
${categoryList}

If the problem doesn't fit well into any of these existing categories, suggest a new category with the following structure:
{
  "suggested_category": "New Category Name",
  "suggested_subcategory": "Optional Subcategory",
  "description": "Detailed description of the problem",
  "reasoning": "Why this needs a new category",
  "confidence": 0.0-1.0,
  "visual_indicators": ["indicator1", "indicator2"],
  "suggested_solutions": ["solution1", "solution2"],
  "suggested_products": ["product1", "product2"]
}`;
};

// Check if a problem matches existing categories
export const findMatchingCategory = (problemDescription: string, confidence: number = 0.7): CategoryInfo | null => {
  const categories = getAllCategories();
  const problemWords = problemDescription.toLowerCase().match(/\b\w{3,}\b/g) || [];
  
  let bestMatch: CategoryInfo | null = null;
  let bestScore = 0;
  
  for (const category of categories) {
    let score = 0;
    const totalKeywords = category.keywords.length;
    
    if (totalKeywords === 0) continue;
    
    // Check keyword matches
    for (const keyword of category.keywords) {
      if (problemWords.includes(keyword)) {
        score += 1;
      }
    }
    
    // Calculate match percentage
    const matchPercentage = score / totalKeywords;
    
    if (matchPercentage > bestScore && matchPercentage >= confidence) {
      bestScore = matchPercentage;
      bestMatch = category;
    }
  }
  
  return bestMatch;
};

// Add a new category and make it immediately available
export const addNewCategory = (categoryData: Omit<RootCause, 'id' | 'created_at' | 'updated_at'>): string => {
  const localData = getLocalData();
  if (!localData.root_causes) {
    localData.root_causes = [];
  }
  
  const newCategory: RootCause = {
    ...categoryData,
    id: `rc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  localData.root_causes.push(newCategory);
  saveLocalData(localData);
  
  // Dispatch event to notify other components
  window.dispatchEvent(new CustomEvent('categoriesUpdated', { 
    detail: { newCategory: newCategory.name } 
  }));
  
  return newCategory.id;
};

// Get category statistics
export const getCategoryStats = () => {
  const categories = getAllCategories();
  const stats = {
    total: categories.length,
    byType: {
      disease: categories.filter(c => c.category === 'disease').length,
      pest: categories.filter(c => c.category === 'pest').length,
      environmental: categories.filter(c => c.category === 'environmental').length,
      maintenance: categories.filter(c => c.category === 'maintenance').length,
      weed: categories.filter(c => c.category === 'weed').length,
    }
  };
  
  return stats;
};