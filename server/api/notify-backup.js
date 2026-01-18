export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { 
      image, 
      childName, 
      activity, 
      webhook, 
      isTest = false, 
      isMonitorNotification = false,
      status = '' 
    } = body
    
    // 验证必要参数
    if (!childName) {
      throw new Error('缺少孩子姓名')
    }
    
    if (!webhook || !webhook.includes('dingtalk.com')) {
      throw new Error('钉钉Webhook地址格式不正确或未提供')
    }
    
    console.log('📤 发送钉钉通知:', {
      孩子: childName,
      活动: activity,
      状态: status,
      监控通知: isMonitorNotification,
      测试模式: isTest,
      Webhook: webhook.substring(0, 50) + '...'
    })
    
    // 构建钉钉消息
    const dingtalkMessage = buildDingtalkMessage(childName, activity, image, isTest, isMonitorNotification, status)
    
    // 检查消息体大小
    const messageSize = new Blob([JSON.stringify(dingtalkMessage)]).size
    console.log(`消息体大小: ${messageSize} bytes`)
    
    if (messageSize > 20000) {
      console.warn('消息体过大，尝试压缩...')
      // 如果消息体太大，移除图片或进一步压缩
      if (image && image.length > 100) {
        console.log('移除图片以减少消息体大小')
        // 移除图片
        const messageWithoutImage = buildDingtalkMessage(childName, activity, null, isTest, isMonitorNotification, status)
        const newSize = new Blob([JSON.stringify(messageWithoutImage)]).size
        console.log(`移除图片后大小: ${newSize} bytes`)
        
        if (newSize > 20000) {
          throw new Error('消息体仍然过大，请检查其他内容')
        }
        
        // 使用无图片版本
        const result = await sendDingtalkNotification(messageWithoutImage, webhook)
        console.log('✅ 钉钉通知发送成功（无图片版本）:', result)
        
        return {
          success: true,
          messageId: result.messageId,
          timestamp: new Date().toISOString(),
          isTest,
          note: '因消息体过大，已移除图片发送'
        }
      }
    }
    
    // 发送钉钉通知
    const result = await sendDingtalkNotification(dingtalkMessage, webhook)
    
    console.log('✅ 钉钉通知发送成功:', result)
    
    return {
      success: true,
      messageId: result.messageId,
      timestamp: new Date().toISOString(),
      isTest
    }
    
  } catch (error) {
    console.error('❌ 钉钉通知错误:', error)
    
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }
  }
})

// 构建钉钉消息
function buildDingtalkMessage(childName, activity, base64Image, isTest = false, isMonitorNotification = false, status = '') {
  const now = new Date()
  const timeStr = now.toLocaleString('zh-CN')
  
  let title, text
  
  if (isMonitorNotification) {
    // 监控开始/停止通知
    title = status === '开始监控' ? '▶️ 监控开始' : '⏸️ 监控停止'
    text = `#### ${title}\n`
    text += `**孩子：** ${childName}\n\n`
    text += `**状态：** ${status}\n\n`
    text += `**时间：** ${timeStr}\n\n`
    text += `> ${status === '开始监控' ? '系统已开始监控孩子学习状态' : '系统已停止监控'}\n\n`
  } else if (isTest) {
    // 测试通知
    title = '🔔 测试通知'
    text = `#### ${title}\n`
    text += `**孩子：** ${childName}\n\n`
    text += `**状态：** 系统测试通知\n\n`
    text += `**时间：** ${timeStr}\n\n`
    text += `> 这是一条测试通知，用于验证系统通知功能是否正常。\n\n`
  } else {
    // 活动通知
    title = '👨👩👧👦 孩子学习状态提醒'
    text = `#### ${title}\n`
    text += `**孩子：** ${childName}\n\n`
    text += `**状态：** ${activity}\n\n`
    text += `**时间：** ${timeStr}\n\n`
    text += `> 检测到孩子当前活动可能影响学习效果，请关注。\n\n`
  }
  
  text += `**建议：**\n`
  text += `1. 查看孩子当前学习状态\n`
  text += `2. 提醒孩子保持专注\n`
  text += `3. 确保学习环境安静舒适\n\n`
  
  // 如果有图片且不是监控通知，添加图片
  if (base64Image && base64Image.length > 100 && !isMonitorNotification) {
    // 确保图片base64不超过15000字符（约11KB）
    let truncatedImage = base64Image
    if (base64Image.length > 15000) {
      truncatedImage = base64Image.substring(0, 15000)
      console.log(`图片被截断: ${base64Image.length} -> ${truncatedImage.length} 字符`)
    }
    
    text += `**现场截图：**\n`
    text += `![孩子当前状态](data:image/jpeg;base64,${truncatedImage})\n\n`
  }
  
  text += `---\n`
  text += `*来自儿童作业监督系统*\n`
  
  return {
    msgtype: 'markdown',
    markdown: {
      title: title.replace(/[▶️⏸️🔔👨👩👧👦]/g, '').trim(),
      text: text
    },
    at: {
      isAtAll: false
    }
  }
}

// 发送钉钉通知
async function sendDingtalkNotification(message, webhookUrl) {
  console.log('发送到Webhook:', webhookUrl.substring(0, 60) + '...')
  
  // 确保URL格式正确
  let finalUrl = webhookUrl.trim()
  
  // 检查URL是否包含access_token参数
  if (!finalUrl.includes('access_token=')) {
    throw new Error('Webhook地址缺少access_token参数')
  }
  
  // 提取密钥（如果URL中包含）
  const secretMatch = finalUrl.match(/secret=([^&]+)/)
  let secret = null
  if (secretMatch) {
    secret = secretMatch[1]
    // 从URL中移除密钥，避免重复添加
    finalUrl = finalUrl.replace(/[?&]secret=([^&]+)/, '')
  }
  
  // 生成时间戳和签名
  const timestamp = Date.now()
  let sign = ''
  
  if (secret) {
    // 使用HMAC-SHA256生成签名
    const crypto = require('crypto')
    const stringToSign = `${timestamp}\n${secret}`
    const hmac = crypto.createHmac('sha256', secret)
    hmac.update(stringToSign)
    sign = hmac.digest('base64')
    // URL编码
    sign = encodeURIComponent(sign)
  }
  
  // 构建最终URL
  let urlWithParams = finalUrl
  if (timestamp) {
    urlWithParams += `${urlWithParams.includes('?') ? '&' : '?'}timestamp=${timestamp}`
  }
  if (sign) {
    urlWithParams += `&sign=${sign}`
  }
  
  const response = await fetch(urlWithParams, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
    timeout: 10000 // 10秒超时
  })
  
  console.log('钉钉响应状态:', response.status)
  
  if (!response.ok) {
    let errorText = ''
    try {
      errorText = await response.text()
    } catch {
      errorText = '无法读取响应内容'
    }
    
    console.error('钉钉API错误详情:', {
      状态码: response.status,
      状态文本: response.statusText,
      响应体: errorText
    })
    
    // 尝试解析错误信息
    let errorMsg = `钉钉API请求失败: ${response.status}`
    try {
      const errorJson = JSON.parse(errorText)
      if (errorJson.errmsg) {
        errorMsg = errorJson.errmsg
      }
    } catch {
      // 如果不是JSON，使用原始错误文本
      if (errorText) {
        errorMsg += ` - ${errorText}`
      }
    }
    
    throw new Error(errorMsg)
  }
  
  const result = await response.json()
  
  // 检查钉钉返回的错误码
  if (result.errcode !== 0) {
    throw new Error(`钉钉返回错误: ${result.errmsg} (code: ${result.errcode})`)
  }
  
  return result
}