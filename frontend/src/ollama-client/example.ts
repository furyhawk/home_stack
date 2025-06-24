/**
 * Example usage of the generated Ollama FastAPI client
 */
import { 
  OpenAPI,
  ModelsService,
  DefaultService,
  AutomaticSpeechRecognitionService,
  SpeechToTextService 
} from './index';

// Configure the base URL for your Ollama API
OpenAPI.BASE = 'http://localhost:11434'; // Default Ollama port

// Example: List available models
async function listModels() {
  try {
    const response = await ModelsService.listLocalModelsV1ModelsGet({});
    console.log('Available models:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error listing models:', error);
  }
}

// Example: Get a specific model
async function getModel(modelId: string) {
  try {
    const response = await ModelsService.getLocalModelV1ModelsModelIdGet({
      path: { model_id: modelId }
    });
    console.log('Model details:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error getting model:', error);
  }
}

// Example: Chat completion
async function chatCompletion() {
  try {
    const response = await DefaultService.handleCompletionsV1ChatCompletionsPost({
      body: {
        model: 'llama2', // Replace with your model
        messages: [
          {
            role: 'user',
            content: 'Hello, how are you?'
          }
        ]
      }
    });
    console.log('Chat response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error in chat completion:', error);
  }
}

// Example: Transcribe audio
async function transcribeAudio(audioFile: File) {
  try {
    const formData = new FormData();
    formData.append('file', audioFile);
    formData.append('model', 'whisper-1');
    
    const response = await AutomaticSpeechRecognitionService.transcribeFileV1AudioTranscriptionsPost({
      formData
    });
    console.log('Transcription:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error transcribing audio:', error);
  }
}

// Example: Text-to-speech synthesis
async function synthesizeSpeech(text: string, voice: string = 'default') {
  try {
    const response = await SpeechToTextService.synthesizeV1AudioSpeechPost({
      body: {
        model: 'tts-1',
        input: text,
        voice: voice
      }
    });
    console.log('Speech synthesis response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error synthesizing speech:', error);
  }
}

// Export the functions for use in your application
export {
  listModels,
  getModel,
  chatCompletion,
  transcribeAudio,
  synthesizeSpeech
};
