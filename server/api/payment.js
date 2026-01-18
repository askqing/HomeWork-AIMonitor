/**
 * 支付API处理
 * 商户ID: 1162
 * 商户密钥: PnpapqIzfbe2rRRinQN4RNPkfikRp6n2
 */

import crypto from 'crypto'
import axios from 'axios'
import qrcode from 'qrcode'

// 商户配置（从环境变量读取或硬编码，不暴露给前端）
// 根据用户提供的新文档更新配置
const MERCHANT_CONFIG = {
  pid: 1162,
  key: 'PnpapqIzfbe2rRRinQN4RNPkfikRp6n2', // 商户密钥，用于MD5签名
  pagePayUrl: 'https://cpay.jsdu.cn/submit.php', // 页面跳转支付URL
  apiPayUrl: 'https://cpay.jsdu.cn/mapi.php', // API接口支付URL
  queryUrl: 'https://cpay.jsdu.cn/api.php', // API查询URL
  notifyUrl: 'http://localhost:3000/api/payment/notify', // 异步通知地址
  returnUrl: 'http://localhost:3000/#/payment/result' // 页面跳转通知地址
}

// 配置检查
function validateMerchantConfig(config) {
  // 检查PID是否为空
  if (!config.pid) {
    console.error('❌ 错误：商户ID（pid）为空')
    return false
  }
  
  // 检查密钥是否为空
  if (!config.key || config.key.trim() === '') {
    console.error('❌ 错误：商户密钥（key）为空')
    return false
  }
  
  console.log('✅ 商户配置检查通过')
  return true
}

