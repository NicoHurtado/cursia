const https = require('https');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const apiKey = process.env.ANTHROPIC_API_KEY;

if (!apiKey) {
  console.error('❌ ANTHROPIC_API_KEY not found in environment variables');
  process.exit(1);
}

console.log('🏥 ANTHROPIC API HEALTH CHECK');
console.log('================================');
console.log('📅 Timestamp:', new Date().toISOString());
console.log('🔑 API Key:', apiKey.substring(0, 10) + '...');
console.log('');

// Test different models and scenarios
const tests = [
  {
    name: 'Claude 3.5 Sonnet (Current)',
    model: 'claude-3-5-sonnet-20241022',
    maxTokens: 50,
  },
  {
    name: 'Claude 3.5 Sonnet (Latest)',
    model: 'claude-3-5-sonnet-20240620',
    maxTokens: 50,
  },
  {
    name: 'Claude 3 Haiku (Alternative)',
    model: 'claude-3-haiku-20240307',
    maxTokens: 50,
  },
];

let testIndex = 0;

function runTest(test) {
  return new Promise(resolve => {
    console.log(`🧪 Test ${testIndex + 1}: ${test.name}`);

    const requestBody = {
      model: test.model,
      max_tokens: test.maxTokens,
      messages: [
        {
          role: 'user',
          content: 'Respond with just "OK" to test API health',
        },
      ],
      system: 'You are a health check assistant. Respond briefly.',
    };

    const postData = JSON.stringify(requestBody);

    const options = {
      hostname: 'api.anthropic.com',
      port: 443,
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
        'content-length': Buffer.byteLength(postData),
      },
      timeout: 10000, // 10 second timeout
    };

    const startTime = Date.now();

    const req = https.request(options, res => {
      const responseTime = Date.now() - startTime;

      let data = '';

      res.on('data', chunk => {
        data += chunk;
      });

      res.on('end', () => {
        const result = {
          test: test.name,
          status: res.statusCode,
          responseTime: responseTime,
          headers: res.headers,
          body: data,
          success: res.statusCode === 200,
        };

        if (res.statusCode === 200) {
          console.log(`  ✅ Status: ${res.statusCode}`);
          console.log(`  ⏱️  Response Time: ${responseTime}ms`);
          try {
            const response = JSON.parse(data);
            if (
              response.content &&
              response.content[0] &&
              response.content[0].text
            ) {
              console.log(`  💬 Response: ${response.content[0].text}`);
            }
          } catch (e) {
            console.log(`  ⚠️  Could not parse response JSON`);
          }
        } else {
          console.log(`  ❌ Status: ${res.statusCode}`);
          console.log(`  ⏱️  Response Time: ${responseTime}ms`);
          console.log(`  📝 Error: ${data}`);
        }

        resolve(result);
      });
    });

    req.on('error', error => {
      const responseTime = Date.now() - startTime;
      console.log(`  ❌ Request Error: ${error.message}`);
      console.log(`  ⏱️  Failed after: ${responseTime}ms`);
      resolve({
        test: test.name,
        status: 'ERROR',
        responseTime: responseTime,
        error: error.message,
        success: false,
      });
    });

    req.on('timeout', () => {
      console.log(`  ⏰ Timeout after 10 seconds`);
      req.destroy();
      resolve({
        test: test.name,
        status: 'TIMEOUT',
        responseTime: 10000,
        error: 'Request timeout',
        success: false,
      });
    });

    req.write(postData);
    req.end();
  });
}

async function runAllTests() {
  console.log('🚀 Starting health checks...\n');

  const results = [];

  for (let i = 0; i < tests.length; i++) {
    testIndex = i;
    const result = await runTest(tests[i]);
    results.push(result);
    console.log(''); // Empty line between tests

    // Wait 2 seconds between tests
    if (i < tests.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // Summary
  console.log('📊 HEALTH CHECK SUMMARY');
  console.log('========================');

  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  console.log(`✅ Successful: ${successful}/${results.length}`);
  console.log(`❌ Failed: ${failed}/${results.length}`);
  console.log('');

  if (successful > 0) {
    console.log('🎉 API is partially or fully operational!');
  } else {
    console.log('🚨 API appears to be experiencing issues');
    console.log('');
    console.log('💡 Recommendations:');
    console.log(
      '   - Check Anthropic status page: https://status.anthropic.com'
    );
    console.log('   - Verify API key permissions');
    console.log('   - Try again in a few minutes');
    console.log('   - Use fallback system if available');
  }

  console.log('');
  console.log('📋 Detailed Results:');
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    const time = result.responseTime || 'N/A';
    console.log(`   ${status} ${result.test}: ${result.status} (${time}ms)`);
  });
}

// Run the health check
runAllTests().catch(console.error);



