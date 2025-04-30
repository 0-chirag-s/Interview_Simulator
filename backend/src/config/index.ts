import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 3000,
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/interview-simulator',
  elevenLabsApiKey: process.env.ELEVEN_LABS_API_KEY,
  deepgramApiKey: process.env.DEEPGRAM_API_KEY,
  githubToken: process.env.GITHUB_TOKEN,
  openaiEndpoint: 'https://models.github.ai/inference',
  openaiModel: 'openai/gpt-4.1'
};