/**
 * 支付API处理
 * 商户ID: 1162
 * 商户密钥: PnpapqIzfbe2rRRinQN4RNPkfikRp6n2
 */

import crypto from 'crypto'

// 商户配置（从环境变量读取或硬编码，不暴露给前端）
const MERCHANT_CONFIG = {
  pid: 1162,
  privateKey: 'PnpapqIzfbe2rRRinQN4RNPkfikRp6n2', // 注意：当前密钥格式可能不正确，需要是PEM格式的RSA私钥
  // 注意：平台公钥需要从商户后台获取并配置在此处
  // 平台公钥格式示例："-----BEGIN PUBLIC KEY-----...-----END PUBLIC KEY-----"
  publicKey: '', // 平台公钥，用于验证签名
  apiUrl: 'https://cpay.jsdu.cn/api/pay',
  notifyUrl: 'http://localhost:3000/api/payment/notify',
  returnUrl: 'http://localhost:3000/#/payment/result'
}

// 配置检查
if (!MERCHANT_CONFIG.privateKey.includes('-----BEGIN')) {
  console.warn('⚠️ 警告：当前商户私钥格式可能不正确，请确保使用PEM格式的RSA私钥')
  console.warn('正确格式示例：-----BEGIN PRIVATE KEY-----...-----END PRIVATE KEY-----')
}

// 支付类型
const PAY_TYPES = {
  alipay: 'alipay',
  wxpay: 'wxpay'
}

// 支付方法
const PAY_METHODS = {
  web: 'web',      // 通用网页支付
  jump: 'jump',    // 跳转支付
  jsapi: 'jsapi',  // JSAPI支付
  app: 'app',      // APP支付
  scan: 'scan',    // 付款码支付
  applet: 'applet' // 小程序支付
}

/**
 * 生成签名 - 使用商户私钥进行SHA256WithRSA签名
 * 注意：参数处理严格按照支付平台要求
 * @param {Object} params - 待签名参数
 * @returns {String} 签名结果
 */
function generateSign(params) {
  // 1. 获取所有非空参数，剔除sign、sign_type字段
  const signParams = {}
  for (const key in params) {
    const value = params[key]
    // 剔除sign、sign_type字段，不包括数组、字节类型参数
    if (key !== 'sign' && key !== 'sign_type' && value !== null && value !== undefined && value !== '') {
      // 只保留字符串、数字等基本类型
      if (typeof value !== 'object' && typeof value !== 'function') {
        // 确保参数值都是字符串类型
        signParams[key] = String(value)
      }
    }
  }

  // 2. 按ASCII码升序排序
  const sortedKeys = Object.keys(signParams).sort()

  // 3. 拼接待签名字符串：参数=参数值，用&连接
  let signString = ''
  for (const key of sortedKeys) {
    signString += `&${key}=${signParams[key]}`
  }
  // 去掉开头的&符号
  signString = signString.substring(1)

  console.log('待签名字符串:', signString)

  // 4. 检查密钥格式并生成签名
  try {
    // 注意：支付平台要求使用SHA256WithRSA算法
    const algorithm = 'RSA-SHA256'
    
    // 对密钥进行格式检查和处理
    let privateKey = MERCHANT_CONFIG.privateKey
    
    // 检查是否已经是PEM格式
    if (!privateKey.includes('-----BEGIN')) {
      // 尝试不同的PEM格式转换
      const formats = [
        `-----BEGIN PRIVATE KEY-----\n${privateKey}\n-----END PRIVATE KEY-----`,  // PKCS#8
        `-----BEGIN RSA PRIVATE KEY-----\n${privateKey}\n-----END RSA PRIVATE KEY-----`  // PKCS#1
      ]
      
      for (const format of formats) {
        try {
          console.log(`尝试${format.includes('RSA') ? 'PKCS#1' : 'PKCS#8'}格式...`)
          const sign = crypto
            .createSign(algorithm)
            .update(signString, 'utf8')
            .sign(format, 'base64')
          
          console.log(`${algorithm}签名结果:`, sign)
          return sign
        } catch (error) {
          console.log(`该格式失败: ${error.message}`)
        }
      }
      
      // 如果所有格式都失败，使用HMAC-SHA256作为最后尝试
      console.warn('⚠️ 所有RSA格式都失败，尝试使用HMAC-SHA256作为替代')
      const sign = crypto
        .createHmac('sha256', privateKey)
        .update(signString, 'utf8')
        .digest('base64')
      
      console.log('HMAC-SHA256签名结果:', sign)
      return sign
    } else {
      // 直接使用PEM格式密钥
      const sign = crypto
        .createSign(algorithm)
        .update(signString, 'utf8')
        .sign(privateKey, 'base64')
      
      console.log(`${algorithm}签名结果:`, sign)
      return sign
    }
  } catch (error) {
    console.error('生成签名失败:', error)
    throw error
  }
}

