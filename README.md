# AI作业小助手 (HomeWork-AIMonitor)

## 项目简介

AI作业小助手是一款基于AI技术的智能监督工具，能够帮助家长实时监控孩子的学习状态和坐姿，及时提醒孩子保持良好的学习习惯。

HomeWork-AIMonitor is an AI-powered intelligent monitoring tool designed to help parents track their children's learning status and posture in real-time, providing timely reminders to maintain good study habits.

## 功能特性

### 核心功能
- 📚 **学习状态监测**：自动识别孩子是否在学习，检测分心行为
  - **Learning Status Monitoring**: Automatically identifies if children are studying and detects distracted behaviors
- 🧍 **坐姿分析**：实时监测坐姿，仅在严重问题时发送提醒
  - **Posture Analysis**: Real-time posture monitoring, sends alerts only for serious issues
- 👍 **表扬机制**：孩子认真学习时自动发送表扬通知
  - **Praise System**: Automatically sends praise notifications when children are studying diligently
- 📱 **实时通知**：通过钉钉机器人发送学习状态通知
  - **Real-time Notifications**: Sends learning status notifications via DingTalk robot
- 📸 **现场截图**：通知包含孩子当前学习状态的截图
  - **On-site Screenshots**: Notifications include screenshots of the child's current learning status

### 智能算法
- **通知权重系统**：避免频繁通知，仅发送重要信息
  - **Notification Weight System**: Avoids frequent notifications, only sends important information
- **敏感度调节**：可根据需求调整通知敏感度
  - **Sensitivity Adjustment**: Allows adjusting notification sensitivity according to needs
- **个性化消息**：根据分析结果生成个性化通知内容
  - **Personalized Messages**: Generates personalized notification content based on analysis results

## 技术栈

- **前端框架**：Vue 3 + Vite
  - **Frontend Framework**: Vue 3 + Vite
- **后端**：Node.js + Vercel Serverless Functions
  - **Backend**: Node.js + Vercel Serverless Functions
- **AI接口**：智谱清言 GLM API （使用免费模型，无需充值）
  - **AI Interface**: GLM API from Zhipu AI (uses free models, no recharge required)
- **通知系统**：钉钉机器人
  - **Notification System**: DingTalk Robot
- **构建工具**：Vite
  - **Build Tool**: Vite
- **部署平台**：Vercel
  - **Deployment Platform**: Vercel

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
3. 在环境变量配置页添加 `GLM_API_KEY` 、 `NUXT_PUBLIC_APP_URL` 与 `ICP_RECORD_NUMBER`
4. 点击 "Deploy" 按钮完成部署

### Local Development

1. Clone the project
```bash
git clone https://github.com/askqing/HomeWork-AIMonitor.git
cd HomeWork-AIMonitor
```

2. Install dependencies
```bash
npm install
```

3. Configure environment variables
Create a `.env` file in the root directory and add the following:
```
GLM_API_KEY=your_glm_api_key
```

4. Start the development server
```bash
npm run dev
```

5. Access the application
Open browser and visit `http://localhost:3000`

### Vercel One-Click Deployment

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/askqing/HomeWork-AIMonitor.git&env=GLM_API_KEY)

Deployment steps:
1. Click the "Deploy with Vercel" button above
2. Log in to your Vercel account
3. Add `GLM_API_KEY`, `NUXT_PUBLIC_APP_URL`, and `ICP_RECORD_NUMBER` in the environment variables configuration page
4. Click the "Deploy" button to complete deployment

## 环境变量配置

| 变量名 | 描述 | 必填 |
|--------|------|------|
| GLM_API_KEY | 智谱清言 GLM API 密钥 | 是 |
| NUXT_PUBLIC_APP_URL | 应用部署 URL | 是 |
| ICP_RECORD_NUMBER | ICP 备案号 | 否 |

## 环境变量配置 (Environment Variables)

| Variable Name | Description | Required |
|---------------|-------------|----------|
| GLM_API_KEY | GLM API key from Zhipu AI | Yes |
| NUXT_PUBLIC_APP_URL | Application deployment URL | Yes |
| ICP_RECORD_NUMBER | ICP record number | No |

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

## Project Structure

