// 调试签名生成逻辑
import crypto from 'crypto';

// 模拟商户配置
const MERCHANT_CONFIG = {
  pid: 1162,
  privateKey: 'PnpapqIzfbe2rRRinQN4RNPkfikRp6n2', // 商户密钥
  apiUrl: 'https://cpay.jsdu.cn/api/pay'
};

// 模拟请求参数
const params = {
  pid: MERCHANT_CONFIG.pid,
  method: 'web',
  device: 'pc',
  type: 'alipay',
  out_trade_no: 'DONATE_1768714486357_f7zuerak4',
  notify_url: 'http://localhost:3000/api/payment/notify',
  return_url: 'http://localhost:3000/#/payment/result',
  name: '儿童作业监控系统-捐助',
  money: '10.00',
  clientip: '::1',
  param: 'donate',
  timestamp: '1768714486'
};

/**
 * 生成签名 - 测试不同的签名算法
 */
function testSignatures() {
  console.log('=== 签名算法测试 ===');
  console.log('原始参数:', params);
  
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
  console.log('');

  // 测试1: HMAC-SHA256签名
  console.log('1. HMAC-SHA256签名:');
  try {
    const hmacSign = crypto
      .createHmac('sha256', MERCHANT_CONFIG.privateKey)
      .update(signString, 'utf8')
      .digest('base64');
    console.log('   结果:', hmacSign);
  } catch (error) {
    console.error('   错误:', error.message);
  }
  console.log('');

  // 测试2: RSA-SHA256签名（尝试不同的密钥格式）
  console.log('2. RSA-SHA256签名:');
  try {
    // 尝试1: 直接使用提供的密钥
    let privateKey = MERCHANT_CONFIG.privateKey;
    const rsaSign1 = crypto
      .createSign('RSA-SHA256')
      .update(signString, 'utf8')
      .sign(privateKey, 'base64');
    console.log('   直接使用密钥:', rsaSign1);
  } catch (error) {
    console.error('   直接使用密钥错误:', error.message);
  }

  try {
    // 尝试2: 添加PKCS#8格式头
    let privateKey = `-----BEGIN PRIVATE KEY-----\n${MERCHANT_CONFIG.privateKey}\n-----END PRIVATE KEY-----`;
    const rsaSign2 = crypto
      .createSign('RSA-SHA256')
      .update(signString, 'utf8')
      .sign(privateKey, 'base64');
    console.log('   PKCS#8格式:', rsaSign2);
  } catch (error) {
    console.error('   PKCS#8格式错误:', error.message);
  }

  try {
    // 尝试3: 添加PKCS#1格式头
    let privateKey = `-----BEGIN RSA PRIVATE KEY-----\n${MERCHANT_CONFIG.privateKey}\n-----END RSA PRIVATE KEY-----`;
    const rsaSign3 = crypto
      .createSign('RSA-SHA256')
      .update(signString, 'utf8')
      .sign(privateKey, 'base64');
    console.log('   PKCS#1格式:', rsaSign3);
  } catch (error) {
    console.error('   PKCS#1格式错误:', error.message);
  }
  console.log('');

  // 测试3: MD5签名（原始算法）
  console.log('3. MD5签名:');
  try {
    const signStringWithKey = signString + MERCHANT_CONFIG.privateKey;
    const md5Sign = crypto
      .createHash('md5')
      .update(signStringWithKey, 'utf8')
      .digest('hex')
      .toUpperCase();
    console.log('   结果:', md5Sign);
  } catch (error) {
    console.error('   错误:', error.message);
  }
}

// 运行测试
testSignatures();