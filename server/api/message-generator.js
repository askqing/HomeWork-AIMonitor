/**
 * AI消息生成系统
 * 负责生成个性化的通知消息
 */

// 消息统计数据
let messageStats = {
  total: 0,
  byType: {
    praise: 0,
    reminder: 0,
    alert: 0
  },
  byLength: {
    short: 0,  // < 50 characters
    medium: 0, // 50-150 characters
    long: 0    // > 150 characters
  }
}

/**
 * 生成AI消息
 * @param {Object} notificationDecision - 通知决策
 * @param {Object} analysisResult - AI分析结果
 * @param {Object} context - 上下文信息
 * @returns {Object} 生成的消息
 */
export async function generateAIMessage(notificationDecision, analysisResult, context) {
  const { childName, childAge, childGender, interests = [], personalityTraits = [], timeContext } = context
  
  // 记录统计
  messageStats.total++
  
  // 初始化消息对象
  const message = {
    content: '',
    type: notificationDecision.notificationType,
    priority: notificationDecision.priority,
    emoji: getEmojiForMessageType(notificationDecision.notificationType),
    personalized: true,
    metadata: {
      childName,
      childAge,
      childGender,
      interests: interests.slice(0, 3), // 只保留前3个兴趣
      timeContext
    }
  }
  
  // 根据消息类型生成内容
  switch (notificationDecision.notificationType) {
    case 'praise':
      message.content = generatePraiseMessage(analysisResult, context)
      break
      
    case 'reminder':
      message.content = generateReminderMessage(analysisResult, context)
      break
      
    case 'alert':
      message.content = generateAlertMessage(analysisResult, context)
      break
      
    default:
      message.content = generateDefaultMessage(analysisResult, context)
  }
  
  // 更新统计
  messageStats.byType[notificationDecision.notificationType]++
  updateLengthStats(message.content)
  
  return message
}

/**
 * 生成表扬消息
 * @param {Object} analysisResult - 分析结果
 * @param {Object} context - 上下文信息
 * @returns {string} 表扬消息
 */
function generatePraiseMessage(analysisResult, context) {
  const { childName, childAge, interests } = context
  const { postureAnalysis, activityAnalysis } = analysisResult
  
  // 使用AI分析提供的表扬内容（如果有）
  if (activityAnalysis?.praise) {
    return activityAnalysis.praise
  }
  
  if (postureAnalysis?.praise) {
    return postureAnalysis.praise
  }
  
  // 生成默认表扬消息
  const praiseTemplates = [
    `太棒了！${childName}正在认真${activityAnalysis?.currentActivity || '学习'}，保持这种专注的状态！`,
    `${childName}表现非常出色，坐姿端正，学习认真，继续保持哦！`,
    `看到${childName}这么专注地${activityAnalysis?.currentActivity || '学习'}，真的很开心！`,
    `${childName}的学习态度值得表扬，继续加油！`
  ]
  
  // 根据年龄调整消息
  if (childAge < 7) {
    const youngChildTemplates = [
      `哇！${childName}小朋友学习好认真呀，给你点个大大的赞！👍`,
      `太棒了！${childName}小朋友坐得直直的，学习真用心！`,
      `小${childName}学习好专注，继续保持哦，你是最棒的！`
    ]
    return youngChildTemplates[Math.floor(Math.random() * youngChildTemplates.length)]
  }
  
  return praiseTemplates[Math.floor(Math.random() * praiseTemplates.length)]
}

/**
 * 生成提醒消息
 * @param {Object} analysisResult - 分析结果
 * @param {Object} context - 上下文信息
 * @returns {string} 提醒消息
 */
function generateReminderMessage(analysisResult, context) {
  const { childName } = context
  const { postureAnalysis, activityAnalysis } = analysisResult
  
  // 坐姿提醒
  if (postureAnalysis && !postureAnalysis.isGoodPosture) {
    const postureReminders = [
      `${childName}，请调整一下坐姿哦，保持背部挺直对眼睛和脊椎都很重要！`,
      `亲爱的${childName}，注意坐姿，眼睛离书本/屏幕远一点哦！`,
      `${childName}，坐端正一点，这样学习起来更舒服也更有效率！`,
      `提醒${childName}：保持良好的坐姿，预防近视和脊椎问题！`
    ]
    return postureReminders[Math.floor(Math.random() * postureReminders.length)]
  }
  
  // 活动提醒
  if (activityAnalysis && !activityAnalysis.isStudying) {
    const activityReminders = [
      `${childName}，该回到学习状态了哦，专注一点学习效率会更高！`,
      `亲爱的${childName}，现在是学习时间，请放下${activityAnalysis.currentActivity}，回到学习上吧！`,
      `${childName}，适当休息是可以的，但不要忘记学习任务哦！`,
      `提醒${childName}：学习时间要专注，完成任务后再放松！`
    ]
    return activityReminders[Math.floor(Math.random() * activityReminders.length)]
  }
  
  // 默认提醒
  return `${childName}，请保持良好的学习状态！`
}

/**
 * 生成警告消息
 * @param {Object} analysisResult - 分析结果
 * @param {Object} context - 上下文信息
 * @returns {string} 警告消息
 */
function generateAlertMessage(analysisResult, context) {
  const { childName } = context
  const { activityAnalysis } = analysisResult
  
  // 使用AI分析提供的通知消息（如果有）
  if (analysisResult.notificationDecision?.notificationMessage) {
    return analysisResult.notificationDecision.notificationMessage
  }
  
  // 生成警告消息
  if (activityAnalysis && !activityAnalysis.isStudying) {
    const alertTemplates = [
      `⚠️ 检测到${childName}正在${activityAnalysis.currentActivity}，已持续一段时间，请关注！`,
      `⚠️ 提醒：${childName}当前在${activityAnalysis.currentActivity}，可能影响学习进度！`,
      `⚠️ 注意：${childName}已离开学习状态，正在${activityAnalysis.currentActivity}，请适当干预！`,
      `⚠️ 警告：${childName}长时间${activityAnalysis.currentActivity}，建议提醒其回到学习！`
    ]
    return alertTemplates[Math.floor(Math.random() * alertTemplates.length)]
  }
  
  // 默认警告
  return `⚠️ 请注意${childName}的学习状态！`
}

/**
 * 生成默认消息
 * @param {Object} analysisResult - 分析结果
 * @param {Object} context - 上下文信息
 * @returns {string} 默认消息
 */
function generateDefaultMessage(analysisResult, context) {
  const { childName } = context
  return `检测到${childName}的学习状态变化，请查看详情！`
}

/**
 * 获取消息类型对应的表情符号
 * @param {string} type - 消息类型
 * @returns {string} 表情符号
 */
function getEmojiForMessageType(type) {
  const emojiMap = {
    praise: '👍',
    reminder: '📌',
    alert: '⚠️',
    default: '🔔'
  }
  return emojiMap[type] || emojiMap.default
}

/**
 * 更新长度统计
 * @param {string} content - 消息内容
 */
function updateLengthStats(content) {
  if (content.length < 50) {
    messageStats.byLength.short++
  } else if (content.length < 150) {
    messageStats.byLength.medium++
  } else {
    messageStats.byLength.long++
  }
}

/**
 * 获取消息统计
 * @returns {Object} 统计数据
 */
export function getMessageStats() {
  return { ...messageStats }
}

/**
 * 重置消息统计
 */
export function resetMessageStats() {
  messageStats = {
    total: 0,
    byType: {
      praise: 0,
      reminder: 0,
      alert: 0
    },
    byLength: {
      short: 0,
      medium: 0,
      long: 0
    }
  }
  return messageStats
}