```
HomeWork-AIMonitor/
├── server/              # Backend API directory
│   └── api/            # API interfaces
│       ├── analyze.js       # AI analysis interface
│       ├── message-generator.js  # Message generator
│       ├── notification-trigger.js # Notification trigger
│       └── notify.js        # Notification sender
├── src/                # Frontend source code
│   ├── App.vue         # Main application component
│   └── main.js         # Application entry
├── public/             # Static resources
├── .env                # Environment variables configuration
├── vercel.json         # Vercel deployment configuration
└── package.json        # Project dependencies
```

## API 接口

### POST /api/analyze
- **功能**：分析孩子学习状态和坐姿
  - **Function**：Analyze children's learning status and posture
- **参数**：
  - **Parameters**：
  - `image`：Base64 编码的图片
    - `image`：Base64 encoded image
  - `webhookUrl`：钉钉机器人 webhook URL
    - `webhookUrl`：DingTalk robot webhook URL
  - `enableAINotifications`：是否启用 AI 通知
    - `enableAINotifications`：Whether to enable AI notifications
  - `autoSendNotification`：是否自动发送通知
    - `autoSendNotification`：Whether to automatically send notifications
- **返回**：分析结果和通知状态
  - **Return**：Analysis results and notification status

### POST /api/notify
- **功能**：发送学习状态通知
  - **Function**：Send learning status notifications
- **参数**：
  - **Parameters**：
  - `webhookUrl`：钉钉机器人 webhook URL
    - `webhookUrl`：DingTalk robot webhook URL
  - `childName`：孩子姓名
    - `childName`：Child's name
  - `analysisResult`：分析结果
    - `analysisResult`：Analysis results
  - `base64Image`：Base64 编码的图片
    - `base64Image`：Base64 encoded image
- **返回**：通知发送结果
  - **Return**：Notification sending results

## API Interfaces

### POST /api/analyze
- **功能**：分析孩子学习状态和坐姿
  - **Function**：Analyze children's learning status and posture
- **参数**：
  - **Parameters**：
  - `image`：Base64 编码的图片
    - `image`：Base64 encoded image
  - `webhookUrl`：钉钉机器人 webhook URL
    - `webhookUrl`：DingTalk robot webhook URL
  - `enableAINotifications`：是否启用 AI 通知
    - `enableAINotifications`：Whether to enable AI notifications
  - `autoSendNotification`：是否自动发送通知
    - `autoSendNotification`：Whether to automatically send notifications
- **返回**：分析结果和通知状态
  - **Return**：Analysis results and notification status

### POST /api/notify
- **功能**：发送学习状态通知
  - **Function**：Send learning status notifications
- **参数**：
  - **Parameters**：
  - `webhookUrl`：钉钉机器人 webhook URL
    - `webhookUrl`：DingTalk robot webhook URL
  - `childName`：孩子姓名
    - `childName`：Child's name
  - `analysisResult`：分析结果
    - `analysisResult`：Analysis results
  - `base64Image`：Base64 编码的图片
    - `base64Image`：Base64 encoded image
- **返回**：通知发送结果
  - **Return**：Notification sending results

## 使用说明

### 1. 配置钉钉机器人

#### 1.1 创建钉钉机器人

1. 打开钉钉电脑客户端，进入要接收通知的群聊
2. 点击群聊右上角的「设置」按钮
3. 在弹出的设置菜单中选择「智能群助手」
4. 点击「添加机器人」，然后选择「自定义」机器人
5. 进入机器人设置页面，填写以下信息：
   - **机器人名称**：如「儿童学习监督」
   - **安全设置**：建议选择「自定义关键词」，添加关键词如「儿童作业」、「学习状态」、「坐姿提醒」
   - **头像**：可选择合适的头像（可选）
6. 点击「完成」，复制生成的 **Webhook URL** 备用

#### 1.2 Webhook URL 格式

生成的 Webhook URL 格式如下：
```
https://oapi.dingtalk.com/robot/send?access_token=xxxxxxxxxx
```

#### 1.3 安全设置注意事项

- **自定义关键词**：确保机器人消息中包含至少一个关键词
- **IP地址白名单**：如果选择此选项，需要将 Vercel 服务器 IP 添加到白名单（不推荐，因为 Vercel IP 不固定）
- **加签**：高级安全设置，如需使用请参考钉钉官方文档