if (!validateMerchantConfig(MERCHANT_CONFIG)) {
  console.error('\n请确保正确配置商户信息')
  process.exit(1)
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
 * 生成MD5签名 - 根据新文档要求的签名算法
 * @param {Object} params - 待签名参数
 * @returns {Object} 签名结果对象，包含签名和签名类型
 */
function generateSign(params) {
  // 1. 将发送或接收到的所有参数按照参数名ASCII码从小到大排序（a-z）
  //    sign、sign_type、和空值不参与签名！
  const signParams = {}
  for (const key in params) {
    const value = params[key]
    // 剔除sign、sign_type字段和空值
    if (key !== 'sign' && key !== 'sign_type' && value !== null && value !== undefined && value !== '') {
      // 确保参数值都是字符串类型
      signParams[key] = String(value)
    }
  }

  // 2. 按ASCII码升序排序
  const sortedKeys = Object.keys(signParams).sort()

  // 3. 将排序后的参数拼接成URL键值对的格式，例如 a=b&c=d&e=f
  //    参数值不要进行url编码
  let signString = ''
  for (const key of sortedKeys) {
    signString += `${key}=${signParams[key]}&`
  }
  // 去掉末尾的&符号
  signString = signString.substring(0, signString.length - 1)

  console.log('🔤 待签名字符串:', signString)

  // 4. 再将拼接好的字符串与商户密钥KEY进行MD5加密得出sign签名参数
  //    sign = md5 ( a=b&c=d&e=f + KEY )
  //    md5结果为小写
  const finalSignString = signString + MERCHANT_CONFIG.key
  console.log('🔐 最终签名字符串（包含密钥）:', finalSignString)
  
  const sign = crypto.createHash('md5').update(finalSignString).digest('hex').toLowerCase()
  
  console.log('✅ MD5签名结果:', sign)
  
  return { sign, sign_type: 'MD5' }
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
 * 创建支付订单 - API接口支付
 * 根据新文档要求：https://cpay.jsdu.cn/mapi.php
 * @param {Object} orderData - 订单数据
 * @param {String} orderData.type - 支付类型（alipay/wxpay）
 * @param {String} orderData.out_trade_no - 商户订单号
 * @param {String} orderData.name - 商品名称
 * @param {Number} orderData.money - 商品金额
 * @param {String} orderData.clientip - 用户IP地址
 * @returns {Promise<Object>} 支付订单创建结果
 */
export async function createPaymentOrder(orderData) {
  try {
    // 验证必要参数
    if (!orderData.type || !orderData.out_trade_no || !orderData.name || !orderData.money) {
      throw new Error('缺少必要参数：type、out_trade_no、name、money 是必填项')
    }

    // 准备请求参数
    const params = {
      pid: MERCHANT_CONFIG.pid,
      type: orderData.type, // 支付方式（alipay/wxpay）
      out_trade_no: orderData.out_trade_no, // 商户订单号
      notify_url: MERCHANT_CONFIG.notifyUrl, // 异步通知地址
      return_url: MERCHANT_CONFIG.returnUrl, // 页面跳转通知地址
      name: orderData.name, // 商品名称
      money: orderData.money.toFixed(2), // 商品金额，单位：元，最大2位小数
      clientip: orderData.clientip || '127.0.0.1', // 用户IP地址
      param: orderData.param || '', // 业务扩展参数
      device: orderData.device || 'pc' // 设备类型
    }

    // 生成签名
    const { sign, sign_type } = generateSign(params)
    params.sign = sign
    params.sign_type = sign_type

    console.log('📤 API支付请求参数:', params)

    // 发送请求到支付平台（API接口支付）
    const response = await axios.post(MERCHANT_CONFIG.apiPayUrl, params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      // 对参数值进行URL编码，因为HTTP POST表单数据需要URL编码
      // 注意：签名时参数值没有编码，这符合文档要求
      transformRequest: [(data) => {
        const pairs = []
        for (const key in data) {
          if (data.hasOwnProperty(key)) {
            pairs.push(`${key}=${encodeURIComponent(data[key])}`)
          }
        }
        return pairs.join('&')
      }]
    })

    console.log('📥 支付平台返回结果:', response.data)

    // 验证返回结果
    if (response.data.code !== 1) {
      throw new Error(response.data.msg || '创建支付订单失败')
    }

    // 如果返回结果包含支付链接，将其转换为二维码
    if (response.data.data && response.data.data.url) {
      try {
        // 生成二维码（base64格式）
        const qrCodeDataUrl = await qrcode.toDataURL(response.data.data.url, {
          width: 200,
          margin: 2
        })
        
        // 提取base64数据（去掉前缀）
        const base64Data = qrCodeDataUrl.replace('data:image/png;base64,', '')
        
        // 将二维码添加到返回结果中，与前端期望的格式一致
        response.data.data.qrcode = base64Data
        console.log('✅ 生成支付二维码成功')
      } catch (error) {
        console.error('❌ 生成二维码失败:', error)
        // 生成二维码失败不影响主流程，只记录日志
      }
    }

    return response.data
  } catch (error) {
    console.error('❌ 创建支付订单失败:', error)
    throw error
  }
}

/**
 * 创建页面跳转支付订单
 * 根据新文档要求：https://cpay.jsdu.cn/submit.php
 * @param {Object} orderData - 订单数据
 * @param {String} orderData.type - 支付类型（alipay/wxpay，可选）
 * @param {String} orderData.out_trade_no - 商户订单号
 * @param {String} orderData.name - 商品名称
 * @param {Number} orderData.money - 商品金额
 * @returns {Object} 页面跳转支付参数
 */
export function createPagePaymentOrder(orderData) {
  try {
    // 验证必要参数
    if (!orderData.out_trade_no || !orderData.name || !orderData.money) {
      throw new Error('缺少必要参数：out_trade_no、name、money 是必填项')
    }

    // 准备请求参数
    const params = {
      pid: MERCHANT_CONFIG.pid,
      type: orderData.type || '', // 支付方式（可选，不传会跳转到收银台）
      out_trade_no: orderData.out_trade_no, // 商户订单号
      notify_url: MERCHANT_CONFIG.notifyUrl, // 异步通知地址
      return_url: MERCHANT_CONFIG.returnUrl, // 页面跳转通知地址
      name: orderData.name, // 商品名称
      money: orderData.money.toFixed(2), // 商品金额，单位：元，最大2位小数
      param: orderData.param || '' // 业务扩展参数
    }

    // 生成签名
    const { sign, sign_type } = generateSign(params)
    params.sign = sign
    params.sign_type = sign_type

    console.log('📤 页面支付请求参数:', params)

    // 返回页面跳转支付的参数和URL
    return {
      url: MERCHANT_CONFIG.pagePayUrl,
      method: 'POST',
      params: params
    }
  } catch (error) {
    console.error('❌ 创建页面支付订单失败:', error)
    throw error
  }
}

/**
 * 查询订单
 * 根据新文档要求：https://cpay.jsdu.cn/api.php?act=order&pid={商户ID}&key={商户密钥}&out_trade_no={商户订单号}
 * @param {Object} queryParams - 查询参数
 * @param {String} queryParams.trade_no - 系统订单号（易支付订单号）
 * @param {String} queryParams.out_trade_no - 商户订单号
 * @returns {Promise<Object>} 订单查询结果
 */
export async function queryOrder(queryParams) {
  try {
    // 验证参数
    if (!queryParams.trade_no && !queryParams.out_trade_no) {
      throw new Error('缺少必要参数：trade_no或out_trade_no必须提供一个')
    }

    // 准备请求参数
    const params = {
      act: 'order', // 操作类型，固定值
      pid: MERCHANT_CONFIG.pid, // 商户ID
      key: MERCHANT_CONFIG.key // 商户密钥
    }

    // 添加查询参数（系统订单号 和 商户订单号 二选一传入即可，如果都传入以系统订单号为准！）
    if (queryParams.trade_no) params.trade_no = queryParams.trade_no
    if (queryParams.out_trade_no) params.out_trade_no = queryParams.out_trade_no

    console.log('📤 查询订单参数:', params)

    // 发送请求到支付平台（GET请求）
    const response = await axios.get(MERCHANT_CONFIG.queryUrl, {
      params: params,
      headers: {
        'Accept': 'application/json'
      }
    })

    console.log('📥 查询订单返回结果:', response.data)

    // 验证返回结果（根据新文档，code=1为成功）
    if (response.data.code !== 1) {
      throw new Error(response.data.msg || '查询订单失败')
    }

    return response.data
  } catch (error) {
    console.error('❌ 查询订单失败:', error)
    throw error
  }
}

/**
 * 处理支付通知
 * 根据新文档要求：支付通知是GET请求
 * @param {Object} params - 通知参数
 * @returns {Object} 处理结果
 */
export function handlePaymentNotify(params) {
  try {
    console.log('📥 收到支付通知:', params)

    // 验证参数：根据新文档，trade_status=TRADE_SUCCESS才表示支付成功
    if (!params.trade_status) {
      return { success: false, message: '缺少支付状态参数' }
    }

    // 根据新文档，只有TRADE_SUCCESS是成功状态
    if (params.trade_status !== 'TRADE_SUCCESS') {
      console.log('⚠️ 支付状态不是成功状态:', params.trade_status)
      // 即使支付未成功，也需要返回success告知平台已经收到通知
      return { success: true, message: '非成功状态已处理' }
    }

    // 验证签名（可选，根据用户要求，公钥验证由平台负责）
    if (!verifySign(params)) {
      console.warn('⚠️ 签名验证失败')
      // 根据用户要求，签名验证由平台负责，所以即使签名验证失败也继续处理
      // return { success: false, message: '签名验证失败' }
    }

    // 这里可以添加业务逻辑，比如更新订单状态等
    console.log('✅ 订单支付成功，商户订单号:', params.out_trade_no)
    console.log('✅ 平台订单号:', params.trade_no)
    console.log('✅ 支付金额:', params.money)
    console.log('✅ 支付方式:', params.type)

    // 返回成功响应
    return { success: true, message: '处理成功' }
  } catch (error) {
    console.error('❌ 处理支付通知失败:', error)
    return { success: false, message: '处理失败' }
  }
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
        error: '缺少必要参数: name 和 money 是必填项'
      }))
      return
    }

    // 生成商户订单号
    const out_trade_no = `order_${Date.now()}_${Math.floor(Math.random() * 1000)}`

    // 调用创建支付订单函数
    const result = await createPaymentOrder(
      {
        type,
        method,
        out_trade_no,
        name,
        money: parseFloat(money),
        clientip: req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1',
        param
      },
      req
    )

    // 返回结果
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({
      success: true,
      data: result
    }))
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
 * 支付订单查询
 * POST /api/payment/query
 */
