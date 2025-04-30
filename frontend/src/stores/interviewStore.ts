import { create } from 'zustand';
import axios from 'axios';
import { API_URL } from '../config/constants';

interface Interviewer {
  _id: string;
  name: string;
  avatar?: string;
  voiceId?: string;
  personality?: string;
  industry?: string;
  jobRole?: string;
  isCustom: boolean;
}

interface Question {
  text: string;
  audioUrl?: string;
}

interface Answer {
  text: string;
  audioUrl?: string;
}

interface InterviewSession {
  question: Question;
  answer: Answer;
}

interface Interview {
  _id: string;
  userId: string;
  interviewerId: string;
  interviewer?: Interviewer;
  jobPosition: string;
  resumeData?: string;
  sessions: InterviewSession[];
  feedback?: string;
  status: 'pending' | 'in-progress' | 'completed';
  createdAt: string;
  updatedAt: string;
}

interface InterviewState {
  interviews: Interview[];
  currentInterview: Interview | null;
  isLoading: boolean;
  error: string | null;
  currentSessionIndex: number;
  userAudioBlob: Blob | null;
  isRecording: boolean;
  
  createInterview: (jobPosition: string, interviewerId?: string) => Promise<string>;
  getInterview: (interviewId: string) => Promise<void>;
  getInterviews: () => Promise<void>;
  startInterview: (interviewId: string) => Promise<void>;
  answerQuestion: (interviewId: string, sessionIndex: number, answerText: string, audioBlob?: Blob) => Promise<void>;
  completeInterview: (interviewId: string) => Promise<void>;
  setCurrentSessionIndex: (index: number) => void;
  setUserAudioBlob: (blob: Blob | null) => void;
  setIsRecording: (isRecording: boolean) => void;
}

export const useInterviewStore = create<InterviewState>((set, get) => ({
  interviews: [],
  currentInterview: null,
  isLoading: false,
  error: null,
  currentSessionIndex: 0,
  userAudioBlob: null,
  isRecording: false,
  
  createInterview: async (jobPosition, interviewerId) => {
    set({ isLoading: true, error: null });
    
    try {
      const userData = localStorage.getItem('user');
      if (!userData) {
        throw new Error('User not authenticated');
      }
      
      const user = JSON.parse(userData);
      
      // Create interview without an interviewer ID first
      const response = await axios.post(`${API_URL}/interviews`, {
        userId: user._id,
        jobPosition
      });
      
      const interviewData = response.data.data;
      
      set(state => ({
        interviews: [...state.interviews, interviewData],
        currentInterview: interviewData,
        isLoading: false
      }));
      
      return interviewData._id;
    } catch (error: any) {
      console.error('Create interview error:', error);
      set({ 
        error: error.response?.data?.message || 'Failed to create interview', 
        isLoading: false 
      });
      throw error;
    }
  },
  
  getInterview: async (interviewId) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await axios.get(`${API_URL}/interviews/${interviewId}`);
      
      const interviewData = response.data.data;
      
      set({ 
        currentInterview: interviewData, 
        isLoading: false 
      });
    } catch (error: any) {
      console.error('Get interview error:', error);
      set({ 
        error: error.response?.data?.message || 'Failed to get interview', 
        isLoading: false 
      });
    }
  },
  
  getInterviews: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const userData = localStorage.getItem('user');
      if (!userData) {
        throw new Error('User not authenticated');
      }
      
      const user = JSON.parse(userData);
      
      const response = await axios.get(`${API_URL}/interviews`);
      
      const interviewsData = response.data.data || [];
      
      // Filter interviews for the current user
      const userInterviews = interviewsData.filter(
        (interview: Interview) => interview.userId === user._id
      );
      
      set({ 
        interviews: userInterviews, 
        isLoading: false 
      });
    } catch (error: any) {
      console.error('Get interviews error:', error);
      set({ 
        error: error.response?.data?.message || 'Failed to get interviews', 
        isLoading: false,
        interviews: [] // Set empty array on error
      });
    }
  },
  
  startInterview: async (interviewId) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await axios.post(`${API_URL}/interviews/${interviewId}/start`);
      
      const interviewData = response.data.data;
      
      set(state => {
        // Update the interview in the interviews array
        const updatedInterviews = state.interviews.map(interview => 
          interview._id === interviewId ? interviewData : interview
        );
        
        return { 
          interviews: updatedInterviews,
          currentInterview: interviewData, 
          isLoading: false,
          currentSessionIndex: 0
        };
      });
    } catch (error: any) {
      console.error('Start interview error:', error);
      set({ 
        error: error.response?.data?.message || 'Failed to start interview', 
        isLoading: false 
      });
      throw error;
    }
  },
  
  answerQuestion: async (interviewId, sessionIndex, answerText, audioBlob) => {
    set({ isLoading: true, error: null });
    
    try {
      const formData = new FormData();
      formData.append('interviewId', interviewId);
      formData.append('sessionIndex', sessionIndex.toString());
      formData.append('answerText', answerText);
      
      if (audioBlob) {
        formData.append('audio', audioBlob, 'recording.webm');
      }
      
      const response = await axios.post(
        `${API_URL}/interviews/answer`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      const sessionData = response.data.data;
      
      set(state => {
        if (!state.currentInterview) return state;
        
        // Update the session in the current interview
        const updatedSessions = [...state.currentInterview.sessions];
        updatedSessions[sessionIndex] = sessionData;
        
        const updatedInterview = {
          ...state.currentInterview,
          sessions: updatedSessions
        };
        
        // Update the interview in the interviews array
        const updatedInterviews = state.interviews.map(interview => 
          interview._id === interviewId ? updatedInterview : interview
        );
        
        return { 
          interviews: updatedInterviews,
          currentInterview: updatedInterview, 
          isLoading: false,
          userAudioBlob: null
        };
      });
      
      // Move to the next question if available
      const { currentInterview, currentSessionIndex } = get();
      if (currentInterview && currentSessionIndex < currentInterview.sessions.length - 1) {
        set({ currentSessionIndex: currentSessionIndex + 1 });
      }
    } catch (error: any) {
      console.error('Answer question error:', error);
      set({ 
        error: error.response?.data?.message || 'Failed to submit answer', 
        isLoading: false 
      });
    }
  },
  
  completeInterview: async (interviewId) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await axios.post(`${API_URL}/interviews/${interviewId}/complete`);
      
      const interviewData = response.data.data;
      
      set(state => {
        // Update the interview in the interviews array
        const updatedInterviews = state.interviews.map(interview => 
          interview._id === interviewId ? interviewData : interview
        );
        
        return { 
          interviews: updatedInterviews,
          currentInterview: interviewData, 
          isLoading: false 
        };
      });
    } catch (error: any) {
      console.error('Complete interview error:', error);
      set({ 
        error: error.response?.data?.message || 'Failed to complete interview', 
        isLoading: false 
      });
      throw error;
    }
  },
  
  setCurrentSessionIndex: (index) => {
    set({ currentSessionIndex: index });
  },
  
  setUserAudioBlob: (blob) => {
    set({ userAudioBlob: blob });
  },
  
  setIsRecording: (isRecording) => {
    set({ isRecording });
  }
}));