## Usage Instructions

### 1. Configure DingTalk Robot

#### 1.1 Create DingTalk Robot

1. Open DingTalk desktop client and enter the group chat where you want to receive notifications
2. Click the "Settings" button in the upper right corner of the group chat
3. Select "Smart Group Assistant" in the popup settings menu
4. Click "Add Robot", then select "Custom" robot
5. Enter the robot settings page and fill in the following information:
   - **Robot Name**: Such as "Children's Learning Monitor"
   - **Security Settings**: It is recommended to select "Custom Keywords", add keywords like "children's homework", "learning status", "posture reminder"
   - **Avatar**: You can choose a suitable avatar (optional)
6. Click "Complete", copy the generated **Webhook URL** for later use

#### 1.2 Webhook URL Format

The generated Webhook URL format is as follows:
```
https://oapi.dingtalk.com/robot/send?access_token=xxxxxxxxxx
```

#### 1.3 Security Settings Notes

- **Custom Keywords**: Ensure the robot message contains at least one keyword
- **IP Address Whitelist**: If you choose this option, you need to add Vercel server IP to the whitelist (not recommended because Vercel IP is not fixed)
- **Signature**: Advanced security settings, please refer to DingTalk official documentation if needed

### 2. 部署应用

#### 2.1 本地部署

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

#### 2.2 Vercel 一键部署

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/askqing/HomeWork-AIMonitor.git&env=GLM_API_KEY)

部署步骤：
1. 点击上方 "Deploy with Vercel" 按钮
2. 登录 Vercel 账号
3. 在环境变量配置页添加 `GLM_API_KEY`
4. 点击 "Deploy" 按钮完成部署

### 3. 设置应用

1. 访问部署后的应用
2. 点击右上角的「设置」按钮（⚙️）
3. 在设置菜单中：
   - 输入孩子姓名
   - 粘贴之前复制的 **钉钉Webhook URL**
   - 调整通知敏感度（1-10，数值越高越敏感）
   - 根据需要配置通知条件
4. 点击「保存」按钮

### 4. 开始使用

1. 确保摄像头已正确连接
2. 点击「开始监控」按钮
3. 应用将实时监测孩子学习状态：
   - 严重坐姿问题时发送提醒通知
   - 孩子认真学习时发送表扬通知
   - 通知包含孩子当前状态的截图

### 2. Deploy Application

#### 2.1 Local Deployment

1. Clone the project
```bash
git clone https://github.com/askqing/HomeWork-AIMonitor.git
cd HomeWork-AIMonitor
```

2. Install dependencies
```bash
npm install
```

3. Configure environment variables
Create a `.env` file in the root directory and add the following:
```
GLM_API_KEY=your_glm_api_key
```

4. Start the development server
```bash
npm run dev
```

5. Access the application
Open browser and visit `http://localhost:3000`

#### 2.2 Vercel One-Click Deployment

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/askqing/HomeWork-AIMonitor.git&env=GLM_API_KEY)

Deployment steps:
1. Click the "Deploy with Vercel" button above
2. Log in to your Vercel account
3. Add `GLM_API_KEY` in the environment variables configuration page
4. Click the "Deploy" button to complete deployment

### 3. Configure Application

1. Access the deployed application
2. Click the "Settings" button (⚙️) in the upper right corner
3. In the settings menu:
   - Enter child's name
   - Paste the previously copied **DingTalk Webhook URL**
   - Adjust notification sensitivity (1-10, higher values are more sensitive)
   - Configure notification conditions as needed
4. Click the "Save" button

### 4. Start Using

1. Ensure the camera is properly connected
2. Click the "Start Monitoring" button
3. The application will monitor the child's learning status in real-time:
   - Sends reminder notifications for serious posture issues
   - Sends praise notifications when the child is studying diligently
   - Notifications include screenshots of the child's current status

## 钉钉机器人常见问题解决方案

### 问题1：消息发送失败，提示 "机器人发送消息失败，错误码：310000"

**原因**：消息内容中未包含设置的自定义关键词

