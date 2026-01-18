/**
 * 增强的AI智能通知API
 * 集成AI通知触发逻辑和消息生成系统
 */

import { decideNotification, getNotificationStats } from './notification-trigger.js'
import { generateAIMessage, getMessageStats } from './message-generator.js'

// 消息频率控制相关变量
const messageFrequencyControl = {
  // 每分钟最大消息数
  MAX_MESSAGES_PER_MINUTE: 20,
  // 当前消息计数
  currentMessageCount: 0,
  // 重置计时器
  resetTimer: null,
  // 暂停标志
  isPaused: false,
  // 暂停结束时间
  pauseEndTime: null,
  // 消息队列
  messageQueue: [],
  // 机器人Webhook到消息计数器的映射
  webhookCounters: new Map(),
  // 机器人Webhook到消息队列的映射
  webhookQueues: new Map(),
  // 机器人Webhook到暂停状态的映射
  webhookPaused: new Map(),
  // 机器人Webhook到暂停结束时间的映射
  webhookPauseEndTime: new Map()
}

// 初始化或重置特定Webhook的计数器
function initWebhookCounter(webhookUrl) {
  const counter = {
    messageCount: 0,
    lastResetTime: Date.now(),
    timer: null
  }
  messageFrequencyControl.webhookCounters.set(webhookUrl, counter)
  
  // 初始化队列
  if (!messageFrequencyControl.webhookQueues.has(webhookUrl)) {
    messageFrequencyControl.webhookQueues.set(webhookUrl, [])
  }
  
  // 设置每分钟重置定时器
  if (counter.timer) {
    clearInterval(counter.timer)
  }
  counter.timer = setInterval(() => {
    counter.messageCount = 0
    counter.lastResetTime = Date.now()
    
    // 检查是否有暂停的Webhook
    if (messageFrequencyControl.webhookPaused.get(webhookUrl)) {
      const pauseEndTime = messageFrequencyControl.webhookPauseEndTime.get(webhookUrl)
      if (Date.now() >= pauseEndTime) {
        // 暂停时间结束，恢复发送
        messageFrequencyControl.webhookPaused.set(webhookUrl, false)
        messageFrequencyControl.webhookPauseEndTime.set(webhookUrl, null)
        // 处理队列中的消息
        processMessageQueue(webhookUrl)
      }
    } else {
      // 处理队列中的消息
      processMessageQueue(webhookUrl)
    }
  }, 60000) // 每分钟重置一次
}

// 获取特定Webhook的计数器
function getWebhookCounter(webhookUrl) {
  if (!messageFrequencyControl.webhookCounters.has(webhookUrl)) {
    initWebhookCounter(webhookUrl)
  }
  return messageFrequencyControl.webhookCounters.get(webhookUrl)
}

// 增加消息计数
function incrementMessageCount(webhookUrl) {
  const counter = getWebhookCounter(webhookUrl)
  counter.messageCount++
  return counter.messageCount
}

// 检查是否可以发送消息
function canSendMessage(webhookUrl) {
  // 检查是否暂停
  if (messageFrequencyControl.webhookPaused.get(webhookUrl)) {
    const pauseEndTime = messageFrequencyControl.webhookPauseEndTime.get(webhookUrl)
    return Date.now() >= pauseEndTime
  }
  
  // 检查消息计数
  const counter = getWebhookCounter(webhookUrl)
  return counter.messageCount < messageFrequencyControl.MAX_MESSAGES_PER_MINUTE
}

// 暂停消息发送
function pauseMessageSending(webhookUrl, duration = 60000) {
  messageFrequencyControl.webhookPaused.set(webhookUrl, true)
  messageFrequencyControl.webhookPauseEndTime.set(webhookUrl, Date.now() + duration)
}

// 发送风控提示消息
async function sendRiskControlMessage(webhookUrl) {
  const riskMessage = {
    msgtype: 'text',
    text: {
      content: '因钉钉安全策略，机器人被风控，1分钟后恢复发送'
    },
    at: {
      isAtAll: false
    }
  }
  
  try {
    // 直接发送，不计算在消息计数内
    await sendDingtalkNotificationDirect(riskMessage, webhookUrl)
    console.log('📤 风控提示消息发送成功')
    return true
  } catch (error) {
    console.error('❌ 风控提示消息发送失败:', error)
    return false
  }
}

// 将消息添加到队列
function addToMessageQueue(webhookUrl, message, options = {}) {
  const queue = messageFrequencyControl.webhookQueues.get(webhookUrl) || []
  
  const queuedMessage = {
    message,
    timestamp: Date.now(),
    priority: options.priority || 'normal',
    callback: options.callback || null
  }
  
  // 按优先级排序：high > medium > normal > low
  queue.push(queuedMessage)
  queue.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, normal: 2, low: 3 }
    return priorityOrder[a.priority] - priorityOrder[b.priority]
  })
  
  messageFrequencyControl.webhookQueues.set(webhookUrl, queue)
  console.log(`📥 消息已添加到队列，当前队列长度: ${queue.length}`)
}

