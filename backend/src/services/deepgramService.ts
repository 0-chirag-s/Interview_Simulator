import axios from 'axios';
import fs from 'fs';
import { config } from '../config';
import { AppError } from '../utils/errorHandler';


interface DeepgramTranscriptAlternative {
  transcript: string;
  confidence: number;
}

interface DeepgramChannel {
  alternatives: DeepgramTranscriptAlternative[];
}

interface DeepgramResults {
  channels: DeepgramChannel[];
}

interface DeepgramResponse {
  results: DeepgramResults;
}

export class DeepgramService {
  private apiKey: string;
  private baseUrl: string = 'https://api.deepgram.com/v1';

  constructor() {
    this.apiKey = config.deepgramApiKey || '';
    if (!this.apiKey) {
      console.warn('Deepgram API key is not set');
    }
  }

  async speechToText(audioFilePath: string): Promise<string> {
    try {
      if (!this.apiKey) {
        throw new AppError('Deepgram API key is not configured', 500);
      }

      const audioFile = fs.readFileSync(audioFilePath);
      
      const response = await axios({
        method: 'POST',
        url: `${this.baseUrl}/listen`,
        data: audioFile,
        headers: {
          'Authorization': `Token ${this.apiKey}`,
          'Content-Type': 'audio/mpeg'
        },
        params: {
          model: 'nova',
          punctuate: true,
          diarize: false
        }
      });

      const deepgramResponse = response.data as unknown as DeepgramResponse;
      
      return deepgramResponse.results.channels[0].alternatives[0].transcript;
    } catch (error: any) {
      console.error('Error in speech to text:', error.message);
      throw new AppError(error.message || 'Failed to convert speech to text', 500);
    }
  }
}