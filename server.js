const express = require('express');
const path = require('path');
const cors = require('./server/middleware/cors');
require('dotenv').config();

// 导入API路由
const analyze = require('./server/api/analyze');
const notify = require('./server/api/notify');
const health = require('./server/api/health');
const payment = require('./server/api/payment');
const notificationTrigger = require('./server/api/notification-trigger');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors);

// API路由
app.use('/api/analyze', analyze);
app.use('/api/notify', notify);
app.use('/api/health', health);
app.use('/api/payment', payment);
app.use('/api/notification-trigger', notificationTrigger);

// 静态文件服务
app.use(express.static(path.join(__dirname, 'dist')));

// 处理所有其他路由，返回index.html（SPA路由）
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
