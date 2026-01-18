/**
 * 测试通知功能的脚本
 * 用于验证通知是否能在满足条件时正确发送
 */

const fetch = require('node-fetch');
const fs = require('fs');

// 测试配置
const TEST_CONFIG = {
  API_URL: 'http://localhost:3002/api/analyze',
  // 替换为有效的钉钉Webhook地址
  DINGTALK_WEBHOOK: 'https://oapi.dingtalk.com/robot/send?access_token=YOUR_TOKEN',
  // 测试图片（使用base64编码的小图片）
  TEST_IMAGE: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
};

/**
 * 测试场景1：非学习活动触发通知
 */
async function testDistractionNotification() {
  console.log('\n=== 测试场景1：非学习活动触发通知 ===');
  
  const requestData = {
    image: TEST_IMAGE,
    enablePostureDetection: true,
    enableActivityDetection: true,
    childName: '测试孩子',
    sensitivity: 8,
    webhookUrl: TEST_CONFIG.DINGTALK_WEBHOOK,
    enableAINotifications: true,
    autoSendNotification: true,
    childAge: 10,
    childGender: 'unknown',
    interests: [],
    personalityTraits: [],
    enablePostureNotifications: true,
    enableActivityNotifications: true,
    enablePraiseMessages: true,
    customNotificationRules: {}
  };

  try {
    const response = await fetch(TEST_CONFIG.API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData)
    });

    const result = await response.json();
    console.log('响应结果:', JSON.stringify(result, null, 2));

    if (result.success) {
      if (result.notificationSent) {
        console.log('✅ 测试通过：通知已成功发送');
        console.log('通知决策:', result.notificationDecision);
        console.log('通知结果:', result.notificationResult);
        return true;
      } else {
        console.log('❌ 测试失败：通知未发送');
        console.log('分析结果:', result.activityAnalysis);
        console.log('通知决策:', result.notificationDecision);
        return false;
      }
    } else {
      console.log('❌ 测试失败：API调用失败', result.error);
      return false;
    }
  } catch (error) {
    console.log('❌ 测试失败：请求错误', error.message);
    return false;
  }
}

/**
 * 运行所有测试
 */
async function runAllTests() {
  console.log('开始测试通知功能...');
  
  const tests = [
    testDistractionNotification
    // 可以添加更多测试场景
  ];

  let passedTests = 0;
  let failedTests = 0;

  for (const test of tests) {
    const result = await test();
    if (result) {
      passedTests++;
    } else {
      failedTests++;
    }
  }

  console.log(`\n=== 测试结果 ===`);
  console.log(`总测试数: ${tests.length}`);
  console.log(`通过: ${passedTests}`);
  console.log(`失败: ${failedTests}`);
  
  if (failedTests === 0) {
    console.log('✅ 所有测试通过！通知功能正常工作');
  } else {
    console.log('❌ 部分测试失败，请检查代码');
  }
}

// 运行测试
runAllTests();