// 处理消息队列
async function processMessageQueue(webhookUrl) {
  // 如果暂停或不可发送，返回
  if (messageFrequencyControl.webhookPaused.get(webhookUrl)) {
    return
  }
  
  const queue = messageFrequencyControl.webhookQueues.get(webhookUrl) || []
  
  while (queue.length > 0 && canSendMessage(webhookUrl)) {
    const nextMessage = queue.shift()
    try {
      // 发送消息
      const result = await sendDingtalkNotificationDirect(nextMessage.message, webhookUrl)
      incrementMessageCount(webhookUrl)
      console.log('📤 队列消息发送成功')
      
      // 调用回调
      if (nextMessage.callback) {
        nextMessage.callback(null, result)
      }
    } catch (error) {
      console.error('❌ 队列消息发送失败:', error)
      // 调用回调
      if (nextMessage.callback) {
        nextMessage.callback(error)
      }
    }
  }
  
  // 更新队列
  messageFrequencyControl.webhookQueues.set(webhookUrl, queue)
}

export default async function handleNotify(req, res) {
  try {
    let body = ''
    req.on('data', chunk => body += chunk)
    await new Promise(resolve => req.on('end', resolve))
    body = JSON.parse(body || '{}')
    const { 
      image, 
      childName, 
      activity, 
      webhook, 
      isTest = false, 
      isMonitorNotification = false,
      status = '',
      // 新增AI相关参数
      analysisResult = null,
      enableAINotifications = true,
      childAge = 10,
      childGender = 'unknown',
      interests = [],
      personalityTraits = [],
      sensitivity = 7,
      enablePostureNotifications = true,
      enableActivityNotifications = true,
      enablePraiseMessages = true,
      customNotificationRules = {}
    } = body
    
    // 验证必要参数
    if (!childName) {
      throw new Error('缺少孩子姓名')
    }
    
    if (!webhook || !webhook.includes('dingtalk.com')) {
      throw new Error('钉钉Webhook地址格式不正确或未提供')
    }
    
    console.log('📤 发送AI智能通知:', {
      孩子: childName,
      年龄: childAge,
      活动: activity,
      状态: status,
      监控通知: isMonitorNotification,
      测试模式: isTest,
      AI通知: enableAINotifications,
      Webhook: webhook.substring(0, 50) + '...'
    })
    
    let finalMessage
    let notificationDecision = null
    
    // 如果启用AI通知且有分析结果，使用AI智能通知系统
    if (enableAINotifications && analysisResult && !isTest) {
      try {
        // 使用AI通知触发逻辑决定是否发送通知
        notificationDecision = decideNotification(analysisResult, {
          childName,
          enablePostureNotifications,
          enableActivityNotifications,
          enablePraiseMessages,
          sensitivity,
          customRules: customNotificationRules
        })
        
        console.log('AI通知决策:', {
          应该通知: notificationDecision.shouldNotify,
          通知类型: notificationDecision.notificationType,
          消息类型: notificationDecision.metadata?.type,
          优先级: notificationDecision.priority,
          原因: notificationDecision.reason
        })
        
        if (notificationDecision.shouldNotify) {
          // 使用AI消息生成系统生成个性化消息
          const messageObject = await generateAIMessage(
            notificationDecision,
            analysisResult,
            {
              childName,
              childAge,
              childGender,
              interests,
              personalityTraits,
              timeContext: 'unknown'
            }
          )
          
          console.log('AI生成消息:', {
            内容: messageObject.content.substring(0, 50) + '...',
            类型: messageObject.type,
            个性化: messageObject.personalized,
            表情: messageObject.emoji
          })
          
          // 构建钉钉消息
          finalMessage = buildAIDingtalkMessage(
            childName,
            messageObject,
            image,
            notificationDecision,
            analysisResult
          )
    } else {
      // 不需要发送通知
      const responseData = {
        success: true,
        notificationSent: false,
        reason: notificationDecision.reason,
        timestamp: new Date().toISOString(),
        notificationStats: getNotificationStats(),
        messageStats: getMessageStats()
      }
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify(responseData))
      return
    }
      } catch (error) {
        console.error('AI通知系统错误，降级到传统通知:', error)
        // 降级到传统通知方式
        finalMessage = buildDingtalkMessage(childName, activity, image, isTest, isMonitorNotification, status)
      }
    } else {
      // 使用传统通知方式
      finalMessage = buildDingtalkMessage(childName, activity, image, isTest, isMonitorNotification, status)
    }
    
    // 检查消息体大小
    const messageSize = new Blob([JSON.stringify(finalMessage)]).size
    console.log(`消息体大小: ${messageSize} bytes`)
    
    if (messageSize > 20000) {
      console.warn('消息体过大，尝试压缩...')
      // 如果消息体太大，移除图片或进一步压缩
      if (image && image.length > 100) {
        console.log('移除图片以减少消息体大小')
        // 移除图片
        const messageWithoutImage = notificationDecision 
          ? buildAIDingtalkMessage(childName, notificationDecision.messageObject, null, notificationDecision, analysisResult)
          : buildDingtalkMessage(childName, activity, null, isTest, isMonitorNotification, status)
        
        const newSize = new Blob([JSON.stringify(messageWithoutImage)]).size
        console.log(`移除图片后大小: ${newSize} bytes`)
        
        if (newSize > 20000) {
          throw new Error('消息体仍然过大，请检查其他内容')
        }
        
        // 使用无图片版本
        const result = await sendDingtalkNotification(messageWithoutImage, webhook, notificationDecision?.priority || 'normal')
        console.log('✅ 钉钉通知发送成功（无图片版本）:', result)

        const responseData = {
          success: true,
          messageId: result.messageId,
          timestamp: new Date().toISOString(),
          isTest,
          notificationSent: true,
          aiGenerated: !!notificationDecision,
          note: '因消息体过大，已移除图片发送',
          queued: result.queued || false,
          queueLength: result.queueLength || 0,
          notificationStats: getNotificationStats(),
          messageStats: getMessageStats()
        }
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(responseData))
        return
      }
    }

    // 发送钉钉通知
    const result = await sendDingtalkNotification(finalMessage, webhook, notificationDecision?.priority || 'normal')

    console.log('✅ 钉钉通知发送成功:', result)

    const responseData = {
      success: true,
      messageId: result.messageId,
      timestamp: new Date().toISOString(),
      isTest,
      notificationSent: true,
      aiGenerated: !!notificationDecision,
      notificationDecision: notificationDecision ? {
        type: notificationDecision.notificationType,
        priority: notificationDecision.priority,
        reason: notificationDecision.reason
      } : null,
      queued: result.queued || false,
      queueLength: result.queueLength || 0,
      notificationStats: getNotificationStats(),
      messageStats: getMessageStats()
    }
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(responseData))
    
  } catch (error) {
    console.error('❌ AI智能通知错误:', error)
    
    const responseData = {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
      notificationStats: getNotificationStats(),
      messageStats: getMessageStats()
    }
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(responseData))
  }
}

