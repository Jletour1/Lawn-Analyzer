// Server-based storage utilities to replace localStorage
import apiClient, { ApiResponse } from './api';
import { 
  LocalUserSubmission, 
  LocalAnalysisData 
} from './localStorage';
import { 
  RootCause, 
  CategorySuggestion, 
  LearningPattern,
  TreatmentSchedule 
} from '../types';

export interface ServerUserSubmission extends Omit<LocalUserSubmission, 'image_data'> {
  image_url: string;
  image_filename: string;
}

export interface ServerAnalysisData {
  submissions: ServerUserSubmission[];
  reddit_analyses: any[];
  analyzed_posts: any[];
  category_suggestions: CategorySuggestion[];
  learning_patterns: LearningPattern[];
  root_causes: RootCause[];
  treatment_schedules: TreatmentSchedule[];
}

class ServerStorage {
  private cache: Partial<ServerAnalysisData> = {};
  private cacheTimestamps: Record<string, number> = {};
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private isCacheValid(key: string): boolean {
    const timestamp = this.cacheTimestamps[key];
    return timestamp && (Date.now() - timestamp) < this.CACHE_DURATION;
  }

  private setCache<T>(key: keyof ServerAnalysisData, data: T): void {
    this.cache[key] = data as any;
    this.cacheTimestamps[key] = Date.now();
  }

  // User submissions
  async addUserSubmission(submission: LocalUserSubmission): Promise<boolean> {
    try {
      // Convert image data to file upload
      const imageBlob = this.dataURLToBlob(submission.image_data);
      const imageFile = new File([imageBlob], submission.image_filename, { 
        type: imageBlob.type 
      });

      // Upload image first
      const uploadResponse = await apiClient.uploadImage(imageFile);
      if (!uploadResponse.success || !uploadResponse.data) {
        throw new Error('Failed to upload image');
      }

      // Create submission data
      const submissionData = {
        ...submission,
        image_url: uploadResponse.data.url,
        image_data: undefined // Remove base64 data
      };

      // Create FormData for submission
      const formData = new FormData();
      Object.entries(submissionData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
        }
      });

      const response = await apiClient.submitAnalysis(formData);
      