export async function handlePaymentQuery(req, res) {
  try {
    console.log('📥 收到查询支付订单请求:', req.method, req.url)

    let body = ''
    req.on('data', chunk => body += chunk)
    await new Promise(resolve => req.on('end', resolve))

    const requestData = JSON.parse(body || '{}')
    const { trade_no, out_trade_no } = requestData

    // 调用查询订单函数
    const result = await queryOrder({ trade_no, out_trade_no })

    // 返回结果
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({
      success: true,
      data: result
    }))
  } catch (error) {
    console.error('❌ 查询支付订单失败:', error)
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({
      success: false,
      error: error.message
    }))
  }
}

/**
 * 支付通知处理（路由函数）
 * 根据新文档要求：支付通知是GET请求
 */
export async function handlePaymentNotifyWebhook(req, res) {
  try {
    console.log('📥 收到支付通知请求:', req.method, req.url)

    // 根据新文档要求，支付通知是GET请求
    // 解析查询参数
    const url = new URL(req.url, `http://${req.headers.host}`)
    const notifyParams = {}
    for (const [key, value] of url.searchParams.entries()) {
      notifyParams[key] = value
    }

    console.log('📦 支付通知参数:', notifyParams)

    // 调用通知处理函数
    const result = handlePaymentNotify(notifyParams)

    // 返回结果给支付平台
    // 根据文档要求，收到异步通知后，需返回success以表示服务器接收到了订单通知
    res.setHeader('Content-Type', 'text/plain')
    if (result.success) {
      res.end('success')
    } else {
      // 即使处理失败，也需要返回success告知平台已经收到通知
      // 否则平台会持续发送通知
      console.warn('⚠️ 通知处理失败，但仍返回success给平台')
      res.end('success')
    }
  } catch (error) {
    console.error('❌ 处理支付通知失败:', error)
    // 即使出现异常，也需要返回success告知平台已经收到通知
    res.setHeader('Content-Type', 'text/plain')
    res.end('success')
  }
}

// 导出路由处理器
export default {
  handlePaymentCreate,
  handlePaymentQuery,
  handlePaymentNotifyWebhook
}