// API utilities for server communication
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
    this.token = localStorage.getItem('auth_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        mode: 'cors',
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || `HTTP ${response.status}`,
          message: data.message
        };
      }

      return {
        success: true,
        data: data.data || data
      };
    } catch (error) {
      console.error('API request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      };
    }
  }

  // Authentication
  async login(email: string, password: string) {
    const response = await this.request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    if (response.success && response.data?.token) {
      this.token = response.data.token;
      localStorage.setItem('auth_token', this.token);
    }

    return response;
  }

  async register(userData: { email: string; password: string; name: string }) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }

  async logout() {
    this.token = null;
    localStorage.removeItem('auth_token');
    return this.request('/auth/logout', { method: 'POST' });
  }

  // User submissions
  async submitAnalysis(formData: FormData) {
    return this.request('/submissions', {
      method: 'POST',
      body: formData,
      headers: {} // Let browser set Content-Type for FormData
    });
  }

  async getUserSubmissions(userId?: string) {
    const endpoint = userId ? `/submissions/user/${userId}` : '/submissions/me';
    return this.request('/submissions', { method: 'GET' });
  }

  async getSubmission(id: string) {
    return this.request(`/submissions/${id}`, { method: 'GET' });
  }

  // Admin endpoints
  async getAllSubmissions(page = 1, limit = 50) {
    return this.request(`/admin/submissions?page=${page}&limit=${limit}`, {
      method: 'GET'
    });
  }

  async updateSubmission(id: string, updates: any) {
    return this.request(`/admin/submissions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  }

  // Reddit data collection
  async triggerRedditCollection(options: any = {}) {
    return this.request('/admin/reddit/collect', {
      method: 'POST',
      body: JSON.stringify(options)
    });
  }

  async getRedditData(page = 1, limit = 50) {
    return this.request(`/admin/reddit?page=${page}&limit=${limit}`, {
      method: 'GET'
    });
  }

  // AI Analysis
  async triggerAIAnalysis(options: any = {}) {
    return this.request('/admin/analysis/run', {
      method: 'POST',
      body: JSON.stringify(options)
    });
  }

  async getAnalysisResults(page = 1, limit = 50) {
    return this.request(`/admin/analysis?page=${page}&limit=${limit}`, {
      method: 'GET'
    });
  }

  // Root causes and categories
  async getRootCauses() {
    return this.request('/root-causes', { method: 'GET' });
  }

  async createRootCause(data: any) {
    return this.request('/root-causes', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateRootCause(id: string, data: any) {
    return this.request(`/root-causes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteRootCause(id: string) {
    return this.request(`/root-causes/${id}`, { method: 'DELETE' });
  }

  // Treatment schedules
  async getTreatmentSchedules(rootCauseId?: string) {
    const endpoint = rootCauseId 
      ? `/treatment-schedules?rootCauseId=${rootCauseId}`
      : '/treatment-schedules';
    return this.request(endpoint, { method: 'GET' });
  }

  async createTreatmentSchedule(data: any) {
    return this.request('/treatment-schedules', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateTreatmentSchedule(id: string, data: any) {
    return this.request(`/treatment-schedules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteTreatmentSchedule(id: string) {
    return this.request(`/treatment-schedules/${id}`, { method: 'DELETE' });
  }

  // Category suggestions
  async getCategorySuggestions() {
    return this.request('/admin/category-suggestions', { method: 'GET' });
  }

  async approveCategorySuggestion(id: string, approved: boolean, notes: string) {
    return this.request(`/admin/category-suggestions/${id}/review`, {
      method: 'POST',
      body: JSON.stringify({ approved, notes })
    });
  }

  // Dashboard stats
  async getDashboardStats() {
    return this.request('/admin/stats', { method: 'GET' });
  }

  // File upload helper
  async uploadImage(file: File): Promise<ApiResponse<{ url: string; filename: string }>> {
    const formData = new FormData();
    formData.append('image', file);

    return this.request('/upload/image', {
      method: 'POST',
      body: formData,
      headers: {} // Let browser set Content-Type for FormData
    });
  }
}

export const apiClient = new ApiClient();
export default apiClient;