      if (response.success) {
        // Invalidate cache
        delete this.cache.submissions;
        delete this.cacheTimestamps.submissions;
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to add user submission:', error);
      return false;
    }
  }

  async getUserSubmissions(): Promise<ServerUserSubmission[]> {
    if (this.isCacheValid('submissions') && this.cache.submissions) {
      return this.cache.submissions;
    }

    try {
      const response = await apiClient.getUserSubmissions();
      if (response.success && response.data) {
        this.setCache('submissions', response.data);
        return response.data;
      }
    } catch (error) {
      console.error('Failed to get user submissions:', error);
    }

    return [];
  }

  async updateUserSubmission(id: string, updates: Partial<ServerUserSubmission>): Promise<boolean> {
    try {
      const response = await apiClient.updateSubmission(id, updates);
      if (response.success) {
        // Invalidate cache
        delete this.cache.submissions;
        delete this.cacheTimestamps.submissions;
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to update user submission:', error);
      return false;
    }
  }

  // Root causes
  async getRootCauses(): Promise<RootCause[]> {
    if (this.isCacheValid('root_causes') && this.cache.root_causes) {
      return this.cache.root_causes;
    }

    try {
      const response = await apiClient.getRootCauses();
      if (response.success && response.data) {
        this.setCache('root_causes', response.data);
        return response.data;
      }
    } catch (error) {
      console.error('Failed to get root causes:', error);
    }

    return [];
  }

  async addRootCause(rootCause: Omit<RootCause, 'id' | 'created_at' | 'updated_at'>): Promise<string | null> {
    try {
      const response = await apiClient.createRootCause(rootCause);
      if (response.success && response.data) {
        // Invalidate cache
        delete this.cache.root_causes;
        delete this.cacheTimestamps.root_causes;
        return response.data.id;
      }
    } catch (error) {
      console.error('Failed to add root cause:', error);
    }
    return null;
  }

  async updateRootCause(id: string, updates: Partial<RootCause>): Promise<boolean> {
    try {
      const response = await apiClient.updateRootCause(id, updates);
      if (response.success) {
        // Invalidate cache
        delete this.cache.root_causes;
        delete this.cacheTimestamps.root_causes;
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to update root cause:', error);
      return false;
    }
  }

  async deleteRootCause(id: string): Promise<boolean> {
    try {
      const response = await apiClient.deleteRootCause(id);
      if (response.success) {
        // Invalidate cache
        delete this.cache.root_causes;
        delete this.cacheTimestamps.root_causes;
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to delete root cause:', error);
      return false;
    }
  }

  // Treatment schedules
  async getTreatmentSchedules(rootCauseId?: string): Promise<TreatmentSchedule[]> {
    const cacheKey = rootCauseId ? `treatment_schedules_${rootCauseId}` : 'treatment_schedules';
    
    if (this.isCacheValid(cacheKey) && this.cache.treatment_schedules) {
      return rootCauseId 
        ? this.cache.treatment_schedules.filter(ts => ts.root_cause_id === rootCauseId)
        : this.cache.treatment_schedules;
    }

    try {
      const response = await apiClient.getTreatmentSchedules(rootCauseId);
      if (response.success && response.data) {
        if (!rootCauseId) {
          this.setCache('treatment_schedules', response.data);
        }
        return response.data;
      }
    } catch (error) {
      console.error('Failed to get treatment schedules:', error);
    }

    return [];
  }

  async addTreatmentSchedule(schedule: Omit<TreatmentSchedule, 'id' | 'created_at' | 'updated_at'>): Promise<string | null> {
    try {
      const response = await apiClient.createTreatmentSchedule(schedule);
      if (response.success && response.data) {
        // Invalidate cache
        delete this.cache.treatment_schedules;
        delete this.cacheTimestamps.treatment_schedules;
        return response.data.id;
      }
    } catch (error) {
      console.error('Failed to add treatment schedule:', error);
    }
    return null;
  }

  async updateTreatmentSchedule(id: string, updates: Partial<TreatmentSchedule>): Promise<boolean> {
    try {
      const response = await apiClient.updateTreatmentSchedule(id, updates);
      if (response.success) {
        // Invalidate cache
        delete this.cache.treatment_schedules;
        delete this.cacheTimestamps.treatment_schedules;
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to update treatment schedule:', error);
      return false;
    }
  }

  async deleteTreatmentSchedule(id: string): Promise<boolean> {
    try {
      const response = await apiClient.deleteTreatmentSchedule(id);
      if (response.success) {
        // Invalidate cache
        delete this.cache.treatment_schedules;
        delete this.cacheTimestamps.treatment_schedules;
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to delete treatment schedule:', error);
      return false;
    }
  }

  // Category suggestions
  async getCategorySuggestions(): Promise<CategorySuggestion[]> {
    if (this.isCacheValid('category_suggestions') && this.cache.category_suggestions) {
      return this.cache.category_suggestions;
    }

    try {
      const response = await apiClient.getCategorySuggestions();
      if (response.success && response.data) {
        this.setCache('category_suggestions', response.data);
        return response.data;
      }
    } catch (error) {
      console.error('Failed to get category suggestions:', error);
    }

    return [];
  }

  async approveCategorySuggestion(id: string, approved: boolean, notes: string): Promise<boolean> {
    try {
      const response = await apiClient.approveCategorySuggestion(id, approved, notes);
      if (response.success) {
        // Invalidate cache
        delete this.cache.category_suggestions;
        delete this.cacheTimestamps.category_suggestions;
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to approve category suggestion:', error);
      return false;
    }
  }

  // Reddit data and analysis
  async getRedditData(): Promise<any[]> {
    if (this.isCacheValid('reddit_analyses') && this.cache.reddit_analyses) {
      return this.cache.reddit_analyses;
    }

    try {
      const response = await apiClient.getRedditData();
      if (response.success && response.data) {
        this.setCache('reddit_analyses', response.data);
        return response.data;
      }
    } catch (error) {
      console.error('Failed to get Reddit data:', error);
    }

    return [];
  }

  async getAnalyzedPosts(): Promise<any[]> {
    if (this.isCacheValid('analyzed_posts') && this.cache.analyzed_posts) {
      return this.cache.analyzed_posts;
    }

    try {
      const response = await apiClient.getAnalysisResults();
      if (response.success && response.data) {
        this.setCache('analyzed_posts', response.data);
        return response.data;
      }
    } catch (error) {
      console.error('Failed to get analyzed posts:', error);
    }

    return [];
  }

  // Admin operations
  async triggerRedditCollection(options: any = {}): Promise<boolean> {
    try {
      const response = await apiClient.triggerRedditCollection(options);
      if (response.success) {
        // Invalidate Reddit data cache
        delete this.cache.reddit_analyses;
        delete this.cacheTimestamps.reddit_analyses;
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to trigger Reddit collection:', error);
      return false;
    }
  }

  async triggerAIAnalysis(options: any = {}): Promise<boolean> {
    try {
      const response = await apiClient.triggerAIAnalysis(options);
      if (response.success) {
        // Invalidate analysis cache
        delete this.cache.analyzed_posts;
        delete this.cacheTimestamps.analyzed_posts;
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to trigger AI analysis:', error);
      return false;
    }
  }

  // Utility methods
  private dataURLToBlob(dataURL: string): Blob {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  }

  // Clear all cache
  clearCache(): void {
    this.cache = {};
    this.cacheTimestamps = {};
  }

  // Export data (for migration purposes)
  async exportAllData(): Promise<ServerAnalysisData> {
    const [
      submissions,
      reddit_analyses,
      analyzed_posts,
      category_suggestions,
      root_causes,
      treatment_schedules
    ] = await Promise.all([
      this.getUserSubmissions(),
      this.getRedditData(),
      this.getAnalyzedPosts(),
      this.getCategorySuggestions(),
      this.getRootCauses(),
      this.getTreatmentSchedules()
    ]);

    return {
      submissions,
      reddit_analyses,
      analyzed_posts,
      category_suggestions,
      learning_patterns: [], // Will be implemented later
      root_causes,
      treatment_schedules
    };
  }
}

export const serverStorage = new ServerStorage();
export default serverStorage;