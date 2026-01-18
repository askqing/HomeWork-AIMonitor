/**
 * 测试支付API功能
 */

import { createPaymentOrder } from './server/api/payment.js'

// 模拟请求对象
const mockReq = {
  ip: '127.0.0.1'
}

// 测试数据
const testOrderData = {
  type: 'alipay',
  method: 'web',
  out_trade_no: 'test_order_' + Date.now(),
  name: '测试商品',
  money: 1.00,
  clientip: '127.0.0.1'
}

// 执行测试
async function runTest() {
  console.log('开始测试支付订单创建功能...')
  console.log('测试数据:', testOrderData)
  
  try {
    const result = await createPaymentOrder(testOrderData, mockReq)
    console.log('测试成功！订单创建结果:', result)
  } catch (error) {
    console.error('测试失败！错误信息:', error.message)
    console.error('详细错误:', error)
  }
}

// 运行测试
runTest()