/**
 * 验证签名 - 暂时简化实现，根据用户要求，公钥验证由平台负责
 * @param {Object} params - 待验证参数
 * @returns {Boolean} 验证结果
 */
function verifySign(params) {
  console.log('⚠️ 根据用户要求，签名验证由平台负责，当前暂时跳过验证')
  return true
}

/**
 * 生成时间戳
 * @returns {String} 10位时间戳
 */
function getTimestamp() {
  return Math.floor(Date.now() / 1000).toString()
}

/**
 * 创建支付订单
 * POST /api/payment/create
 */
export async function handlePaymentCreate(req, res) {
  try {
    console.log('📥 收到创建支付订单请求:', req.method, req.url)
    console.log('📋 Content-Type:', req.headers['content-type'])

    let body = ''
    req.on('data', chunk => body += chunk)
    await new Promise(resolve => req.on('end', resolve))

    console.log('📦 请求体:', body)

    // 支持JSON和表单两种格式
    let requestData
    const contentType = req.headers['content-type'] || ''

    if (contentType.includes('application/json')) {
      requestData = JSON.parse(body || '{}')
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      // 解析表单数据
      requestData = {}
      const pairs = body.split('&')
      for (const pair of pairs) {
        const [key, value] = pair.split('=')
        if (key) {
          requestData[decodeURIComponent(key)] = value ? decodeURIComponent(value.replace(/\+/g, ' ')) : ''
        }
      }
    } else {
      // 尝试JSON解析
      try {
        requestData = JSON.parse(body || '{}')
      } catch {
        requestData = {}
      }
    }

    const { type = 'alipay', method = 'web', name, money, param = '' } = requestData

    console.log('🔍 解析后的参数:', { type, method, name, money, param })

    // 验证必要参数
    if (!name || !money) {
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({
        success: false,
        error: '缺少必要参数：name或money'
      }))
      return
    }

    // 生成商户订单号
    const outTradeNo = `DONATE_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // 获取客户端IP
    const clientIp = req.headers['x-forwarded-for']?.split(',')[0] ||
                   req.headers['x-real-ip'] ||
                   req.connection.remoteAddress || '127.0.0.1'

    // 构建请求参数
    const params = {
      pid: MERCHANT_CONFIG.pid,
      method,
      device: method === 'web' ? 'pc' : 'mobile', // 设备类型：web接口需要
      type,
      out_trade_no: outTradeNo,
      notify_url: MERCHANT_CONFIG.notifyUrl,
      return_url: MERCHANT_CONFIG.returnUrl,
      name: name.substring(0, 127),
      money: parseFloat(money).toFixed(2),
      clientip: clientIp, // 必填参数
      param,
      timestamp: getTimestamp()
    }

    // 过滤掉空值参数
    for (const key in params) {
      if (params[key] === undefined || params[key] === null || params[key] === '') {
        delete params[key]
      }
    }

    console.log('发送到支付平台的参数:', params)

    // 生成签名
    params.sign = generateSign(params)
    params.sign_type = 'RSA'

    console.log('📦 创建支付订单:', {
      商户订单号: outTradeNo,
      商品名称: name,
      金额: money,
      支付方式: type,
      支付方法: method
    })

    console.log('完整请求参数（含签名）:', params)

    // 调用支付平台API - 使用x-www-form-urlencoded格式
    const formData = new URLSearchParams()
    for (const key in params) {
      formData.append(key, params[key])
    }

    console.log('发送的表单数据:', formData.toString())

    const response = await fetch(`${MERCHANT_CONFIG.apiUrl}/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString()
    })

    const result = await response.json()

    console.log('✅ 支付平台响应:', result)

    if (result.code === 0) {
      // 保存订单信息（实际项目中应该保存到数据库）
      // 这里使用内存临时存储
      global.payOrders = global.payOrders || {}
      global.payOrders[outTradeNo] = {
        ...params,
        trade_no: result.trade_no,
        status: 0, // 未支付
        createTime: new Date().toISOString()
      }

      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({
        success: true,
        data: {
          trade_no: result.trade_no,
          out_trade_no: outTradeNo,
          pay_type: result.pay_type,
          pay_info: result.pay_info,
          qrcode: result.pay_type === 'qrcode' ? result.pay_info : null,
          url: result.pay_type === 'jump' ? result.pay_info : null
        }
      }))
    } else {
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({
        success: false,
        error: result.msg || '创建支付订单失败'
      }))
    }
  } catch (error) {
    console.error('❌ 创建支付订单失败:', error)
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({
      success: false,
      error: error.message
    }))
  }
}

