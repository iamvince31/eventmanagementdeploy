// Simple Node.js test for file upload CORS
const FormData = require('form-data');
const fs = require('fs');
const https = require('https');
const http = require('http');

// Test both localhost and production
const endpoints = [
    'http://localhost:8000/api/test-upload',
    'https://eventmanagement-backend-z7ek.onrender.com/api/test-upload'
];

// Create a simple test file
const testContent = Buffer.from('test image content');

async function testEndpoint(url) {
    return new Promise((resolve, reject) => {
        const form = new FormData();
        form.append('images[]', testContent, {
            filename: 'test.png',
            contentType: 'image/png'
        });
        form.append('title', 'Test Event');
        
        const isHttps = url.startsWith('https');
        const client = isHttps ? https : http;
        
        const options = {
            method: 'POST',
            headers: {
                ...form.getHeaders(),
                'Origin': 'http://localhost:5173'
            }
        };
        
        const req = client.request(url, options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                resolve({
                    status: res.statusCode,
                    headers: res.headers,
                    body: data
                });
            });
        });
        
        req.on('error', reject);
        form.pipe(req);
    });
}

async function runTests() {
    console.log('Testing CORB fix...\n');
    
    for (const endpoint of endpoints) {
        console.log(`Testing: ${endpoint}`);
        try {
            const result = await testEndpoint(endpoint);
            console.log(`✅ Status: ${result.status}`);
            console.log(`✅ CORS Headers:`);
            console.log(`   Access-Control-Allow-Origin: ${result.headers['access-control-allow-origin'] || 'NOT SET'}`);
            console.log(`   Content-Type: ${result.headers['content-type'] || 'NOT SET'}`);
            console.log(`✅ Response: ${result.body.substring(0, 200)}...\n`);
        } catch (error) {
            console.log(`❌ Error: ${error.message}\n`);
        }
    }
}

if (require.main === module) {
    runTests();
}

module.exports = { testEndpoint };