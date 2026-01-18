/**
 * AI通知触发系统
 * 负责决定何时发送通知以及通知的类型
 */

// 通知统计数据
let notificationStats = {
  total: 0,
  sent: 0,
  blocked: 0,
  byType: {
    praise: 0,
    reminder: 0,
    alert: 0
  },
  byReason: {}
}

/**
 * 决定是否发送通知
 * @param {Object} analysisResult - AI分析结果
 * @param {Object} options - 通知选项
 * @returns {Object} 通知决策
 */
export function decideNotification(analysisResult, options) {
  const { 
    childName, 
    enablePostureNotifications = true, 
    enableActivityNotifications = true, 
    enablePraiseMessages = true, 
    sensitivity = 7, 
    customRules = {} 
  } = options
  
  // 初始化决策
  const decision = {
    shouldNotify: false,
    notificationType: 'none',
    priority: 'low',
    reason: '默认不通知',
    metadata: {
      childName,
      sensitivity,
      timestamp: new Date().toISOString()
    }
  }
  
  // 记录总请求数
  notificationStats.total++
  
  // 检查分析结果
  if (!analysisResult.success) {
    decision.reason = '分析失败，不发送通知'
    notificationStats.blocked++
    return decision
  }
  
  // 1. 检查活动分析
  if (enableActivityNotifications && analysisResult.activityAnalysis) {
    const activity = analysisResult.activityAnalysis
    
    // 如果是学习状态且表现良好，考虑发送表扬
    if (activity.isStudying && enablePraiseMessages) {
      const praiseScore = calculatePraiseScore(analysisResult)
      if (praiseScore >= 8 && sensitivity >= 5) {
        decision.shouldNotify = true
        decision.notificationType = 'praise'
        decision.priority = 'medium'
        decision.reason = `检测到认真学习行为，表扬得分: ${praiseScore}/10`
        decision.metadata.type = 'study_praise'
        decision.metadata.score = praiseScore
        
        // 记录统计
        notificationStats.sent++
        notificationStats.byType.praise++
        updateReasonStats(decision.reason)
        return decision
      }
    }
    
    // 如果不是学习状态，考虑发送提醒
    if (!activity.isStudying) {
      // 根据活动类型和敏感度判断
      const distractionScore = calculateDistractionScore(activity, sensitivity)
      
      if (distractionScore >= 6) {
        decision.shouldNotify = true
        decision.notificationType = 'alert'
        decision.priority = distractionScore >= 8 ? 'high' : 'medium'
        decision.reason = `检测到${activity.currentActivity}行为，分心得分: ${distractionScore}/10`
        decision.metadata.type = 'distraction_alert'
        decision.metadata.score = distractionScore
        decision.metadata.activity = activity.currentActivity
        
        // 记录统计
        notificationStats.sent++
        notificationStats.byType.alert++
        updateReasonStats(decision.reason)
        return decision
      }
    }
  }
  
  // 2. 检查坐姿分析
  if (enablePostureNotifications && analysisResult.postureAnalysis) {
    const posture = analysisResult.postureAnalysis
    
    // 坐姿不良且需要通知
    if (!posture.isGoodPosture) {
      // 计算坐姿问题严重程度
      const postureScore = 10 - posture.postureScore // 转换为问题得分（越高问题越严重）
      
      // 仅发送严重坐姿问题的通知（得分≥7）
      if (postureScore >= 7 && sensitivity >= 5) {
        decision.shouldNotify = true
        decision.notificationType = 'reminder'
        decision.priority = postureScore >= 8 ? 'high' : 'medium'
        decision.reason = `检测到严重坐姿问题，严重程度: ${postureScore}/10`
        decision.metadata.type = 'posture_reminder'
        decision.metadata.score = postureScore
        decision.metadata.issues = posture.issues
        
        // 记录统计
        notificationStats.sent++
        notificationStats.byType.reminder++
        updateReasonStats(decision.reason)
        return decision
      }
    }
  }
  
  // 3. 检查AI直接的通知决策（如果有）
  if (analysisResult.notificationDecision && analysisResult.notificationDecision.shouldNotify) {
    decision.shouldNotify = true
    decision.notificationType = analysisResult.activityAnalysis?.requiresNotification ? 'alert' : 'reminder'
    decision.priority = 'medium'
    decision.reason = analysisResult.notificationDecision.decisionReason
    decision.metadata.type = 'ai_direct'
    
    // 记录统计
    notificationStats.sent++
    notificationStats.byType[decision.notificationType]++
    updateReasonStats(decision.reason)
    return decision
  }
  
  // 默认不发送通知
  decision.reason = '当前状态无需通知'
  notificationStats.blocked++
  return decision
}

/**
 * 计算表扬得分
 * @param {Object} analysisResult - 分析结果
 * @returns {number} 表扬得分 (0-10)
 */
function calculatePraiseScore(analysisResult) {
  let score = 0
  
  // 坐姿良好加分
  if (analysisResult.postureAnalysis?.isGoodPosture) {
    score += analysisResult.postureAnalysis.postureScore / 1.5 // 坐姿良好给予更多加分
  }
  
  // 学习状态加分
  if (analysisResult.activityAnalysis?.isStudying) {
    score += 5
    
    // 根据学习活动类型给予额外加分
    const studyActivities = ['写作业', '阅读', '听课', '做练习']
    if (studyActivities.includes(analysisResult.activityAnalysis.currentActivity)) {
      score += 1 // 特定学习活动额外加分
    }
    
    // 学习时间较长时给予额外加分
    if (analysisResult.activityAnalysis.studyDuration && analysisResult.activityAnalysis.studyDuration > 30000) {
      score += 1 // 学习时间超过30秒额外加分
    }
  }
  
  return Math.min(Math.round(score), 10)
}

/**
 * 计算分心得分
 * @param {Object} activity - 活动分析结果
 * @param {number} sensitivity - 敏感度 (1-10)
 * @returns {number} 分心得分 (0-10)
 */
function calculateDistractionScore(activity, sensitivity) {
  const distractionMap = {
    '玩手机': 10,
    '玩游戏': 9,
    '浏览网页': 8,
    '吃零食': 7,
    '发呆': 6,
    '聊天': 5,
    '休息': 3,
    '喝水': 2
  }
  
  // 获取基础分心得分
  const baseScore = distractionMap[activity.currentActivity] || 4
  
  // 根据敏感度调整
  const sensitivityFactor = sensitivity / 10
  
  return Math.round(baseScore * sensitivityFactor)
}

/**
 * 更新原因统计
 * @param {string} reason - 通知原因
 */
function updateReasonStats(reason) {
  if (notificationStats.byReason[reason]) {
    notificationStats.byReason[reason]++
  } else {
    notificationStats.byReason[reason] = 1
  }
}

/**
 * 获取通知统计
 * @returns {Object} 统计数据
 */
export function getNotificationStats() {
  return { ...notificationStats }
}

/**
 * 重置通知统计
 */
export function resetNotificationStats() {
  notificationStats = {
    total: 0,
    sent: 0,
    blocked: 0,
    byType: {
      praise: 0,
      reminder: 0,
      alert: 0
    },
    byReason: {}
  }
  return notificationStats
}
