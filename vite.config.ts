import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import fs from 'fs'
import path from 'path'
// 加载环境变量
import dotenv from 'dotenv'

// 加载.env文件
dotenv.config()
console.log('✅ 已加载环境变量:', Object.keys(process.env).filter(key => key.includes('GLM')))

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    {
      name: 'dev-server-api',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          console.log('📥 收到请求:', req.method, req.url)

          // 支付API路由
          if (req.url?.startsWith('/api/payment/create')) {
            console.log('✅ 路由到: /api/payment/create')
            try {
              const paymentModule = await import('./server/api/payment.js')
              await paymentModule.handlePaymentCreate(req, res)
            } catch (err) {
              console.error('❌ 处理支付创建请求失败:', err)
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ success: false, error: err.message }))
            }
          } else if (req.url?.startsWith('/api/payment/notify')) {
            console.log('✅ 路由到: /api/payment/notify')
            try {
              const paymentModule = await import('./server/api/payment.js')
              await paymentModule.handlePaymentNotifyWebhook(req, res)
            } catch (err) {
              console.error('❌ 处理支付通知失败:', err)
              res.statusCode = 500
              res.end('fail')
            }
          } else if (req.url?.startsWith('/api/payment/query')) {
            console.log('✅ 路由到: /api/payment/query')
            try {
              const paymentModule = await import('./server/api/payment.js')
              await paymentModule.handlePaymentQuery(req, res)
            } catch (err) {
              console.error('❌ 处理支付查询失败:', err)
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ success: false, error: err.message }))
            }
          } else if (req.url?.startsWith('/api/notify')) {
            // 处理通知 API
            try {
              const notifyModule = await import('./server/api/notify.js')
              await notifyModule.default(req, res)
            } catch (err) {
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: err.message }))
            }
          } else if (req.url?.startsWith('/api/analyze')) {
            // 处理分析 API
            try {
              const analyzeModule = await import('./server/api/analyze.js')
              await analyzeModule.default(req, res)
            } catch (err) {
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: err.message }))
            }
          } else if (req.url?.startsWith('/api/health')) {
            // 健康检查
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ status: 'ok', message: 'API server is running' }))
          } else {
            next()
          }
        })
      }
    }
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 3000,
    host: 'localhost',
    open: false
  },
  define: {
    'process.env': {
      GLM_API_KEY: JSON.stringify(process.env.GLM_API_KEY),
      ICP_RECORD_NUMBER: JSON.stringify(process.env.ICP_RECORD_NUMBER)
    }
  }
})
