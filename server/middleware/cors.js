export default defineEventHandler((event) => {
  // 设置CORS头
  event.node.res.setHeader('Access-Control-Allow-Origin', '*')
  event.node.res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  event.node.res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  // 如果是预检请求，直接返回200
  if (event.node.req.method === 'OPTIONS') {
    event.node.res.statusCode = 200
    event.node.res.end()
  }
})