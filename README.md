# 儿童作业监督系统 (HomeWork-AIMonitor)

## 项目简介

儿童作业监督系统是一款基于AI技术的智能监督工具，能够帮助家长实时监控孩子的学习状态和坐姿，及时提醒孩子保持良好的学习习惯。

HomeWork-AIMonitor is an AI-powered intelligent monitoring tool designed to help parents track their children's learning status and posture in real-time, providing timely reminders to maintain good study habits.

## 功能特性

### 核心功能
- 📚 **学习状态监测**：自动识别孩子是否在学习，检测分心行为
- 🧍 **坐姿分析**：实时监测坐姿，仅在严重问题时发送提醒
- 👍 **表扬机制**：孩子认真学习时自动发送表扬通知
- 📱 **实时通知**：通过钉钉机器人发送学习状态通知
- 📸 **现场截图**：通知包含孩子当前学习状态的截图

### 智能算法
- **通知权重系统**：避免频繁通知，仅发送重要信息
- **敏感度调节**：可根据需求调整通知敏感度
- **个性化消息**：根据分析结果生成个性化通知内容

## 技术栈

- **前端框架**：Vue 3 + Vite
- **后端**：Node.js + Vercel Serverless Functions
- **AI接口**：通义千问 API
- **通知系统**：钉钉机器人
- **构建工具**：Vite
- **部署平台**：Vercel

## 快速开始

### 本地运行

1. 克隆项目
```bash
git clone https://github.com/askqing/HomeWork-AIMonitor.git
cd HomeWork-AIMonitor
```

2. 安装依赖
```bash
npm install
```

3. 配置环境变量
在根目录创建 `.env` 文件，添加以下内容：
```
GLM_API_KEY=your_glm_api_key
```

4. 启动开发服务器
```bash
npm run dev
```

5. 访问应用
打开浏览器访问 `http://localhost:3000`

### Vercel 一键部署

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/askqing/HomeWork-AIMonitor.git&env=GLM_API_KEY)

部署步骤：
1. 点击上方 "Deploy with Vercel" 按钮
2. 登录 Vercel 账号
3. 在环境变量配置页添加 `GLM_API_KEY`
4. 点击 "Deploy" 按钮完成部署

## 环境变量配置

| 变量名 | 描述 | 必填 |
|--------|------|------|
| GLM_API_KEY | 通义千问 API 密钥 | 是 |

## 项目结构

```
HomeWork-AIMonitor/
├── server/              # 后端 API 目录
│   └── api/            # API 接口
│       ├── analyze.js       # AI 分析接口
│       ├── message-generator.js  # 消息生成器
│       ├── notification-trigger.js # 通知触发器
│       └── notify.js        # 通知发送
├── src/                # 前端源码
│   ├── App.vue         # 主应用组件
│   └── main.js         # 应用入口
├── public/             # 静态资源
├── .env                # 环境变量配置
├── vercel.json         # Vercel 部署配置
└── package.json        # 项目依赖
```

## API 接口

### POST /api/analyze
- **功能**：分析孩子学习状态和坐姿
- **参数**：
  - `image`：Base64 编码的图片
  - `webhookUrl`：钉钉机器人 webhook URL
  - `enableAINotifications`：是否启用 AI 通知
  - `autoSendNotification`：是否自动发送通知
- **返回**：分析结果和通知状态

### POST /api/notify
- **功能**：发送学习状态通知
- **参数**：
  - `webhookUrl`：钉钉机器人 webhook URL
  - `childName`：孩子姓名
  - `analysisResult`：分析结果
  - `base64Image`：Base64 编码的图片
- **返回**：通知发送结果

## 使用说明

1. 配置钉钉机器人：
   - 在钉钉群中创建机器人
   - 获取 webhook URL

2. 启动应用：
   - 本地运行或使用 Vercel 部署

3. 设置应用：
   - 输入孩子姓名
   - 配置钉钉机器人 webhook
   - 调整通知敏感度

4. 开始使用：
   - 点击 "开始分析" 按钮
   - 应用将实时监测孩子学习状态
   - 严重坐姿问题或认真学习时发送通知

## 通知规则

### 坐姿提醒
- 仅当坐姿问题严重（得分 ≥ 7/10）时发送通知
- 避免频繁通知，减少干扰

### 表扬机制
- 孩子认真学习时自动发送表扬通知
- 根据学习状态、坐姿和学习活动类型综合评估

## 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 联系方式

