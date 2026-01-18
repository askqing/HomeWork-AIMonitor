// 完整调试支付请求
import crypto from 'crypto';
import fetch from 'node-fetch';

// 模拟商户配置
const MERCHANT_CONFIG = {
  pid: 1162,
  privateKey: 'PnpapqIzfbe2rRRinQN4RNPkfikRp6n2', // 商户密钥
  apiUrl: 'https://cpay.jsdu.cn/api/pay',
  notifyUrl: 'http://localhost:3000/api/payment/notify',
  returnUrl: 'http://localhost:3000/#/payment/result'
};

/**
 * 生成签名 - 尝试不同的算法
 */
function generateSign(params, algorithm) {
  console.log(`\n=== 生成${algorithm}签名 ===`);
  
  // 1. 获取所有非空参数，剔除sign、sign_type字段
  const signParams = {};
  for (const key in params) {
    const value = params[key];
    if (key !== 'sign' && key !== 'sign_type' && value !== null && value !== undefined && value !== '') {
      if (typeof value !== 'object' && typeof value !== 'function') {
        signParams[key] = value;
      }
    }
  }

  // 2. 按ASCII码升序排序
  const sortedKeys = Object.keys(signParams).sort();

  // 3. 拼接待签名字符串：参数=参数值，用&连接
  const signString = sortedKeys
    .map(key => `${key}=${signParams[key]}`)
    .join('&');

  console.log('待签名字符串:', signString);

  let sign;
  try {
    switch (algorithm) {
      case 'HMAC-SHA256':
        sign = crypto
          .createHmac('sha256', MERCHANT_CONFIG.privateKey)
          .update(signString, 'utf8')
          .digest('base64');
        break;
      case 'MD5':
        const signStringWithKey = signString + MERCHANT_CONFIG.privateKey;
        sign = crypto
          .createHash('md5')
          .update(signStringWithKey, 'utf8')
          .digest('hex')
          .toUpperCase();
        break;
      default:
        throw new Error(`不支持的算法: ${algorithm}`);
    }
    
    console.log(`${algorithm}签名结果:`, sign);
    return sign;
  } catch (error) {
    console.error(`${algorithm}签名失败:`, error);
    throw error;
  }
}

/**
 * 发送支付请求
 */
async function sendPaymentRequest(algorithm, signType) {
  console.log(`\n\n=== 发送支付请求 - ${algorithm}/${signType} ===`);
  
  // 生成商户订单号
  const outTradeNo = `DONATE_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // 构建请求参数
  const params = {
    pid: MERCHANT_CONFIG.pid,
    method: 'web',
    device: 'pc',
    type: 'alipay',
    out_trade_no: outTradeNo,
    notify_url: MERCHANT_CONFIG.notifyUrl,
    return_url: MERCHANT_CONFIG.returnUrl,
    name: '儿童作业监控系统-捐助',
    money: '0.01', // 使用最小金额测试
    clientip: '127.0.0.1',
    param: 'donate',
    timestamp: Math.floor(Date.now() / 1000).toString()
  };
  
  // 生成签名
  params.sign = generateSign(params, algorithm);
  params.sign_type = signType;
  
  console.log('完整请求参数:', params);
  
  // 转换为表单数据
  const formData = new URLSearchParams();
  for (const key in params) {
    formData.append(key, params[key]);
  }
  
  console.log('发送的表单数据:', formData.toString());
  
  try {
    // 发送请求
    const response = await fetch(`${MERCHANT_CONFIG.apiUrl}/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString()
    });
    
    const result = await response.json();
    console.log('支付平台响应:', result);
    
    return result;
  } catch (error) {
    console.error('请求失败:', error);
    throw error;
  }
}

/**
 * 主函数
 */
async function main() {
  console.log('=== 支付请求调试 ===');
  
  try {
    // 测试1: HMAC-SHA256 + RSA
    await sendPaymentRequest('HMAC-SHA256', 'RSA');
    
    // 测试2: MD5 + MD5
    await sendPaymentRequest('MD5', 'MD5');
    
  } catch (error) {
    console.error('调试失败:', error);
  }
}

// 运行测试
main();