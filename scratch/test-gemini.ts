import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const key = process.env.GEMINI_API_KEY;
console.log('Gemini API Key:', key ? `${key.substring(0, 10)}...` : 'undefined');

if (!key) {
  console.error('No Gemini API Key found!');
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: key });

// 1x1 transparent pixel base64 image
const dummyImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

async function testFormat1() {
  console.log('--- Testing Format 1 (Mix of inlineData object and raw string) ---');
  try {
    const contents: any[] = [];
    const matches = dummyImageBase64.match(/^data:(image\/[a-zA-Z+.-]+);base64,(.+)$/);
    if (matches) {
      contents.push({
        inlineData: {
          data: matches[2],
          mimeType: matches[1]
        }
      });
    }
    contents.push('Hello! What color is this image?');

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-lite',
      contents
    });
    console.log('Format 1 Success! Response:', response.text);
  } catch (err: any) {
    console.error('Format 1 FAILED with error:', err.message || err);
  }
}

async function testFormat2() {
  console.log('--- Testing Format 2 (Array of Part objects: inlineData and { text }) ---');
  try {
    const contents: any[] = [];
    const matches = dummyImageBase64.match(/^data:(image\/[a-zA-Z+.-]+);base64,(.+)$/);
    if (matches) {
      contents.push({
        inlineData: {
          data: matches[2],
          mimeType: matches[1]
        }
      });
    }
    contents.push({ text: 'Hello! What color is this image?' });

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-lite',
      contents
    });
    console.log('Format 2 Success! Response:', response.text);
  } catch (err: any) {
    console.error('Format 2 FAILED with error:', err.message || err);
  }
}

async function run() {
  await testFormat1();
  await testFormat2();
}

run();
