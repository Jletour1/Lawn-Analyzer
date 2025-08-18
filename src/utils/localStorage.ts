// Local storage utilities for development
import { CategorySuggestion } from '../types';
import { LearningPattern } from '../types';

export interface LocalUserSubmission {
  id: string;
  user_email: string;
  user_name?: string;
  user_phone?: string;
  image_data: string;
  image_filename: string;
  problem_description: string;
  grass_type?: string;
  location?: string;
  season?: string;
  recent_treatments?: string;
  pet_traffic: boolean;
  analysis_result?: any;
  flagged_for_review: boolean;
  review_reason?: string;
  admin_reviewed: boolean;
  admin_notes?: string;
  created_at: string;
  reviewed_at?: string;
}

export interface LocalAnalysisData {
  submissions: LocalUserSubmission[];
  reddit_analyses: any[];
  analyzed_posts: any[];
  category_suggestions?: CategorySuggestion[];
  learning_patterns?: LearningPattern[];
  root_causes?: any[];
  settings: {
    openai_api_key?: string;
    reddit_client_id?: string;
    reddit_client_secret?: string;
  };
}

const STORAGE_KEY = 'lawn_analyzer_data';

export const getLocalData = (): LocalAnalysisData => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error reading local data:', error);
  }
  
  return {
    submissions: [],
    reddit_analyses: [],
    analyzed_posts: [],
    category_suggestions: [],
    settings: {}
  };
};

export const saveLocalData = (data: LocalAnalysisData): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving local data:', error);
  }
};

export const addUserSubmission = (submission: LocalUserSubmission): void => {
  const data = getLocalData();
  data.submissions.push(submission);
  saveLocalData(data);
  
  // Also save image to downloads folder (simulated)
  saveImageLocally(submission.image_data, submission.image_filename);
};

export const updateUserSubmission = (id: string, updates: Partial<LocalUserSubmission>): void => {
  const data = getLocalData();
  const index = data.submissions.findIndex(sub => sub.id === id);
  if (index !== -1) {
    data.submissions[index] = { ...data.submissions[index], ...updates };
    saveLocalData(data);
  }
};

export const saveImageLocally = (imageData: string, filename: string): void => {
  // Create download link for image
  const link = document.createElement('a');
  link.href = imageData;
  link.download = `lawn_images/${filename}`;
  
  // For development, we'll just log this - in production you'd save to server
  console.log(`Image would be saved as: ${filename}`);
  console.log('Image data length:', imageData.length);
};

export const exportDataAsJSON = (): void => {
  const data = getLocalData();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `lawn_analyzer_data_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};

export const importDataFromJSON = (file: File): Promise<void> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        saveLocalData(data);
        resolve();
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};