如有问题或建议，请通过以下方式联系：
- GitHub Issues: [https://github.com/askqing/HomeWork-AIMonitor/issues](https://github.com/askqing/HomeWork-AIMonitor/issues)

---

## Introduction

HomeWork-AIMonitor is an AI-powered intelligent monitoring tool that helps parents track their children's learning status and posture in real-time, providing timely reminders to maintain good study habits.

## Features

### Core Features
- 📚 **Learning Status Monitoring**: Automatically detects if the child is studying and identifies distractions
- 🧍 **Posture Analysis**: Real-time posture monitoring with reminders only for severe issues
- 👍 **Praise System**: Automatic praise notifications when the child is studying diligently
- 📱 **Real-time Notifications**: Learning status notifications sent via DingTalk robot
- 📸 **On-site Screenshots**: Notifications include screenshots of the child's current study status

### Intelligent Algorithms
- **Notification Weight System**: Avoids frequent notifications, only sends important information
- **Sensitivity Adjustment**: Notification sensitivity can be adjusted according to needs
- **Personalized Messages**: Generates personalized notification content based on analysis results

## Technology Stack

- **Frontend**: Vue 3 + Vite
- **Backend**: Node.js + Vercel Serverless Functions
- **AI API**: Tongyi Qianwen API
- **Notification System**: DingTalk Robot
- **Build Tool**: Vite
- **Deployment Platform**: Vercel

## Quick Start

### Local Development

1. Clone the repository
```bash
git clone https://github.com/askqing/HomeWork-AIMonitor.git
cd HomeWork-AIMonitor
```

2. Install dependencies
```bash
npm install
```

3. Configure environment variables
Create a `.env` file in the root directory with the following content:
```
GLM_API_KEY=your_glm_api_key
```

4. Start the development server
```bash
npm run dev
```

5. Access the application
Open your browser and visit `http://localhost:3000`

### Vercel One-Click Deployment

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/askqing/HomeWork-AIMonitor.git&env=GLM_API_KEY)

Deployment steps:
1. Click the "Deploy with Vercel" button above
2. Log in to your Vercel account
3. Add `GLM_API_KEY` in the environment variables configuration page
4. Click the "Deploy" button to complete deployment

## Environment Variables

| Variable Name | Description | Required |
|---------------|-------------|----------|
| GLM_API_KEY | Tongyi Qianwen API Key | Yes |

## Project Structure

```
HomeWork-AIMonitor/
├── server/              # Backend API directory
│   └── api/            # API endpoints
│       ├── analyze.js       # AI analysis endpoint
│       ├── message-generator.js  # Message generator
│       ├── notification-trigger.js # Notification trigger
│       └── notify.js        # Notification sender
├── src/                # Frontend source code
│   ├── App.vue         # Main application component
│   └── main.js         # Application entry point
├── public/             # Static resources
├── .env                # Environment variables configuration
├── vercel.json         # Vercel deployment configuration
└── package.json        # Project dependencies
```

## API Endpoints

### POST /api/analyze
- **Function**: Analyze child's learning status and posture
- **Parameters**:
  - `image`: Base64 encoded image
  - `webhookUrl`: DingTalk robot webhook URL
  - `enableAINotifications`: Whether to enable AI notifications
  - `autoSendNotification`: Whether to automatically send notifications
- **Response**: Analysis results and notification status

### POST /api/notify
- **Function**: Send learning status notification
- **Parameters**:
  - `webhookUrl`: DingTalk robot webhook URL
  - `childName`: Child's name
  - `analysisResult`: Analysis results
  - `base64Image`: Base64 encoded image
- **Response**: Notification sending results

## Usage Instructions

1. Configure DingTalk Robot:
   - Create a robot in DingTalk group
   - Get webhook URL

2. Start the Application:
   - Run locally or deploy with Vercel

3. Set Up Application:
   - Enter child's name
   - Configure DingTalk robot webhook
   - Adjust notification sensitivity

4. Start Using:
   - Click "Start Analysis" button
   - The application will monitor learning status in real-time
   - Notifications will be sent for severe posture issues or diligent study

## Notification Rules

### Posture Reminders
- Only send notifications when posture issues are severe (score ≥ 7/10)
- Avoid frequent notifications to reduce interference

### Praise Mechanism
- Automatically send praise notifications when child is studying diligently
- Comprehensive evaluation based on learning status, posture, and activity type

## Contribution Guidelines

1. Fork the Project
2. Create a Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

For questions or suggestions, please contact:
- GitHub Issues: [https://github.com/askqing/HomeWork-AIMonitor/issues](https://github.com/askqing/HomeWork-AIMonitor/issues)
