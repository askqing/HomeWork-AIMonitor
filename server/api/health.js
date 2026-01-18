export default defineEventHandler((event) => {
  // 设置CORS头
  event.node.res.setHeader('Access-Control-Allow-Origin', '*')
  event.node.res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  event.node.res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  // 处理预检请求
  if (event.method === 'OPTIONS') {
    event.node.res.statusCode = 204
    event.node.res.end()
    return
  }
  
  return {
    status: 'healthy',
    service: 'AI作业小助手',
    version: '2.0.1',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      analyze: {
        method: 'POST',
        path: '/api/analyze',
        description: 'AI分析图片'
      },
      notify: {
        method: 'POST',
        path: '/api/notify',
        description: '发送钉钉通知'
      },
      health: {
        method: 'GET',
        path: '/api/health',
        description: '健康检查'
      }
    },
    features: {
      postureDetection: '坐姿检测',
      activityDetection: '活动检测',
      dingtalkNotification: '钉钉通知',
      localSimulation: '本地模拟模式',
      systemNotifications: '系统事件通知'
    },
    note: '系统运行正常，所有API端点可用'
  }
})