// 构建AI驱动的钉钉消息
function buildAIDingtalkMessage(childName, messageObject, base64Image, notificationDecision, analysisResult) {
  const now = new Date()
  const timeStr = now.toLocaleString('zh-CN')
  
  // 根据消息类型和优先级设置标题
  let title, priorityIcon
  
  if (messageObject.type === 'praise') {
    title = '🌟 学习表现表扬'
    priorityIcon = messageObject.priority === 'high' ? '🏆' : '⭐'
  } else if (messageObject.type === 'reminder') {
    title = '📢 学习状态提醒'
    priorityIcon = messageObject.priority === 'high' ? '⚠️' : '📌'
  } else {
    title = '🔔 学习状态通知'
    priorityIcon = '📋'
  }
  
  // 构建消息内容
  let text = `#### ${priorityIcon} ${title}\n\n`
  
  // 添加AI生成的个性化消息
  text += `${messageObject.emoji} ${messageObject.content}\n\n`
  
  // 添加基本信息
  text += `**孩子：** ${childName} | **时间：** ${timeStr}\n\n`
  
  // 添加关键分析结果
  if (analysisResult) {
    if (analysisResult.postureAnalysis) {
      const posture = analysisResult.postureAnalysis
      text += `- 坐姿：${posture.isGoodPosture ? '良好 ✅' : '需要改进 ⚠️'}\n`
    }
    
    if (analysisResult.activityAnalysis) {
      const activity = analysisResult.activityAnalysis
      text += `- 活动：${activity.currentActivity}\n`
      text += `- 状态：${activity.isStudying ? '学习中 📚' : '非学习状态 🎮'}\n`
    }
    
    text += `\n`
  }
  
  // 添加一条关键建议
  text += `**建议：** `
  if (messageObject.type === 'praise') {
    text += `及时表扬孩子的良好表现，鼓励他继续保持！\n\n`
  } else {
    text += `温和提醒孩子调整状态，专注学习。\n\n`
  }
  
  // 如果有图片，添加图片
  if (base64Image && base64Image.length > 100) {
    // 确保图片base64不超过15000字符（约11KB）
    let truncatedImage = base64Image
    if (base64Image.length > 15000) {
      truncatedImage = base64Image.substring(0, 15000)
      console.log(`图片被截断: ${base64Image.length} -> ${truncatedImage.length} 字符`)
    }
    
    text += `**现场截图：**\n`
    // 使用钉钉支持的Markdown图片格式
    text += `[123](data:image/png;base64,${truncatedImage})\n\n`
  }
  
  text += `---\n`
  text += `*来自AI作业小助手 AI智能分析*\n`
  
  return {
    msgtype: 'markdown',
    markdown: {
      title: title.replace(/[🌟📢🔔🏆⭐⚠️📌📋]/g, '').trim(),
      text: text
    },
    at: {
      isAtAll: false
    }
  }
}