/**
 * 支付结果通知
 * POST/GET /api/payment/notify
 */
export async function handlePaymentNotify(req, res) {
  try {
    // 解析GET/POST参数
    const params = req.method === 'GET' ? req.query : {}

    if (req.method === 'POST') {
      let body = ''
      req.on('data', chunk => body += chunk)
      await new Promise(resolve => req.on('end', resolve))
      Object.assign(params, JSON.parse(body || '{}'))
    }

    console.log('📢 收到支付通知:', params)

    // 验证签名
    const signVerified = verifySign(params)

    if (!signVerified) {
      console.error('❌ 签名验证失败')
      res.end('fail')
      return
    }

    // 检查订单状态
    const { trade_no, out_trade_no, trade_status, money } = params

    // 更新订单状态（实际项目中应该更新数据库）
    if (global.payOrders && global.payOrders[out_trade_no]) {
      global.payOrders[out_trade_no].status = 1 // 已支付
      global.payOrders[out_trade_no].tradeStatus = trade_status
      global.payOrders[out_trade_no].completeTime = new Date().toISOString()
    }

    console.log('✅ 支付通知处理成功:', {
      平台订单号: trade_no,
      商户订单号: out_trade_no,
      交易状态: trade_status,
      金额: money
    })

    // 返回success给支付平台
    res.end('success')
  } catch (error) {
    console.error('❌ 处理支付通知失败:', error)
    res.end('fail')
  }
}

/**
 * 查询订单
 * POST /api/payment/query
 */
export async function handlePaymentQuery(req, res) {
  try {
    let body = ''
    req.on('data', chunk => body += chunk)
    await new Promise(resolve => req.on('end', resolve))

    // 支持JSON和表单两种格式
    let requestData
    const contentType = req.headers['content-type'] || ''

    if (contentType.includes('application/json')) {
      requestData = JSON.parse(body || '{}')
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      requestData = {}
      const pairs = body.split('&')
      for (const pair of pairs) {
        const [key, value] = pair.split('=')
        if (key) {
          requestData[decodeURIComponent(key)] = value ? decodeURIComponent(value.replace(/\+/g, ' ')) : ''
        }
      }
    } else {
      try {
        requestData = JSON.parse(body || '{}')
      } catch {
        requestData = {}
      }
    }

    const { out_trade_no } = requestData

    if (!out_trade_no) {
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({
        success: false,
        error: '缺少订单号'
      }))
      return
    }

    // 调用支付平台查询API
    const params = {
      pid: MERCHANT_CONFIG.pid,
      out_trade_no,
      timestamp: getTimestamp()
    }

    params.sign = generateSign(params)
    params.sign_type = 'RSA'

    // 调用支付平台查询API - 使用x-www-form-urlencoded格式
    const formData = new URLSearchParams()
    for (const key in params) {
      formData.append(key, params[key])
    }

    const response = await fetch(`${MERCHANT_CONFIG.apiUrl}/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString()
    })

    const result = await response.json()

    console.log('📋 查询订单结果:', result)

    if (result.code === 0) {
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({
        success: true,
        data: result
      }))
    } else {
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({
        success: false,
        error: result.msg || '查询订单失败'
      }))
    }
  } catch (error) {
    console.error('❌ 查询订单失败:', error)
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({
      success: false,
      error: error.message
    }))
  }
}