**解决方案**：
1. 检查钉钉机器人设置中的自定义关键词
2. 确保通知消息中包含至少一个关键词
3. 可在机器人设置中增加关键词或调整关键词

### 问题2：消息发送失败，提示 "机器人发送消息失败，错误码：40001"

**原因**：Webhook URL 中的 access_token 错误或过期

**解决方案**：
1. 重新生成钉钉机器人的 Webhook URL
2. 在应用设置中更新 Webhook URL

### 问题3：消息发送失败，提示 "请求过于频繁"

**原因**：钉钉机器人每分钟发送消息次数超过限制（20条/分钟）

**解决方案**：
1. 降低应用的监控频率
2. 调整通知敏感度
3. 等待一分钟后再试

### 问题4：图片无法显示

**原因**：图片大小超过钉钉限制或格式不正确

**解决方案**：
1. 检查图片大小（建议小于10KB）
2. 确保使用 JPEG 或 PNG 格式
3. 检查图片 Base64 编码是否正确

### 问题5：应用无法获取摄像头

**原因**：浏览器摄像头权限未开启或被其他应用占用

**解决方案**：
1. 检查浏览器摄像头权限设置
2. 确保摄像头未被其他应用占用

## DingTalk Robot Common Issues and Solutions

### Issue 1: Message sending failed, error message: "机器人发送消息失败，错误码：310000"

**Cause**: Message content does not contain the set custom keywords

**Solutions**:
1. Check the custom keywords in DingTalk robot settings
2. Ensure the notification message contains at least one keyword
3. You can add or adjust keywords in the robot settings

### Issue 2: Message sending failed, error message: "机器人发送消息失败，错误码：40001"

**Cause**: The access_token in the Webhook URL is incorrect or expired

**Solutions**:
1. Regenerate the Webhook URL for the DingTalk robot
2. Update the Webhook URL in the application settings

### Issue 3: Message sending failed, error message: "请求过于频繁"

**Cause**: The DingTalk robot has exceeded the message sending limit per minute (20 messages/minute)

**Solutions**:
1. Reduce the application's monitoring frequency
2. Adjust notification sensitivity
3. Try again after one minute

### Issue 4: Image cannot be displayed

**Cause**: Image size exceeds DingTalk limit or format is incorrect

**Solutions**:
1. Check the image size (recommended to be less than 10KB)
2. Ensure JPEG or PNG format is used
3. Check if the image Base64 encoding is correct

### Issue 5: Application cannot access the camera

**Cause**: Browser camera permissions are not enabled or the camera is occupied by another application

**Solutions**:
1. Check browser camera permission settings
2. Ensure the camera is not occupied by another application
3. 尝试重新加载页面
4. 使用 Chrome 或 Firefox 浏览器

## 通知规则详解

### 坐姿提醒规则

- 仅当坐姿问题严重时发送通知（得分 ≥ 7/10）
- 避免频繁通知，设置了合理的通知间隔
- 坐姿问题包括：弯腰驼背、头部前倾、侧身等

### 表扬机制规则

- 孩子认真学习时自动发送表扬通知
- 根据以下因素综合评估：
  - 坐姿良好程度
  - 学习专注度
  - 学习持续时间
  - 学习活动类型（写作业、阅读、听课、做练习等）
- 表扬内容个性化，根据孩子特点生成

### 通知频率控制

- 系统内置通知频率限制
- 避免同一问题短时间内重复通知
- 可根据需求调整通知敏感度

### 紧急通知优先级

- 严重坐姿问题：高优先级
- 长时间分心：中优先级
- 学习表扬：中优先级
- 一般提醒：低优先级

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

### 1. Configure DingTalk Robot

#### 1.1 Create DingTalk Robot

1. Open DingTalk desktop client and enter the group chat where you want to receive notifications
2. Click the 「Settings」 button in the upper right corner of the group chat
3. Select 「Smart Group Assistant」 from the settings menu
4. Click 「Add Robot」, then select 「Custom」 robot
5. Enter the robot settings page and fill in the following information:
   - **Robot Name**: e.g., "Child Homework Monitoring Robot"
   - **Security Settings**: It is recommended to select 「Custom Keywords」, add keywords such as "homework", "learning status", "posture reminder"
   - **Avatar**: You can choose an appropriate avatar (optional)
