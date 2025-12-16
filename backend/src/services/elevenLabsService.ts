import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { config } from '../config';
import { AppError } from '../utils/errorHandler';

interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  category?: string;
  description?: string;
  preview_url?: string;
}

interface VoicesResponse {
  voices: ElevenLabsVoice[];
}

export class ElevenLabsService {
  private apiKey: string;
  private baseUrl: string = 'https://api.elevenlabs.io/v1';

  constructor() {
    this.apiKey = config.elevenLabsApiKey || '';
    if (!this.apiKey) {
      console.warn('Eleven Labs API key is not set');
    }
  }

  async textToSpeech(text: string, voiceId?: string): Promise<string> {
    try {
      if (!this.apiKey) {
        throw new AppError('Eleven Labs API key is not configured', 500);
      }

      if (!voiceId) {
        const voices = await this.getAvailableVoices();
        if (voices.length === 0) {
          throw new AppError('No voices available from Eleven Labs', 500);
        }
        voiceId = voices[0].voice_id;
        console.log(`Using default voice ID: ${voiceId}`);
      }

      console.log(`Making TTS request with voice ID: ${voiceId} and text: ${text.substring(0, 30)}...`);

      const response = await axios({
        method: 'POST',
        url: `${this.baseUrl}/text-to-speech/${voiceId}`,
        data: JSON.stringify({
          text,
          model_id: 'eleven_turbo_v2_5', // Updated to free tier model (supports 32 languages)
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5
          }
        }),
        headers: {
          'Accept': 'audio/mpeg',
          'xi-api-key': this.apiKey,
          'Content-Type': 'application/json'
        },
        responseType: 'arraybuffer'
      });


      const outputDir = path.resolve('uploads/audio');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }


      const filename = `${Date.now()}.mp3`;
      const outputPath = path.join(outputDir, filename);

      fs.writeFileSync(outputPath, response.data);

      console.log(`Audio file saved to: ${outputPath}`);

      return outputPath;
    } catch (error: any) {
      console.error('Error in text to speech:', error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data ?
          (error.response.data instanceof Buffer ?
            error.response.data.toString() : JSON.stringify(error.response.data)) :
          'No response data');
      }
      throw new AppError(error.message || 'Failed to convert text to speech', 500);
    }
  }

  async getAvailableVoices(): Promise<ElevenLabsVoice[]> {
    try {
      if (!this.apiKey) {
        throw new AppError('Eleven Labs API key is not configured', 500);
      }

      const response = await axios<VoicesResponse>({
        method: 'GET',
        url: `${this.baseUrl}/voices`,
        headers: {
          'xi-api-key': this.apiKey,
          'Content-Type': 'application/json'
        }
      });

      return response.data.voices;
    } catch (error: any) {
      console.error('Error getting available voices:', error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', JSON.stringify(error.response.data || {}));
      }
      throw new AppError(error.message || 'Failed to get available voices', 500);
    }
  }
}