/**
 * 测试全局错误处理系统
 * 运行: bun test-error-handling.js
 */

import { createServer } from './src/server/index.js';

async function testErrorHandling() {
  console.log('🧪 Testing Global Error Handling System...\n');

  const app = createServer();

  const tests = [
    {
      name: 'Test 404 Not Found (API)',
      path: '/api/non-existent',
      expectedStatus: 404,
    },
    {
      name: 'Test Invalid Route (SPA fallback)',
      path: '/invalid-route-12345',
      expectedStatus: 200, // SPA fallback returns index.html
      isHtml: true,
    },
    {
      name: 'Test API Health',
      path: '/api/health',
      expectedStatus: 200,
    },
  ];

  const results = [];

  for (const test of tests) {
    try {
      const request = new Request(`http://localhost:3000${test.path}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      const response = await app.fetch(request);
      const status = response.status;

      // 对于 SPA fallback，检查是否返回 HTML
      let passed = status === test.expectedStatus;
      if (test.isHtml && passed) {
        const body = await response.text();
        if (!body.includes('<!doctype html>') && !body.includes('<html')) {
          passed = false;
        }
      }

      results.push({
        name: test.name,
        path: test.path,
        expected: test.expectedStatus,
        actual: status,
        passed,
      });

      if (passed) {
        console.log(`✅ ${test.name}`);
        console.log(`   Path: ${test.path}`);
        console.log(`   Status: ${status}\n`);
      } else {
        console.log(`❌ ${test.name}`);
        console.log(`   Path: ${test.path}`);
        console.log(`   Expected: ${test.expectedStatus}${test.isHtml ? ' (HTML)' : ''}`);
        console.log(`   Actual: ${status}\n`);

        // 打印响应体用于调试
        const body = await response.text();
        console.log(`   Response: ${body.substring(0, 200)}...\n`);
      }
    } catch (error) {
      console.log(`❌ ${test.name} - Exception: ${error.message}\n`);
      results.push({
        name: test.name,
        path: test.path,
        expected: test.expectedStatus,
        actual: 'ERROR',
        passed: false,
      });
    }
  }

  // 总结
  console.log('='.repeat(50));
  console.log('Test Summary:');
  console.log('='.repeat(50));

  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  const percentage = Math.round((passed / total) * 100);

  console.log(`Passed: ${passed}/${total} (${percentage}%)`);
  console.log(`Failed: ${total - passed}/${total}\n`);

  if (passed === total) {
    console.log('🎉 All tests passed! Error handling system is working correctly.');
    process.exit(0);
  } else {
    console.log('⚠️  Some tests failed. Please review the errors above.');
    process.exit(1);
  }
}

// 运行测试
testErrorHandling().catch(error => {
  console.error('Test suite failed:', error);
  process.exit(1);
});