6. Click 「Finish」 and copy the generated **Webhook URL** for later use

#### 1.2 Webhook URL Format

The generated Webhook URL format is as follows:
```
https://oapi.dingtalk.com/robot/send?access_token=xxxxxxxxxx
```

#### 1.3 Security Settings Notes

- **Custom Keywords**: Ensure that the notification message contains at least one keyword, otherwise the message will fail to send
- **IP Whitelist**: If you select this option, you need to add Vercel server IP to the whitelist (not recommended because Vercel IP is not fixed)
- **Signature**: Advanced security settings, please refer to DingTalk official documentation if needed

### 2. Deploy Application

#### 2.1 Local Deployment

1. Clone the project
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

#### 2.2 Vercel One-Click Deployment

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/askqing/HomeWork-AIMonitor.git&env=GLM_API_KEY)

Deployment steps:
1. Click the "Deploy with Vercel" button above
2. Log in to your Vercel account
3. Add `GLM_API_KEY` in the environment variables configuration page
4. Click the "Deploy" button to complete deployment

### 3. Set Up Application

1. Access the deployed application
2. Click the 「Settings」 button (⚙️) in the upper right corner
3. In the settings menu:
   - Enter your child's name
   - Paste the **DingTalk Webhook URL** copied earlier
   - Adjust notification sensitivity (1-10, higher value means more sensitive)
   - Configure notification conditions as needed
4. Click the 「Save」 button

### 4. Start Using

1. Ensure the camera is properly connected
2. Click the 「Start Monitoring」 button
3. The application will monitor your child's learning status in real-time:
   - Send reminder notifications for severe posture issues
   - Send praise notifications when your child is studying diligently
   - Notifications include screenshots of your child's current status

## Common Issues and Solutions for DingTalk Robot

### Issue 1: Message sending failed, error message: "Robot message sending failed, error code: 310000"

**Reason**: The message content does not contain the set custom keywords

**Solution**:
1. Check the custom keywords in DingTalk robot settings
2. Ensure that the notification message contains at least one keyword
3. You can add keywords or adjust keywords in the robot settings

### Issue 2: Message sending failed, error message: "Robot message sending failed, error code: 40001"

**Reason**: The access_token in the Webhook URL is incorrect or expired

**Solution**:
1. Regenerate the Webhook URL for the DingTalk robot
2. Update the Webhook URL in the application settings

### Issue 3: Message sending failed, error message: "Request too frequent"

**Reason**: The DingTalk robot exceeds the message sending limit per minute (20 messages/minute)

**Solution**:
1. Reduce the monitoring frequency of the application
2. Adjust notification sensitivity
3. Wait for one minute and try again

### Issue 4: Images cannot be displayed

**Reason**: Image size exceeds DingTalk limits or format is incorrect

**Solution**:
1. Check image size (recommended to be less than 10KB)
2. Ensure JPEG or PNG format is used
3. Check if the Base64 encoding of the image is correct

### Issue 5: Application cannot access camera

**Reason**: Browser camera permissions are not enabled or occupied by other applications

**Solution**:
1. Check browser camera permission settings
2. Ensure the camera is not occupied by other applications
3. Try reloading the page
4. Use Chrome or Firefox browser

## Detailed Notification Rules

### Posture Reminder Rules

- Only send notifications when posture issues are severe (score ≥ 7/10)
- Avoid frequent notifications by setting reasonable notification intervals
- Posture issues include: hunchback, head forward, side tilt, etc.

### Praise Mechanism Rules

- Automatically send praise notifications when the child is studying diligently
- Comprehensive evaluation based on the following factors:
  - Good posture level
  - Learning focus
  - Learning duration
  - Learning activity type (doing homework, reading, listening to lectures, doing exercises, etc.)
- Personalized praise content generated based on children's characteristics

### Notification Frequency Control

- Built-in notification frequency limit
- Avoid repeated notifications for the same issue in a short period
- Notification sensitivity can be adjusted according to needs

### Emergency Notification Priority

- Severe posture issues: High priority
- Long-term distraction: Medium priority
- Learning praise: Medium priority
- General reminders: Low priority

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
