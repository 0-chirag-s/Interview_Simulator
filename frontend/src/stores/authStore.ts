import { create } from 'zustand';
import axios from 'axios';
import { API_URL } from '../config/constants';

interface User {
  _id: string;
  name: string;
  email: string;
  resume?: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  uploadResume: (file: File) => Promise<void>;
}



export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: false,
  user: null,
  isLoading: true,
  error: null,
  
  login: async (email, password) => {
    set({ isLoading: true, error: null });
    
    try {
    
      const response = await axios.post(`${API_URL}/users`, {
        email,
        password,
        name,
      });
      
      const userData = response.data.data;
      
   
      localStorage.setItem('user', JSON.stringify(userData));
      
      set({ 
        isAuthenticated: true, 
        user: userData, 
        isLoading: false 
      });
    } catch (error: any) {
      console.error('Login error:', error);
      set({ 
        error: error.response?.data?.message || 'Failed to login', 
        isLoading: false 
      });
    }
  },
  
  register: async (name, email, password) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await axios.post(`${API_URL}/users`, {
        name,
        email,
        password
      });
      
      const userData = response.data.data;
      

      localStorage.setItem('user', JSON.stringify(userData));
      
      set({ 
        isAuthenticated: true, 
        user: userData, 
        isLoading: false 
      });
    } catch (error: any) {
      console.error('Registration error:', error);
      set({ 
        error: error.response?.data?.message || 'Failed to register', 
        isLoading: false 
      });
    }
  },
  
  logout: async () => {

    localStorage.removeItem('user');
    
    set({ 
      isAuthenticated: false, 
      user: null 
    });
  },
  
  checkAuth: async () => {
    set({ isLoading: true });
    
    try {

      const userData = localStorage.getItem('user');
      
      if (userData) {
        const user = JSON.parse(userData);
        set({ 
          isAuthenticated: true, 
          user, 
          isLoading: false 
        });
      } else {
        set({ 
          isAuthenticated: false, 
          user: null, 
          isLoading: false 
        });
      }
    } catch (error) {
      console.error('Auth check error:', error);
      set({ 
        isAuthenticated: false, 
        user: null, 
        isLoading: false 
      });
    }
  },
  
  uploadResume: async (file) => {
    const { user } = get();
    
    if (!user) {
      set({ error: 'User not authenticated' });
      return;
    }
    
    set({ isLoading: true, error: null });
    
    try {
      const formData = new FormData();
      formData.append('resume', file);
      
      const response = await axios.post(
        `${API_URL}/users/${user._id}/resume`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
   
      const updatedUser = {
        ...user,
        resume: response.data.data.resumePath
      };
      
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      set({ 
        user: updatedUser, 
        isLoading: false 
      });
    } catch (error: any) {
      console.error('Resume upload error:', error);
      set({ 
        error: error.response?.data?.message || 'Failed to upload resume', 
        isLoading: false 
      });
    }
  }
}));