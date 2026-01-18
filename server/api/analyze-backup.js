export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    
    // 解析请求参数
    const { 
      image, 
      enablePostureDetection = true, 
      enableActivityDetection = true, 
      childName = '孩子', 
      sensitivity = 7 
    } = body
    
    console.log('🧠 AI分析请求:', {
      孩子: childName,
      敏感度: sensitivity,
      坐姿检测: enablePostureDetection,
      活动检测: enableActivityDetection,
      图像长度: image?.length || 0
    })
    
    // 获取GLM API密钥
    const config = useRuntimeConfig()
    const glmApiKey = config.glmApiKey || process.env.GLM_API_KEY
    
    if (!glmApiKey) {
      console.warn('⚠️ 未找到GLM API密钥，使用模拟分析')
      return generateSimulatedAnalysis(body)
    }
    
    // 调用真实AI分析
    try {
      console.log('🔄 正在调用GLM AI进行图像分析...')
      const aiResult = await callGLMApi(image, {
        enablePostureDetection,
        enableActivityDetection,
        childName,
        sensitivity
      }, glmApiKey)
      
      console.log('✅ GLM AI分析完成')
      return aiResult
    } catch (aiError) {
      console.error('❌ GLM AI分析失败:', aiError.message)
      console.log('🔄 降级使用模拟分析')
      return generateSimulatedAnalysis(body)
    }
    
  } catch (error) {
    console.error('❌ 分析过程出错:', error)
    
    // 返回错误响应，包含降级数据
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
      fallback: true,
      postureAnalysis: {
        isGoodPosture: true,
        postureScore: 8,
        details: '坐姿良好',
        issues: [],
        advice: '请继续保持'
      },
      activityAnalysis: {
        currentActivity: '学习',
        isStudying: true,
        details: '正在专注学习',
        requiresNotification: false,
        notificationReason: null
      },
      shouldNotify: false
    }
  }
})

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
    const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'glm-4.6v-flash',  // 使用支持图像分析的模型
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`
                }
              }
            ]
          }
        ],
        max_tokens: 1000,
        temperature: 0.2  // 降低随机性，提高分析一致性
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`GLM API请求失败: ${response.status} ${errorText}`)
    }

    const data = await response.json()
    
    if (data.choices && data.choices.length > 0) {
      const content = data.choices[0].message.content
      
      // 尝试解析JSON响应
      try {
        const analysisResult = JSON.parse(content)
        
        // 确保所有必需字段都存在
        const result = {
          success: true,
          postureAnalysis: enablePostureDetection ? {
            isGoodPosture: analysisResult.postureAnalysis?.isGoodPosture ?? true,
            postureScore: analysisResult.postureAnalysis?.postureScore ?? 8,
            details: analysisResult.postureAnalysis?.details ?? `${childName}坐姿良好`,
            issues: analysisResult.postureAnalysis?.issues ?? [],
            advice: analysisResult.postureAnalysis?.advice ?? '请继续保持良好坐姿'
          } : null,
          activityAnalysis: enableActivityDetection ? {
            currentActivity: analysisResult.activityAnalysis?.currentActivity ?? '学习',
            isStudying: analysisResult.activityAnalysis?.isStudying ?? true,
            details: analysisResult.activityAnalysis?.details ?? '正在专注学习',
            requiresNotification: analysisResult.activityAnalysis?.requiresNotification ?? false,
            notificationReason: analysisResult.activityAnalysis?.notificationReason ?? null
          } : null,
          shouldNotify: analysisResult.activityAnalysis?.requiresNotification ?? false,
          timestamp: new Date().toISOString(),
          analysisNote: 'GLM AI智能分析完成',
          aiProvider: 'GLM'
        }
        
        return result
      } catch (parseError) {
        console.error('解析GLM响应失败:', parseError)
        console.log('原始响应:', content)
        throw new Error('AI分析结果解析失败')
      }
    } else {
      throw new Error('GLM API返回空响应')
    }
  } catch (error) {
    console.error('GLM API调用错误:', error)
    throw error
  }
}

// 模拟分析函数（作为降级方案）
async function generateSimulatedAnalysis(body) {
  const { 
    image, 
    enablePostureDetection = true, 
    enableActivityDetection = true, 
    childName = '孩子', 
    sensitivity = 7 
  } = body
  
  // 模拟AI处理延迟
  const delay = 500 + Math.random() * 500
  await new Promise(resolve => setTimeout(resolve, delay))
  
  // 根据图像内容生成稳定的模拟结果
  const imageHash = image ? simpleHash(image.substring(0, 200)) : Date.now()
  const timestamp = Date.now()
  
  // 基于哈希值生成伪随机但稳定的结果
  const randomBase = (imageHash % 1000) / 1000
  
  // 坐姿分析 - 降低敏感度，增加容错
  let postureScore, isGoodPosture, postureDetails, postureIssues, postureAdvice
  
  if (enablePostureDetection) {
    // 坐姿评分：60%概率良好，40%概率需要改进（降低误判率）
    postureScore = randomBase < 0.6 ? 7 + Math.floor(randomBase * 3) : 4 + Math.floor(randomBase * 3)
    isGoodPosture = postureScore >= 6.5 // 降低门槛
    
    if (isGoodPosture) {
      postureDetails = `${childName}坐姿良好，保持正确读写姿势`
      postureIssues = []
      postureAdvice = '继续保持良好坐姿，注意定时休息'
    } else {
      // 根据分数给出不同级别的提醒
      if (postureScore >= 5) {
        postureDetails = `${childName}坐姿轻微前倾，建议调整`
        postureIssues = ['轻微前倾']
        postureAdvice = '请稍微挺直背部，保持眼睛与书本适当距离'
      } else {
        postureDetails = `${childName}坐姿需要改进`
        postureIssues = ['明显弯腰', '眼睛距离过近']
        postureAdvice = '请调整坐姿：背部挺直，双脚平放，眼睛与书本保持30-40厘米距离'
      }
    }
  }
  
  // 活动分析 - 增加玩手机的检测概率
  let currentActivity, isStudying, activityDetails, requiresNotification, notificationReason
  
  if (enableActivityDetection) {
    // 活动类型概率分布（增加玩手机的检测概率）
    const activityDistribution = [
      { 
        name: '专注学习', 
        probability: 0.40, 
        studying: true, 
        notify: false,
        details: '正在认真写作业，注意力集中'
      },
      { 
        name: '休息放松', 
        probability: 0.10, 
        studying: false, 
        notify: false,
        details: '正在休息，眼睛离开书本'
      },
      { 
        name: '短暂分心', 
        probability: 0.10, 
        studying: false, 
        notify: false,
        details: '注意力短暂分散，东张西望'
      },
      { 
        name: '玩手机', 
        probability: 0.25, 
        studying: false, 
        notify: true,
        details: '正在使用手机玩游戏或浏览非学习内容'
      },
      { 
        name: '吃零食', 
        probability: 0.10, 
        studying: false, 
        notify: true,
        details: '正在吃零食，可能影响学习注意力'
      },
      { 
        name: '离开座位', 
        probability: 0.05, 
        studying: false, 
        notify: true,
        details: '长时间离开座位，未在学习状态'
      }
    ]
    
    // 根据敏感度调整概率
    let adjustedDistribution = [...activityDistribution]
    if (sensitivity < 5) {
      // 低敏感度：减少通知类活动的概率
      adjustedDistribution = adjustedDistribution.map(act => 
        act.notify ? { ...act, probability: act.probability * 0.5 } : act
      )
    } else if (sensitivity > 7) {
      // 高敏感度：增加通知类活动的概率
      adjustedDistribution = adjustedDistribution.map(act => 
        act.notify ? { ...act, probability: act.probability * 1.5 } : act
      )
    }
    
    // 重新归一化概率
    const totalProb = adjustedDistribution.reduce((sum, act) => sum + act.probability, 0)
    adjustedDistribution = adjustedDistribution.map(act => ({
      ...act,
      probability: act.probability / totalProb
    }))
    
    // 选择活动
    let selectedActivity = adjustedDistribution[0]
    let cumulative = 0
    const activityRandom = (randomBase * 100) % 1
    
    for (const activity of adjustedDistribution) {
      cumulative += activity.probability
      if (activityRandom <= cumulative) {
        selectedActivity = activity
        break
      }
    }
    
    currentActivity = selectedActivity.name
    isStudying = selectedActivity.studying
    activityDetails = selectedActivity.details
    
    // 是否需要通知（考虑敏感度阈值）
    requiresNotification = selectedActivity.notify && sensitivity > 3
    notificationReason = requiresNotification 
      ? `检测到${currentActivity}行为，已持续一段时间`
      : null
  }
  
  // 构建返回结果
  const result = {
    success: true,
    postureAnalysis: enablePostureDetection ? {
      isGoodPosture,
      postureScore: Math.round(postureScore * 10) / 10,
      details: postureDetails,
      issues: postureIssues || [],
      advice: postureAdvice
    } : null,
    activityAnalysis: enableActivityDetection ? {
      currentActivity,
      isStudying,
      details: activityDetails,
      requiresNotification,
      notificationReason
    } : null,
    shouldNotify: requiresNotification,
    timestamp: new Date().toISOString(),
    analysisNote: '模拟AI分析完成（降级模式）',
    aiProvider: 'Simulation'
  }
  
  console.log('✅ 模拟分析完成:', {
    坐姿: isGoodPosture ? '良好' : '需改进',
    活动: currentActivity,
    通知: requiresNotification ? '需要' : '不需要'
  })
  
  return result
}

// 辅助函数：简单哈希
function simpleHash(str) {
  let hash = 0
  if (str.length === 0) return hash
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash)
}