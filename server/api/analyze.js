/**
 * 增强的AI分析API
 * 集成AI智能通知系统
 */

import { decideNotification } from './notification-trigger.js'
import { generateAIMessage } from './message-generator.js'

export default async function handleAnalyze(req, res) {
  try {
    let body = ''
    req.on('data', chunk => body += chunk)
    await new Promise(resolve => req.on('end', resolve))
    body = JSON.parse(body || '{}')

    // 解析请求参数
    const {
      image,
      enablePostureDetection = true,
      enableActivityDetection = true,
      childName = '孩子',
      sensitivity = 7,
      // 新增通知相关参数
      enableAINotifications = true,
      webhookUrl = null,
      childAge = 10,
      childGender = 'unknown',
      interests = [],
      personalityTraits = [],
      enablePostureNotifications = true,
      enableActivityNotifications = true,
      enablePraiseMessages = true,
      customNotificationRules = {},
      autoSendNotification = true
    } = body
    
    console.log('🧠 增强AI分析请求:', {
      孩子: childName,
      年龄: childAge,
      敏感度: sensitivity,
      坐姿检测: enablePostureDetection,
      活动检测: enableActivityDetection,
      AI通知: enableAINotifications,
      自动发送: autoSendNotification,
      图像长度: image?.length || 0
    })
    
    // 获取GLM API密钥（从环境变量）
    const glmApiKey = process.env.GLM_API_KEY || ''
    
    // 确保API密钥存在
    if (!glmApiKey) {
      throw new Error('GLM API密钥未配置，请检查环境变量GLM_API_KEY')
    }
    
    // 调用真实AI分析
    console.log('🔄 正在调用GLM AI进行图像分析...')
    const analysisResult = await callGLMApi(image, {
      enablePostureDetection,
      enableActivityDetection,
      childName,
      sensitivity
    }, glmApiKey)
    
    console.log('✅ GLM AI分析完成')
    
    // 如果启用AI通知且有webhook地址，进行通知决策
    let notificationDecision = null
    let notificationMessage = null
    
    if (enableAINotifications && webhookUrl && analysisResult.success) {
      try {
        console.log('🔄 正在进行AI通知决策...')
        
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
          notificationMessage = await generateAIMessage(
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
            内容: notificationMessage.content.substring(0, 50) + '...',
            类型: notificationMessage.type,
            个性化: notificationMessage.personalized,
            表情: notificationMessage.emoji
          })
          
          // 如果设置自动发送通知，则立即发送
          if (autoSendNotification) {
            try {
              console.log('🔄 自动发送AI通知...')
              const notificationResult = await sendNotificationToWebhook(
                notificationMessage,
                webhookUrl,
                childName,
                image,
                notificationDecision,
                analysisResult
              )
              
              console.log('✅ AI通知自动发送成功:', notificationResult)
              
              // 在分析结果中添加通知信息
              analysisResult.notificationSent = true
              analysisResult.notificationResult = notificationResult
              analysisResult.notificationDecision = {
                type: notificationDecision.notificationType,
                priority: notificationDecision.priority,
                reason: notificationDecision.reason
              }
              analysisResult.generatedMessage = {
                content: notificationMessage.content,
                type: notificationMessage.type,
                personalized: notificationMessage.personalized,
                emoji: notificationMessage.emoji
              }
            } catch (notificationError) {
              console.error('❌ AI通知自动发送失败:', notificationError)
              
              // 在分析结果中添加通知失败信息
              analysisResult.notificationSent = false
              analysisResult.notificationError = notificationError.message
            }
          } else {
            // 不自动发送，只返回通知决策和生成的消息
            analysisResult.notificationDecision = {
              shouldNotify: notificationDecision.shouldNotify,
              type: notificationDecision.notificationType,
              priority: notificationDecision.priority,
              reason: notificationDecision.reason,
              metadata: notificationDecision.metadata
            }
            analysisResult.generatedMessage = {
              content: notificationMessage.content,
              type: notificationMessage.type,
              personalized: notificationMessage.personalized,
              emoji: notificationMessage.emoji,
              metadata: notificationMessage.metadata
            }
          }
        } else {
          // 不需要发送通知
          analysisResult.notificationDecision = {
            shouldNotify: false,
            reason: notificationDecision.reason
          }
        }
      } catch (notificationError) {
        console.error('❌ AI通知决策失败:', notificationError)
        
        // 在分析结果中添加通知决策失败信息
        analysisResult.notificationError = notificationError.message
      }
    }

    // 调试信息
    analysisResult._debug = {
      glmApiKey: glmApiKey ? '***' + glmApiKey.slice(-4) : 'none',
      glmApiKeyLength: glmApiKey ? glmApiKey.length : 0
    };

    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(analysisResult))

  } catch (error) {
    console.error('❌ 增强分析过程出错:', error)

    const errorResult = {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(errorResult))
  }
}