// 构建传统钉钉消息（保持向后兼容）
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
  
  // 如果有图片，添加图片
  if (base64Image && base64Image.length > 100) {
    // 确保图片base64不超过15000字符（约11KB）
    let truncatedImage = base64Image
    if (base64Image.length > 15000) {
      truncatedImage = base64Image.substring(0, 15000)
      console.log(`图片被截断: ${base64Image.length} -> ${truncatedImage.length} 字符`)
    }
    
    text += `**现场截图：**\n`
    // 使用钉钉支持的Markdown图片格式
    text += `[123](data:image/png;base64,${truncatedImage})\n\n`
  }
  
  text += `---\n`
  text += `*来自AI作业小助手*\n`
  
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

// 直接发送钉钉通知（不带频率控制）
async function sendDingtalkNotificationDirect(message, webhookUrl) {
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
  
  return {
    messageId: result.messageId || `msg_${Date.now()}`,
    timestamp: new Date().toISOString()
  }
}

// 发送钉钉通知（带频率控制）
async function sendDingtalkNotification(message, webhookUrl, priority = 'normal') {
  // 检查是否可以发送消息
  if (!canSendMessage(webhookUrl)) {
    // 检查是否是因为暂停
    if (messageFrequencyControl.webhookPaused.get(webhookUrl)) {
      // 添加到队列
      console.log(`📥 消息发送暂停，将消息添加到队列 (优先级: ${priority})`)
      addToMessageQueue(webhookUrl, message, {
        priority,
        callback: (error, result) => {
          if (error) {
            console.error('❌ 队列消息发送失败:', error)
          } else {
            console.log('✅ 队列消息发送成功:', result)
          }
        }
      })
      return {
        messageId: `queued_${Date.now()}`,
        timestamp: new Date().toISOString(),
        queued: true,
        queueLength: messageFrequencyControl.webhookQueues.get(webhookUrl).length
      }
    } else {
      // 达到消息限制
      const counter = getWebhookCounter(webhookUrl)
      
      // 检查是否需要发送风控提示（19条时发送）
      if (counter.messageCount === messageFrequencyControl.MAX_MESSAGES_PER_MINUTE - 1) {
        // 发送风控提示消息
        await sendRiskControlMessage(webhookUrl)
        
        // 暂停消息发送
        pauseMessageSending(webhookUrl)
        
        console.log(`⏸️  达到消息限制，已发送风控提示，暂停发送1分钟`)
      }
      
      // 将消息添加到队列
      console.log(`📥 达到消息限制，将消息添加到队列 (优先级: ${priority})`)
      addToMessageQueue(webhookUrl, message, {
        priority,
        callback: (error, result) => {
          if (error) {
            console.error('❌ 队列消息发送失败:', error)
          } else {
            console.log('✅ 队列消息发送成功:', result)
          }
        }
      })
      
      return {
        messageId: `queued_${Date.now()}`,
        timestamp: new Date().toISOString(),
        queued: true,
        queueLength: messageFrequencyControl.webhookQueues.get(webhookUrl).length
      }
    }
  }
  
  // 可以发送消息，直接发送
  console.log(`📤 直接发送消息 (优先级: ${priority})`)
  const result = await sendDingtalkNotificationDirect(message, webhookUrl)
  
  // 增加消息计数
  const messageCount = incrementMessageCount(webhookUrl)
  
  // 检查是否达到消息限制
  if (messageCount === messageFrequencyControl.MAX_MESSAGES_PER_MINUTE - 1) {
    // 发送风控提示消息
    await sendRiskControlMessage(webhookUrl)
    
    // 暂停消息发送
    pauseMessageSending(webhookUrl)
    
    console.log(`⏸️  接近消息限制，已发送风控提示，将暂停发送1分钟`)
  }
  
  console.log(`📊 当前消息计数: ${messageCount}/${messageFrequencyControl.MAX_MESSAGES_PER_MINUTE}`)
  
  return result
}