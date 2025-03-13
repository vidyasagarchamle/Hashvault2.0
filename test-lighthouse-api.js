// Simple script to test Lighthouse API key validity
require('dotenv').config();
const fetch = require('node-fetch');
const FormData = require('form-data');

async function testApiKey() {
  const apiKey = process.env.NEXT_PUBLIC_LIGHTHOUSE_API_KEY;
  console.log('Testing API Key:', apiKey);
  
  if (!apiKey) {
    console.error('No API key found in .env file');
    return;
  }

  // Try calling the upload endpoint with a test file
  try {
    console.log('Testing upload endpoint...');
    const formData = new FormData();
    // Create a small test buffer instead of using Blob (which is browser-specific)
    const buffer = Buffer.from('test content for lighthouse api test');
    formData.append('file', buffer, { filename: 'test.txt' });
    
    const response = await fetch('https://node.lighthouse.storage/api/v0/add', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      },
      body: formData
    });

    console.log('Status:', response.status);
    const text = await response.text();
    console.log('Response:', text);

    if (response.ok) {
      console.log('✅ API key is valid!');
    } else {
      console.log('❌ API key is invalid or has issues');
      
      // Try without "Bearer" prefix to see if that's the issue
      console.log('\nTrying without Bearer prefix...');
      const formData2 = new FormData();
      formData2.append('file', buffer, { filename: 'test.txt' });
      
      const response2 = await fetch('https://node.lighthouse.storage/api/v0/add', {
        method: 'POST',
        headers: {
          'Authorization': apiKey
        },
        body: formData2
      });
      
      console.log('Status:', response2.status);
      const text2 = await response2.text();
      console.log('Response:', text2);
      
      if (response2.ok) {
        console.log('✅ API key is valid without Bearer prefix!');
      } else {
        console.log('❌ API key is still invalid without Bearer prefix');
      }
    }
  } catch (error) {
    console.error('Error testing API key:', error);
  }
}

testApiKey(); 