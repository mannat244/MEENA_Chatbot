import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

console.log('Testing Google GenAI API...');
console.log('API Key present:', !!process.env.GOOGLE_API_KEY);
console.log('API Key preview:', process.env.GOOGLE_API_KEY ? `${process.env.GOOGLE_API_KEY.substring(0, 10)}...` : 'NOT FOUND');

try {
  const genAI = new GoogleGenAI({
    apiKey: process.env.GOOGLE_API_KEY
  });
  
  console.log('Attempting to generate embedding for test text...');
  const response = await genAI.models.embedContent({
    model: 'gemini-embedding-001',
    contents: 'Hello world, this is a test.',
    taskType: 'RETRIEVAL_DOCUMENT',
    outputDimensionality: 768
  });
  
  console.log('✅ Success! Embedding generated successfully');
  console.log('Response structure:', Object.keys(response));
  
  if (response.embedding && response.embedding.values) {
    console.log('Embedding dimension:', response.embedding.values.length);
    console.log('First few values:', response.embedding.values.slice(0, 5));
  } else if (response.embeddings && response.embeddings.length > 0) {
    console.log('Embedding dimension:', response.embeddings[0].values.length);
    console.log('First few values:', response.embeddings[0].values.slice(0, 5));
  } else {
    console.log('Full response:', JSON.stringify(response, null, 2));
  }
  
} catch (error) {
  console.error('❌ Error testing Google API:');
  console.error('Error type:', error.constructor.name);
  console.error('Error message:', error.message);
  if (error.status) {
    console.error('HTTP status:', error.status);
  }
  if (error.errorDetails) {
    console.error('Error details:', JSON.stringify(error.errorDetails, null, 2));
  }
}