/**
 * 发送通知到webhook
 */
async function sendNotificationToWebhook(messageObject, webhookUrl, childName, image, notificationDecision, analysisResult) {
  // 构建钉钉消息
  const dingtalkMessage = buildAIDingtalkMessage(
    childName,
    messageObject,
    image,
    notificationDecision,
    analysisResult
  )
  
  // 发送钉钉通知
  return await sendDingtalkNotification(dingtalkMessage, webhookUrl)
}

/**
 * 构建AI驱动的钉钉消息
 */
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
    text += `![孩子当前状态](data:image/jpeg;base64,${truncatedImage})\n\n`
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

/**
 * 发送钉钉通知
 */
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
  
  return {
    messageId: result.messageId || `msg_${Date.now()}`,
    timestamp: new Date().toISOString()
  }
}

// 调用GLM API进行真实AI分析
async function callGLMApi(base64Image, options, apiKey) {
  const { enablePostureDetection, enableActivityDetection, childName, sensitivity } = options
  
  // 构建AI分析提示词
  const prompt = `
  请仔细分析这张图片中孩子的学习状态，基于以下要求：
  
  1. 坐姿分析（如果启用）：
     - 客观评估孩子的坐姿是否正确，避免预判
     - 给出0-10分的精确评分（10分为完美坐姿）
     - 详细指出具体的坐姿问题（如弯腰、前倾、眼睛距离屏幕/书本过近、背部不直等）
     - 提供具体的改进建议
     - 如果坐姿良好，给予具体的表扬
  
  2. 活动分析（如果启用）：
     - 精确识别孩子当前的具体活动（如认真写作业、阅读书籍、使用手机玩游戏、浏览网页、吃零食、喝水、休息、发呆等）
     - 明确判断是否属于学习状态（学习状态包括：写作业、阅读、做练习题、听课等）
     - 如果不是学习状态，根据敏感度参数（${sensitivity}/10，数值越高越敏感）评估是否需要提醒家长
     - 如果活动是积极学习，给予具体的表扬
  
  3. 通知决策（必须）：
     - 基于坐姿和活动分析，综合评估当前情况是否需要发送通知给家长
     - 通知决策需考虑：孩子的当前状态、持续时间可能的影响、敏感度参数
     - 如果需要通知，生成适合发送给家长的具体消息内容
     - 如果不需要通知，说明原因
  
  请以JSON格式返回分析结果，确保格式严格符合要求，避免任何额外文字：
  {
    "postureAnalysis": {
      "isGoodPosture": true/false,
      "postureScore": 0-10,
      "details": "详细描述当前坐姿情况",
      "issues": ["具体问题1", "具体问题2"],
      "advice": "具体改进建议或表扬内容",
      "praise": "如果坐姿良好，这里是具体的表扬语言"
    },
    "activityAnalysis": {
      "currentActivity": "精确的活动名称",
      "isStudying": true/false,
      "details": "详细描述当前活动",
      "requiresNotification": true/false,
      "notificationReason": "为什么需要或不需要通知的具体原因",
      "praise": "如果是积极学习，这里是具体的表扬语言"
    },
    "notificationDecision": {
      "shouldNotify": true/false,
      "notificationMessage": "如果需要通知，这里是发送给家长的具体消息内容",
      "decisionReason": "做出通知决策的详细原因"
    }
  }
  
  注意事项：
  - 请严格基于图片内容分析，避免主观预判或猜测图片中不存在的内容
  - 表扬内容要具体，避免空泛（如："坐姿非常标准，背部挺直，眼睛与书本保持了合适距离，值得表扬！"）
  - 通知消息要客观、具体，说明实际情况和建议
  - 如果不确定的内容，请明确说明"无法确定"
  - 请确保JSON格式正确，没有语法错误
  
  孩子姓名：${childName}
  `.trim()
  
  try {
    // 调用GLM API
    const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'glm-4v-flash', // 使用支持图像的模型
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`
                }
              },
              {
                type: 'text',
                text: prompt
              }
            ]
          }
        ],
        thinking: {
          type: 'enabled'
        },
        max_tokens: 1000,
        temperature: 0.3
      })
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`GLM API请求失败: ${response.status} ${errorText}`)
    }
    
    const data = await response.json()
    
    if (data.choices && data.choices.length > 0) {
      const content = data.choices[0].message.content
      
      try {
          // 尝试解析JSON响应，处理可能包含的额外文本
          let cleanContent = content.trim()
          
          // 使用正则表达式提取JSON部分，处理可能的额外文本
          const jsonMatch = cleanContent.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            cleanContent = jsonMatch[0]
          }
          
          const analysisResult = JSON.parse(cleanContent)
          
          return {
            success: true,
            postureAnalysis: enablePostureDetection ? analysisResult.postureAnalysis : null,
            activityAnalysis: enableActivityDetection ? analysisResult.activityAnalysis : null,
            notificationDecision: analysisResult.notificationDecision || {
              shouldNotify: analysisResult.activityAnalysis?.requiresNotification ?? false,
              notificationMessage: analysisResult.activityAnalysis?.notificationReason ?? null,
              decisionReason: '基于活动分析的通知决策'
            },
            shouldNotify: analysisResult.notificationDecision?.shouldNotify ?? analysisResult.activityAnalysis?.requiresNotification ?? false,
            timestamp: new Date().toISOString(),
            analysisNote: 'GLM AI智能分析完成',
            aiProvider: 'GLM'
          }
        } catch (parseError) {
        console.error('解析GLM响应失败:', parseError)
        console.log('原始响应:', content)
        // 尝试使用更宽松的解析方式
        try {
          // 移除可能的特殊字符
          const cleanedContent = content
            .replace(/^[^\{]*\{/, '{')  // 移除开头非JSON内容
            .replace(/\}[^\}]*$/, '}')  // 移除结尾非JSON内容
            .replace(/\\n/g, '')         // 移除换行符
            .replace(/\\t/g, '')         // 移除制表符
          
          const analysisResult = JSON.parse(cleanedContent)
          
          return {
            success: true,
            postureAnalysis: enablePostureDetection ? analysisResult.postureAnalysis : null,
            activityAnalysis: enableActivityDetection ? analysisResult.activityAnalysis : null,
            notificationDecision: analysisResult.notificationDecision || {
              shouldNotify: analysisResult.activityAnalysis?.requiresNotification ?? false,
              notificationMessage: analysisResult.activityAnalysis?.notificationReason ?? null,
              decisionReason: '基于活动分析的通知决策'
            },
            shouldNotify: analysisResult.notificationDecision?.shouldNotify ?? analysisResult.activityAnalysis?.requiresNotification ?? false,
            timestamp: new Date().toISOString(),
            analysisNote: 'GLM AI智能分析完成（使用宽松解析）',
            aiProvider: 'GLM'
          }
        } catch (fallbackError) {
          console.error('宽松解析也失败:', fallbackError)
          throw new Error('AI分析结果解析失败')
        }
      }
    } else {
      throw new Error('GLM API返回空响应')
    }
  } catch (error) {
    console.error('GLM API调用错误:', error)
    throw error
  }
}

// 辅助函数：简单哈希
function simpleHash(str) {
  let hash = 0
  if (str.length === 0) return hash
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // 转换为32位整数
  }
  return Math.abs(hash)
}