<template>
  <div class="container" @touchstart="handleTouchStart" @touchmove="handleTouchStart">
    <!-- 头部 -->
    <header class="app-header">
      <div class="header-content">
        <div class="header-left">
          <h1 class="app-title">🤖 AI作业小助手</h1>
          <p class="app-subtitle">AI智能监督，培养良好学习习惯</p>
        </div>
        <div class="header-right">
          <div class="status-indicator" :class="statusClass">
            <div class="status-dot"></div>
            <span class="status-text">{{ statusText }}</span>
          </div>
          <div class="current-time">
            {{ currentTime }}
          </div>
          <!-- 设置按钮 -->
          <button 
            @click="toggleSettingsMenu"
            class="btn-settings"
            aria-label="打开设置菜单"
          >
            ⚙️
          </button>
        </div>
      </div>
    </header>

    <!-- 主内容区 -->
    <main class="main-content">
      <div class="dashboard-grid">
        <!-- 左侧：摄像头监控区 -->
        <div class="camera-section">
          <div class="camera-card">
            <div class="card-header">
              <h3>📸 实时监控</h3>
              <div class="card-actions">
                <button 
                  @click="toggleMonitoring" 
                  class="btn-monitor"
                  :class="{ 'btn-active': isMonitoring }"
                  :disabled="!isCameraActive || hasError"
                >
                  <span class="btn-icon">{{ isMonitoring ? '⏸️' : '▶️' }}</span>
                  <span>{{ isMonitoring ? '停止监控' : '开始监控' }}</span>
                </button>
                <button @click="selectCamera" class="btn-secondary" :disabled="!isCameraActive || hasError">
                  <span class="btn-icon">📷</span>
                  <span>切换摄像头</span>
                </button>
              </div>
            </div>
            
            <div class="camera-container">
              <!-- 摄像头错误提示 -->
              <div v-if="hasError && !isCameraActive" class="camera-error">
                <div class="error-icon">📷</div>
                <h3>摄像头无法启动</h3>
                <p class="error-message">{{ cameraErrorMessage }}</p>
                <div class="error-solutions">
                  <p>请尝试以下解决方案：</p>
                  <ul>
                    <li>1. 检查摄像头权限设置</li>
                    <li>2. 确保摄像头没有被其他应用占用</li>
                    <li>3. 尝试重新加载页面</li>
                    <li>4. 更换浏览器（推荐Chrome）</li>
                  </ul>
                </div>
                <button @click="initCamera" class="btn-retry">
                  🔄 重新尝试
                </button>
              </div>
              
              <!-- 真实摄像头 -->
              <video 
                ref="videoElement" 
                autoplay 
                playsinline 
                class="camera-feed"
                :class="{ 'camera-active': isCameraActive }"
                muted
              ></video>
              
              <!-- 摄像头未激活提示 -->
              <div v-if="!isCameraActive && !hasError" class="camera-placeholder">
                <div class="placeholder-icon">📷</div>
                <p class="placeholder-text">摄像头未激活</p>
                <button @click="initCamera" class="btn-primary">
                  启用摄像头
                </button>
              </div>
              
              <!-- 覆盖层：活动提醒 -->
              <div v-if="showActivityAlert" class="activity-overlay">
                <div class="overlay-content">
                  <div class="overlay-icon">⚠️</div>
                  <h4>活动提醒</h4>
                  <p>{{ activityAlertMessage }}</p>
                </div>
              </div>
            </div>
            
            <!-- 摄像头控制 -->
            <div class="camera-controls">
              <div class="control-group">
                <label class="control-label">监控频率：</label>
                <select v-model="captureInterval" class="control-select" :disabled="!isCameraActive">
                  <option :value="3000">3秒/次</option>
                  <option :value="5000">5秒/次</option>
                  <option :value="10000">10秒/次</option>
                </select>
              </div>

              <div class="control-group">
                <label class="control-label">图像质量：</label>
                <select v-model="imageQuality" class="control-select">
                  <option :value="0.5">较低(适合通知)</option>
                  <option :value="0.7">标准</option>
                  <option :value="0.9">较高</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <!-- 中间：分析结果区 -->
        <div class="analysis-section">
          <!-- 统计卡片 -->
          <div class="stats-grid">
            <div class="stat-card" :class="stats.goodPosture > 0 ? 'stat-good' : ''">
              <div class="stat-icon">👍</div>
              <div class="stat-content">
                <div class="stat-value">{{ stats.goodPosture }}</div>
                <div class="stat-label">端正坐姿</div>
              </div>
            </div>
            
            <div class="stat-card" :class="stats.badPosture > 0 ? 'stat-warning' : ''">
              <div class="stat-icon">⚠️</div>
              <div class="stat-content">
                <div class="stat-value">{{ stats.badPosture }}</div>
                <div class="stat-label">坐姿提醒</div>
              </div>
            </div>
            
            <div class="stat-card" :class="stats.alertsSent > 0 ? 'stat-alert' : ''">
              <div class="stat-icon">📤</div>
              <div class="stat-content">
                <div class="stat-value">{{ stats.alertsSent }}</div>
                <div class="stat-label">家长通知</div>
              </div>
            </div>
            
            <div class="stat-card stat-total">
              <div class="stat-icon">📊</div>
              <div class="stat-content">
                <div class="stat-value">{{ stats.totalChecks }}</div>
                <div class="stat-label">总检测次数</div>
              </div>
            </div>
          </div>

          <!-- 当前分析结果 -->
          <div class="current-analysis">
            <div class="card-header">
              <h3>🔍 当前分析结果</h3>
              <span class="last-update">上次更新：{{ lastAnalysisTime || '--:--:--' }}</span>
            </div>
            
            <div v-if="currentAnalysis" class="analysis-result">
              <div class="result-section posture-result" :class="postureResultClass">
                <div class="result-header">
                  <span class="result-icon">{{ postureResultIcon }}</span>
                  <h4>坐姿分析</h4>
                </div>
                <div class="result-content">
                  <p class="result-desc">{{ currentAnalysis.postureAnalysis.details }}</p>
                  <div v-if="currentAnalysis.postureAnalysis.issues.length > 0" class="result-issues">
                    <span class="issues-label">问题：</span>
                    <span class="issues-list">{{ currentAnalysis.postureAnalysis.issues.join('，') }}</span>
                  </div>
                  <div v-if="currentAnalysis.postureAnalysis.advice" class="result-advice">
                    <span class="advice-label">建议：</span>
                    <span class="advice-text">{{ currentAnalysis.postureAnalysis.advice }}</span>
                  </div>
                </div>
              </div>
              
              <div class="result-section activity-result" :class="activityResultClass">
                <div class="result-header">
                  <span class="result-icon">{{ activityResultIcon }}</span>
                  <h4>活动分析</h4>
                </div>
                <div class="result-content">
                  <p class="result-desc">{{ currentAnalysis.activityAnalysis.details }}</p>
                  <div class="result-meta">
                    <span class="meta-item">
                      <span class="meta-label">状态：</span>
                      <span class="meta-value">{{ currentAnalysis.activityAnalysis.isStudying ? '学习中' : '非学习' }}</span>
                    </span>
                    <span class="meta-item">
                      <span class="meta-label">通知：</span>
                      <span class="meta-value" :class="currentAnalysis.shouldNotify ? 'notify-yes' : 'notify-no'">
                        {{ currentAnalysis.shouldNotify ? '需通知家长' : '无需通知' }}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div v-else class="analysis-placeholder">
              <div class="placeholder-icon">🔍</div>
              <p>暂无分析数据</p>
              <p class="placeholder-hint">请开始监控以获取分析结果</p>
            </div>
          </div>

          <!-- 分析日志 -->
          <div class="analysis-log">
            <div class="card-header">
              <h3>📝 分析日志</h3>
              <button @click="clearLogs" class="btn-text">
                <span class="btn-icon">🗑️</span>
                <span>清空日志</span>
              </button>
            </div>

            <div class="log-container-scroll">
              <div class="log-container-inner">
                <div
                  v-for="(log, index) in analysisLogs"
                  :key="index"
                  class="log-entry"
                  :class="log.type"
                >
                  <div class="log-time">{{ log.time }}</div>
                  <div class="log-message">{{ log.message }}</div>
                  <div v-if="log.notified" class="log-notified">
                    <span class="notified-icon">📤</span>
                    <span class="notified-text">已通知</span>
                  </div>
                </div>

                <div v-if="analysisLogs.length === 0" class="log-empty">
                  <div class="empty-icon">📄</div>
                  <p>暂无日志记录</p>
                </div>
              </div>
            </div>
          </div>
        </div>


      </div>
    </main>

    <!-- 设置菜单弹窗 -->
    <div v-if="showSettingsMenu" class="settings-menu-overlay">
      <div class="settings-menu">
        <div class="menu-header">
          <h3>⚙️ 系统设置</h3>
          <button @click="showSettingsMenu = false" class="btn-close">&times;</button>
        </div>
        
        <div class="menu-content">
          <!-- 孩子信息 -->
          <div class="setting-group">
            <h4 class="setting-title">👦 孩子信息</h4>
            <div class="setting-item">
              <label class="setting-label">孩子姓名：</label>
              <input 
                type="text" 
                v-model="childName" 
                placeholder="请输入孩子姓名"
                class="setting-input"
              />
            </div>
          </div>
          
          <!-- 检测设置 -->
          <div class="setting-group">
            <h4 class="setting-title">🔍 检测设置</h4>
            
            <div class="setting-item">
              <label class="setting-checkbox">
                <input 
                  type="checkbox" 
                  v-model="enablePostureDetection" 
                  class="checkbox-input"
                />
                <span class="checkbox-custom"></span>
                <span class="checkbox-label">启用坐姿检测</span>
              </label>
            </div>
            
            <div class="setting-item">
              <label class="setting-checkbox">
                <input 
                  type="checkbox" 
                  v-model="enableActivityDetection" 
                  class="checkbox-input"
                />
                <span class="checkbox-custom"></span>
                <span class="checkbox-label">启用活动检测</span>
              </label>
            </div>
            
            <div class="setting-item">
              <label class="setting-label">检测敏感度：</label>
              <input 
                type="range" 
                v-model="sensitivity" 
                min="1" 
                max="10" 
                class="setting-slider"
              />
              <span class="slider-value">{{ sensitivity }}</span>
            </div>
            
            <div class="setting-item">
              <label class="setting-label">监控频率（毫秒）：</label>
              <input 
                type="number" 
                v-model="captureInterval" 
                min="3000" 
                max="30000" 
                step="500"
                placeholder="3000"
                class="setting-input"
              />
            </div>
          </div>
          
          <!-- 通知设置 -->
          <div class="setting-group">
            <h4 class="setting-title">🔔 通知设置</h4>
            
            <div class="setting-item">
              <label class="setting-checkbox">
                <input 
                  type="checkbox" 
                  v-model="enableNotifications" 
                  class="checkbox-input"
                />
                <span class="checkbox-custom"></span>
                <span class="checkbox-label">启用家长通知</span>
              </label>
            </div>
            
            <div class="setting-item">
              <label class="setting-label">钉钉Webhook：</label>
              <div class="webhook-input-group">
                <input 
                  type="text" 
                  v-model="dingtalkWebhook" 
                  placeholder="请输入钉钉机器人Webhook地址"
                  class="setting-input"
                />
                <button 
                  @click="toggleDingtalkHelpModal"
                  class="btn-help"
                  aria-label="钉钉机器人配置帮助"
                >
                  ❓
                </button>
              </div>
              <button @click="saveSettings" class="btn-save">保存</button>
            </div>
            
            <div class="setting-item">
              <label class="setting-checkbox">
                <input 
                  type="checkbox" 
                  v-model="notifyConditions.phone" 
                  class="checkbox-input"
                  :disabled="!enableNotifications"
                />
                <span class="checkbox-custom"></span>
                <span class="checkbox-label">玩手机</span>
              </label>
              <label class="setting-checkbox">
                <input 
                  type="checkbox" 
                  v-model="notifyConditions.snack" 
                  class="checkbox-input"
                  :disabled="!enableNotifications"
                />
                <span class="checkbox-custom"></span>
                <span class="checkbox-label">吃零食</span>
              </label>
              <label class="setting-checkbox">
                <input 
                  type="checkbox" 
                  v-model="notifyConditions.leave" 
                  class="checkbox-input"
                  :disabled="!enableNotifications"
                />
                <span class="checkbox-custom"></span>
                <span class="checkbox-label">离开座位</span>
              </label>
              <label class="setting-checkbox">
                <input 
                  type="checkbox" 
                  v-model="notifyConditions.distracted" 
                  class="checkbox-input"
                  :disabled="!enableNotifications"
                />
                <span class="checkbox-custom"></span>
                <span class="checkbox-label">分心</span>
              </label>
              <label class="setting-checkbox">
                <input 
                  type="checkbox" 
                  v-model="notifyConditions.monitorStartStop" 
                  class="checkbox-input"
                  :disabled="!enableNotifications"
                />
                <span class="checkbox-custom"></span>
                <span class="checkbox-label">监控开关</span>
              </label>
            </div>
          </div>
          
          <!-- 系统操作 -->
          <div class="setting-group">
            <h4 class="setting-title">⚙️ 系统操作</h4>
            
            <div class="setting-item">
              <button @click="saveSettings" class="btn-primary">保存所有设置</button>
              <button @click="resetSettings" class="btn-danger">恢复默认设置</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 弹窗 -->
    <!-- 活动提醒弹窗 -->
    <div v-if="showActivityAlertModal" class="alert-modal-overlay">
      <div class="alert-modal">
        <div class="alert-icon">⚠️</div>
        <h3 class="alert-title">活动提醒</h3>
        <p class="alert-message">{{ activityAlertMessage }}</p>
        <button @click="dismissActivityAlert" class="alert-button">
          知道了
        </button>
      </div>
    </div>
    
    <!-- 通知测试弹窗 -->
    <div v-if="showTestNotificationModal" class="modal-overlay" @click="showTestNotificationModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>测试通知</h3>
          <button @click="showTestNotificationModal = false" class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          <p>正在发送测试通知到钉钉...</p>
          <div v-if="testNotificationResult" class="test-result" :class="testNotificationResult.success ? 'success' : 'error'">
            {{ testNotificationResult.message }}
          </div>
        </div>
      </div>
    </div>

    <!-- 底栏 -->
    <footer class="app-footer">
      <div class="footer-content">
          <div class="footer-section">
            <span class="footer-text">© 2026 {{ appName }}</span>
            <span class="footer-divider">|</span>
            <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer" class="footer-link icp-link">
              <span class="footer-text">备案号：{{ icpRecordNumber }}</span>
            </a>
          </div>
        <div class="footer-section">
          <a href="mailto:support@example.com" class="footer-link">联系我们</a>
          <span class="footer-divider">|</span>
          <a href="#" @click.prevent="openDonateModal" class="footer-link">支持捐助</a>
        </div>
      </div>
    </footer>

    <!-- 捐助弹窗 -->
    <div v-if="showDonateModal" class="modal-overlay" @click="showDonateModal = false">
      <div class="modal-content donate-modal" @click.stop>
        <div class="modal-header">
          <h3>支持项目</h3>
          <button @click="showDonateModal = false" class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          <p class="donate-text">感谢您对本项目的支持！</p>
          <p class="donate-desc">您的支持将帮助我们持续改进和开发更多功能。</p>

          <!-- 支付二维码 -->
          <div class="donate-qr-container">
            <!-- 微信支付 -->
            <div class="qr-card">
              <h4 class="qr-title">微信支付</h4>
              <div class="qr-placeholder">
                <img src="/wx.jpg" alt="微信支付二维码" class="payment-qr" @click="showEnlargedImage('/wx.jpg', '微信支付二维码')" />
              </div>
              <p class="qr-tip">请使用微信扫描二维码支持我们</p>
            </div>

            <!-- 支付宝 -->
            <div class="qr-card">
              <h4 class="qr-title">支付宝</h4>
              <div class="qr-placeholder">
                <img src="/zfb.jpg" alt="支付宝二维码" class="payment-qr" @click="showEnlargedImage('/zfb.jpg', '支付宝二维码')" />
              </div>
              <p class="qr-tip">请使用支付宝扫描二维码支持我们</p>
            </div>
          </div>

          <p class="donate-tip">支持金额随意，感谢您的支持！</p>
        </div>
      </div>
    </div>
    
    <!-- 放大图片模态框 -->
    <div v-if="showEnlargedImageModal" class="modal-overlay" @click="showEnlargedImageModal = false">
      <div class="modal-content enlarged-image-modal" @click.stop>
        <div class="modal-header">
          <h3>{{ enlargedImageAlt }}</h3>
          <button @click="showEnlargedImageModal = false" class="modal-close">&times;</button>
        </div>
        <div class="modal-body enlarged-image-body">
          <div class="enlarged-image-container">
            <img :src="enlargedImageSrc" :alt="enlargedImageAlt" class="enlarged-image" />
          </div>
          <div class="enlarged-image-actions">
            <button @click="saveImage" class="action-button save-button">
              <span class="icon">💾</span> 保存图片
            </button>
            <button @click="showEnlargedImageModal = false" class="action-button close-button">
              <span class="icon">✕</span> 关闭
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 钉钉机器人配置帮助模态框 -->
    <div v-if="showDingtalkHelpModal" class="modal-overlay" @click="showDingtalkHelpModal = false">
      <div class="modal-content dingtalk-help-modal" @click.stop>
        <div class="modal-header">
          <h3>📲 钉钉机器人配置帮助</h3>
          <button @click="showDingtalkHelpModal = false" class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          <div class="help-content">
            <h4>如何获取钉钉Webhook地址？</h4>
            <div class="help-steps">
              <div class="help-step">
                <div class="step-number">1</div>
                <div class="step-content">
                  <p>打开钉钉电脑客户端，进入要接收通知的群聊</p>
                </div>
              </div>
              <div class="help-step">
                <div class="step-number">2</div>
                <div class="step-content">
                  <p>点击群聊右上角的「设置」按钮</p>
                </div>
              </div>
              <div class="help-step">
                <div class="step-number">3</div>
                <div class="step-content">
                  <p>在弹出的设置菜单中选择「智能群助手」</p>
                </div>
              </div>
              <div class="help-step">
                <div class="step-number">4</div>
                <div class="step-content">
                  <p>点击「添加机器人」，然后选择「自定义」机器人</p>
                </div>
              </div>
              <div class="help-step">
                <div class="step-number">5</div>
                <div class="step-content">
                  <p>填写机器人名称，安全设置选择「自定义关键词」，添加关键词如「作业」、「学习」等</p>
                </div>
              </div>
              <div class="help-step">
                <div class="step-number">6</div>
                <div class="step-content">
                  <p>点击「完成」，复制生成的Webhook URL并粘贴到上方输入框中</p>
                </div>
              </div>
            </div>
            
            <div class="help-image">
              <h4>配置示意图：</h4>
              <img src="/setding.png" alt="钉钉机器人配置示意图" class="help-image" />
            </div>
            
            <div class="help-note">
              <h4>注意事项：</h4>
              <ul>
                <li>确保Webhook URL中包含access_token参数</li>
                <li>自定义关键词至少包含一个与通知内容相关的词</li>
                <li>不要分享Webhook URL给他人，避免被滥用</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'

// 获取环境变量
const appName = ref('AI作业小助手')
const icpRecordNumber = ref('京ICP备XXXXXXXXXX号')

// 状态管理
const videoElement = ref(null)
const stream = ref(null)

// 设备检测
const isMobile = ref(false)
const isIOS = ref(false)
const isAndroid = ref(false)

// 监控状态
const isMonitoring = ref(false)
const isCameraActive = ref(false)
const hasError = ref(false)
const captureInterval = ref(3000)
const imageQuality = ref(0.5) // 默认设为较低质量，适合钉钉通知
const showActivityAlert = ref(false)
const showActivityAlertModal = ref(false)
const activityAlertMessage = ref('')
const showTestNotificationModal = ref(false)
const showDonateModal = ref(false)

// 放大图片模态框控制
const showEnlargedImageModal = ref(false)
const enlargedImageSrc = ref('')
const enlargedImageAlt = ref('')

// 分析控制标志，防止并发请求
const isAnalyzing = ref(false)

// 设置菜单状态
const showSettingsMenu = ref(false)

// 钉钉机器人帮助模态框
const showDingtalkHelpModal = ref(false)

// 切换设置菜单显示/隐藏
const toggleSettingsMenu = () => {
  showSettingsMenu.value = !showSettingsMenu.value
}

// 切换钉钉机器人帮助模态框
const toggleDingtalkHelpModal = () => {
  showDingtalkHelpModal.value = !showDingtalkHelpModal.value
}

// 分析状态
const currentAnalysis = ref(null)
const lastAnalysisTime = ref('')
const analysisLogs = ref([])
const currentTime = ref('')
const cameraErrorMessage = ref('')

// 设置项
const childName = ref('小明')
const enablePostureDetection = ref(true)
const enableActivityDetection = ref(true)
const enableNotifications = ref(true)
const sensitivity = ref(7) // 提高默认敏感度
const dingtalkWebhook = ref('')

// 通知条件
const notifyConditions = ref({
  phone: true,
  snack: true,
  leave: true,
  distracted: true,
  monitorStartStop: true
})

// 统计信息
const stats = ref({
  goodPosture: 0,
  badPosture: 0,
  alertsSent: 0,
  totalChecks: 0
})

// 测试结果
const testNotificationResult = ref(null)

// 计时器
let monitoringTimer = null
let timeUpdateTimer = null
let canvasElement = null
let notificationCanvas = null

// 计算属性
const statusText = computed(() => {
  if (hasError.value) return '摄像头错误'
  if (!isCameraActive.value) return '摄像头未激活'
  if (isMonitoring.value) return `监控中 (${captureInterval.value/1000}秒/次)`
  return '已暂停'
})

const statusClass = computed(() => {
  if (hasError.value) return 'status-error'
  if (!isCameraActive.value) return 'status-inactive'
  if (isMonitoring.value) return 'status-active'
  return 'status-paused'
})

const postureResultClass = computed(() => {
  if (!currentAnalysis.value) return ''
  return currentAnalysis.value.postureAnalysis?.isGoodPosture ? 'result-good' : 'result-warning'
})

const postureResultIcon = computed(() => {
  if (!currentAnalysis.value) return '🤔'
  return currentAnalysis.value.postureAnalysis?.isGoodPosture ? '👍' : '⚠️'
})

const activityResultClass = computed(() => {
  if (!currentAnalysis.value) return ''
  return currentAnalysis.value.activityAnalysis?.requiresNotification ? 'result-alert' : 'result-normal'
})

const activityResultIcon = computed(() => {
  if (!currentAnalysis.value) return '🤔'
  if (currentAnalysis.value.activityAnalysis?.isStudying) return '📚'
  if (currentAnalysis.value.activityAnalysis?.requiresNotification) return '🚨'
  return '🧘'
})

// 设备检测
const detectDevice = () => {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera
  
  isMobile.value = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)
  isIOS.value = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream
  isAndroid.value = /Android/i.test(userAgent)
  
  console.log('设备检测:', {
    mobile: isMobile.value,
    iOS: isIOS.value,
    android: isAndroid.value
  })
}

// 初始化
onMounted(async () => {
  detectDevice()
  loadSettings()
  initTimeUpdate()
  
  // 创建隐藏的canvas
  canvasElement = document.createElement('canvas')
  notificationCanvas = document.createElement('canvas')
  
  // 等待DOM渲染完成后初始化摄像头
  nextTick(() => {
    setTimeout(() => {
      initCamera()
    }, 500)
  })
})

onUnmounted(() => {
  stopMonitoring()
  stopCamera()
  clearInterval(timeUpdateTimer)
})

// 支付功能 - 移动端跳转，PC端显示二维码
// 打开捐助弹窗
const openDonateModal = () => {
  showDonateModal.value = true
}

// 显示放大的图片
const showEnlargedImage = (src, alt) => {
  enlargedImageSrc.value = src
  enlargedImageAlt.value = alt
  showEnlargedImageModal.value = true
}

// 保存图片到本地
const saveImage = async () => {
  try {
    // 创建一个新的图片对象
    const img = new Image()
    img.crossOrigin = 'anonymous' // 允许跨域图片
    img.src = enlargedImageSrc.value

    // 等待图片加载完成
    await new Promise((resolve, reject) => {
      img.onload = resolve
      img.onerror = reject
    })

    // 创建canvas元素
    const canvas = document.createElement('canvas')
    canvas.width = img.width
    canvas.height = img.height
    
    // 绘制图片到canvas
    const ctx = canvas.getContext('2d')
    ctx.drawImage(img, 0, 0)

    // 将canvas转换为Blob
    canvas.toBlob((blob) => {
      if (!blob) {
        throw new Error('Failed to create image blob')
      }

      // 创建下载链接
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = enlargedImageAlt.value + '.jpg' // 使用图片alt作为文件名
      
      // 触发下载
      document.body.appendChild(a)
      a.click()
      
      // 清理
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      // 显示成功提示
      addLog('图片保存成功', 'success')
    }, 'image/jpeg', 1.0)
  } catch (error) {
    console.error('保存图片失败:', error)
    addLog('图片保存失败', 'error')
  }
}

// 时间更新
const initTimeUpdate = () => {
  updateTime()
  timeUpdateTimer = setInterval(updateTime, 1000)
}

const updateTime = () => {
  const now = new Date()
  currentTime.value = now.toLocaleTimeString('zh-CN', { 
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// 摄像头管理
const initCamera = async () => {
  try {
    hasError.value = false
    isCameraActive.value = false
    
    console.log('开始初始化摄像头...')
    
    // 检查浏览器是否支持getUserMedia
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('您的浏览器不支持摄像头功能，请使用Chrome、Edge或Safari最新版本')
    }
    
    // 尝试多个分辨率配置
    const constraintsList = [
      {
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 30 },
          facingMode: 'user'
        }
      },
      {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 },
          facingMode: 'user'
        }
      },
      {
        video: true // 最简配置，让浏览器自动选择
      }
    ]
    
    let streamData = null
    let lastError = null
    
    // 尝试多个配置
    for (const constraints of constraintsList) {
      try {
        console.log('尝试摄像头配置:', constraints)
        streamData = await navigator.mediaDevices.getUserMedia(constraints)
        console.log('摄像头配置成功:', constraints)
        break
      } catch (err) {
        lastError = err
        console.warn('摄像头配置失败:', constraints, err.message)
        continue
      }
    }
    
    if (!streamData) {
      throw lastError || new Error('无法启动摄像头，请检查权限设置')
    }
    
    stream.value = streamData
    
    // 等待视频元素就绪
    if (videoElement.value) {
      videoElement.value.srcObject = streamData
      
      // 添加事件监听器
      videoElement.value.onloadedmetadata = () => {
        console.log('视频元数据加载完成')
        isCameraActive.value = true
        hasError.value = false
        addLog('摄像头初始化成功', 'success')
      }
      
      videoElement.value.onerror = (e) => {
        console.error('视频元素错误:', e)
        addLog('摄像头启动失败', 'error')
        hasError.value = true
        isCameraActive.value = false
      }
      
      videoElement.value.onplaying = () => {
        console.log('视频开始播放')
        isCameraActive.value = true
        hasError.value = false
      }
      
      // 设置超时检测
      setTimeout(() => {
        if (!isCameraActive.value) {
          console.warn('摄像头启动超时')
          addLog('摄像头启动超时，尝试重新初始化', 'warning')
          videoElement.value.srcObject = null
          initCamera() // 重新尝试初始化
        }
      }, 5000)
    }
    
  } catch (error) {
    console.error('摄像头访问失败:', error)
    hasError.value = true
    isCameraActive.value = false
    
    let errorMessage = error.message
    
    // 根据错误类型提供更友好的提示
    if (error.name === 'NotAllowedError') {
      errorMessage = '摄像头权限被拒绝，请允许浏览器访问摄像头'
    } else if (error.name === 'NotFoundError') {
      errorMessage = '未找到摄像头设备，请检查摄像头是否连接'
    } else if (error.name === 'NotReadableError') {
      errorMessage = '摄像头正被其他应用占用，请关闭其他使用摄像头的应用'
    } else if (error.name === 'OverconstrainedError') {
      errorMessage = '摄像头不支持所需的分辨率，尝试使用较低分辨率'
    }
    
    cameraErrorMessage.value = errorMessage
    addLog(`摄像头错误: ${errorMessage}`, 'error')
    
    console.error('完整错误信息:', {
      name: error.name,
      message: error.message,
      constraint: error.constraint
    })
  }
}

// 停止摄像头
const stopCamera = () => {
  if (stream.value) {
    try {
      const tracks = stream.value.getTracks()
      tracks.forEach(track => {
        track.stop()
        console.log('停止摄像头轨道:', track.kind)
      })
      stream.value = null
    } catch (e) {
      console.error('停止摄像头时出错:', e)
    }
  }
  
  if (videoElement.value) {
    videoElement.value.srcObject = null
  }
  
  isCameraActive.value = false
  console.log('摄像头已停止')
}

// 切换摄像头
const selectCamera = async () => {
  try {
    stopCamera()
    addLog('正在切换摄像头...', 'info')
    
    // 等待一小段时间确保摄像头完全释放
    await new Promise(resolve => setTimeout(resolve, 500))
    
    await initCamera()
    
  } catch (error) {
    console.error('切换摄像头失败:', error)
    addLog(`切换摄像头失败: ${error.message}`, 'error')
  }
}

// 图像捕获 - 用于预览
const captureImage = () => {
  if (!videoElement.value || !isCameraActive.value) {
    console.warn('摄像头未就绪，无法捕获图像')
    return null
  }
  
  try {
    const video = videoElement.value
    
    // 设置canvas尺寸与视频一致
    canvasElement.width = video.videoWidth
    canvasElement.height = video.videoHeight
    
    const ctx = canvasElement.getContext('2d')
    ctx.drawImage(video, 0, 0, canvasElement.width, canvasElement.height)
    
    // 转换为base64 - 使用较高质量用于预览
    const base64Image = canvasElement.toDataURL('image/jpeg', 0.8)
    return base64Image.split(',')[1]
  } catch (error) {
    console.error('图像捕获失败:', error)
    addLog('图像捕获失败', 'error')
    return null
  }
}

// AI分析
const analyzeImage = async (base64Image) => {
  console.log('开始AI分析...')
  
  // 设置分析中标志，防止并发请求
  isAnalyzing.value = true
  
  try {
    const requestData = {
      image: base64Image,
      enablePostureDetection: enablePostureDetection.value,
      enableActivityDetection: enableActivityDetection.value,
      childName: childName.value,
      sensitivity: sensitivity.value,
      // 通知相关参数
      webhookUrl: dingtalkWebhook.value,
      enableAINotifications: enableNotifications.value,
      autoSendNotification: enableNotifications.value,
      // AI通知增强参数
      childAge: 10,
      childGender: 'unknown',
      interests: [],
      personalityTraits: [],
      enablePostureNotifications: true,
      enableActivityNotifications: true,
      enablePraiseMessages: true,
      customNotificationRules: {}
    }
    
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData)
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API请求失败: ${response.status} ${errorText}`)
    }
    
    const result = await response.json()
    
    if (!result.success) {
      throw new Error(result.error || 'AI分析失败')
    }
    
    // 处理结果
    processAnalysisResult(result, base64Image)
    
    return result
    
  } catch (error) {
    console.error('AI分析失败:', error)
    
    // 生成模拟结果作为降级方案
    const fallbackResult = generateFallbackAnalysis()
    processAnalysisResult(fallbackResult)
    
    addLog(`分析失败，使用本地模拟: ${error.message}`, 'warning')
    return fallbackResult
  } finally {
    // 清除分析中标志
    isAnalyzing.value = false
  }
}

// 处理分析结果
const processAnalysisResult = async (result, base64Image = null) => {
  console.log('处理分析结果:', result)
  
  // 更新时间
  lastAnalysisTime.value = new Date().toLocaleTimeString('zh-CN', { hour12: false })
  
  // 更新当前分析结果
  currentAnalysis.value = result
  
  // 更新统计
  stats.value.totalChecks++
  
  const timestamp = new Date().toLocaleTimeString('zh-CN', { hour12: false })
  
  // 处理坐姿分析
  if (result.postureAnalysis) {
    if (result.postureAnalysis.isGoodPosture) {
      stats.value.goodPosture++
      addLog(`✅ 坐姿端正: ${result.postureAnalysis.details}`, 'good')
    } else {
      stats.value.badPosture++
      addLog(`⚠️ 坐姿提醒: ${result.postureAnalysis.details}`, 'warning')
    }
  }
  
  // 处理活动分析
  if (result.activityAnalysis) {
    const activity = result.activityAnalysis

    // 显示前端活动提醒
    if (!activity.isStudying && activity.requiresNotification) {
      showActivityAlert.value = true
      showActivityAlertModal.value = true
      activityAlertMessage.value = `${activity.details}，请注意！`

      // 10秒后自动关闭
      setTimeout(() => {
        showActivityAlert.value = false
        showActivityAlertModal.value = false
      }, 10000)
    }

    if (activity.requiresNotification) {
      addLog(`🚨 活动检测: ${activity.details}`, 'alert')

      // 检查是否需要发送家长通知
      if (enableNotifications.value && result.shouldNotify && base64Image) {
        const shouldSend = checkNotificationConditions(activity)

        if (shouldSend) {
          // 压缩图片后再发送通知
          const compressedImage = await compressImageForNotification(base64Image)
          // 传递完整的 analysisResult 以启用 AI 优先级推送
          sendNotification(compressedImage, activity.details, 'activity', result)
          stats.value.alertsSent++
          addLog('📤 已发送家长通知', 'alert', true)
        } else {
          addLog('活动异常，但未达到通知条件', 'warning')
        }
      }
    } else {
      addLog(`📝 ${activity.details}`, 'info')
    }
  }
  
  // 保存统计
  saveStats()
}

// 检查通知条件
const checkNotificationConditions = (activityAnalysis) => {
  const activity = activityAnalysis.currentActivity
  
  // 处理具体的分心行为
  if ((activity === '玩手机' || activity === '玩游戏' || activity === '浏览网页') && notifyConditions.value.phone) return true
  if (activity === '吃零食' && notifyConditions.value.snack) return true
  if (activity === '离开座位' && notifyConditions.value.leave) return true
  if ((activity === '其他分心行为' || activity === '发呆' || activity === '聊天' || activity === '其他') && notifyConditions.value.distracted) return true
  
  return false
}

// 压缩图片 - 专门用于钉钉通知（确保小于20KB）
const compressImageForNotification = (base64Image) => {
  try {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        // 创建压缩用的canvas
        const canvas = notificationCanvas
        const maxWidth = 400 // 限制宽度
        const maxHeight = 300 // 限制高度
        let width = img.width
        let height = img.height
        
        // 计算缩放比例
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round(height * maxWidth / width)
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width = Math.round(width * maxHeight / height)
            height = maxHeight
          }
        }
        
        canvas.width = width
        canvas.height = height
        
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)
        
        // 使用较低质量压缩，确保文件小
        let quality = 0.4
        let compressedDataUrl
        
        // 尝试不同质量直到小于15KB（留出空间给其他数据）
        for (let i = 0; i < 5; i++) {
          compressedDataUrl = canvas.toDataURL('image/jpeg', quality)
          const base64 = compressedDataUrl.split(',')[1]
          
          // 检查大小（base64字符串比实际字节大约33%）
          if (base64.length * 0.75 < 15000) { // 大约15KB
            console.log(`图片压缩成功: 质量 ${quality}, 大小 ${Math.round(base64.length * 0.75 / 1024)}KB`)
            resolve(base64)
            return
          }
          
          quality -= 0.1
        }
        
        // 如果还是太大，使用最低质量
        compressedDataUrl = canvas.toDataURL('image/jpeg', 0.1)
        const finalBase64 = compressedDataUrl.split(',')[1]
        console.log(`图片使用最低质量压缩: 大小 ${Math.round(finalBase64.length * 0.75 / 1024)}KB`)
        resolve(finalBase64)
      }
      
      img.onerror = reject
      img.src = `data:image/jpeg;base64,${base64Image}`
    })
  } catch (error) {
    console.error('图片压缩失败:', error)
    // 如果压缩失败，返回原始图片（可能会超过大小限制）
    return base64Image
  }
}

// 生成降级分析结果
const generateFallbackAnalysis = () => {
  const now = new Date()
  const minute = now.getMinutes()
  
  // 基于时间生成不同的结果
  let activity, requiresNotification
  
  // 增加玩手机的检测概率
  const activities = [
    { name: '学习', probability: 0.5, notify: false },
    { name: '玩手机', probability: 0.3, notify: true },
    { name: '吃零食', probability: 0.1, notify: true },
    { name: '离开座位', probability: 0.05, notify: true },
    { name: '其他分心行为', probability: 0.05, notify: true }
  ]
  
  // 选择活动
  const random = Math.random()
  let cumulative = 0
  for (const act of activities) {
    cumulative += act.probability
    if (random <= cumulative) {
      activity = act
      break
    }
  }
  
  // 坐姿随机
  const postureScore = 6 + Math.floor(Math.random() * 4)
  const isGoodPosture = postureScore >= 7
  
  return {
    success: true,
    postureAnalysis: {
      isGoodPosture,
      postureScore,
      details: isGoodPosture 
        ? `${childName.value}坐姿良好，保持正确姿势`
        : `${childName.value}坐姿需要调整，请注意保护视力`,
      issues: isGoodPosture ? [] : ['轻微前倾'],
      advice: isGoodPosture 
        ? '继续保持良好坐姿'
        : '请调整坐姿，背部挺直'
    },
    activityAnalysis: {
      currentActivity: activity.name,
      isStudying: activity.name === '学习',
      details: `${childName.value}正在${activity.name}`,
      requiresNotification: activity.notify && sensitivity.value > 5,
      notificationReason: activity.notify && sensitivity.value > 5 
        ? `检测到${activity.name}行为`
        : null
    },
    shouldNotify: activity.notify && sensitivity.value > 5,
    timestamp: now.toISOString(),
    isFallback: true
  }
}

// 发送钉钉通知
const sendNotification = async (base64Image, activityDetails, type = 'activity', analysisResult = null) => {
  // 检查Webhook地址
  if (!dingtalkWebhook.value || !dingtalkWebhook.value.includes('dingtalk.com')) {
    console.warn('钉钉Webhook地址未配置或格式不正确')
    addLog('钉钉通知失败：Webhook地址未配置', 'error')
    return false
  }

  try {
    console.log('发送钉钉通知...', type)

    let messageBody
    if (type === 'monitor') {
      // 监控开始/停止通知
      messageBody = {
        childName: childName.value,
        status: activityDetails, // '开始监控' 或 '停止监控'
        webhook: dingtalkWebhook.value,
        isMonitorNotification: true
      }
    } else {
      // 活动通知 - 传递 analysisResult 以启用 AI 优先级推送
      messageBody = {
        image: base64Image,
        childName: childName.value,
        activity: activityDetails,
        webhook: dingtalkWebhook.value,
        analysisResult: analysisResult, // 传递分析结果用于 AI 优先级判断
        enableAINotifications: true, // 启用 AI 通知
        sensitivity: sensitivity.value
      }
    }
    
    const response = await fetch('/api/notify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messageBody)
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`通知发送失败: ${response.status} ${errorText}`)
    }
    
    const result = await response.json()
    
    if (result.success) {
      console.log('钉钉通知发送成功:', result)
      return true
    } else {
      console.error('钉钉通知失败:', result.error)
      addLog(`钉钉通知失败: ${result.error}`, 'error')
      return false
    }
    
  } catch (error) {
    console.error('发送通知失败:', error)
    addLog(`通知发送失败: ${error.message}`, 'error')
    return false
  }
}

// 测试通知
const testNotification = async () => {
  showTestNotificationModal.value = true
  testNotificationResult.value = null
  
  try {
    // 捕获当前图像
    const base64Image = captureImage()
    const compressedImage = base64Image ? await compressImageForNotification(base64Image) : 'test-image-base64'
    
    const response = await fetch('/api/notify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: compressedImage,
        childName: childName.value,
        activity: '测试通知：系统运行正常',
        webhook: dingtalkWebhook.value,
        isTest: true
      })
    })
    
    const result = await response.json()
    
    testNotificationResult.value = {
      success: result.success,
      message: result.success 
        ? '✅ 测试通知发送成功，请检查钉钉群'
        : `❌ 测试失败: ${result.error || '未知错误'}`
    }
    
  } catch (error) {
    testNotificationResult.value = {
      success: false,
      message: `❌ 测试失败: ${error.message}`
    }
  }
}

// 监控控制
const toggleMonitoring = async () => {
  if (isMonitoring.value) {
    await stopMonitoring()
  } else {
    await startMonitoring()
  }
}

const startMonitoring = async () => {
  if (!isCameraActive.value) {
    addLog('请先启用摄像头', 'warning')
    return
  }

  isMonitoring.value = true
  addLog('开始监控', 'success')

  // 发送监控开始通知
  await sendMonitorNotification('开始监控')

  // 立即执行一次分析
  executeAnalysis()

  // 设置定时器
  monitoringTimer = setInterval(executeAnalysis, captureInterval.value)
}

const stopMonitoring = async () => {
  isMonitoring.value = false

  if (monitoringTimer) {
    clearInterval(monitoringTimer)
    monitoringTimer = null
  }

  addLog('监控已停止', 'info')

  // 发送监控停止通知
  await sendMonitorNotification('停止监控')
}

// 发送监控状态通知
const sendMonitorNotification = async (status) => {
  if (!dingtalkWebhook.value || !dingtalkWebhook.value.includes('dingtalk.com')) {
    console.warn('钉钉Webhook地址未配置，跳过监控状态通知')
    return
  }

  try {
    const response = await fetch('/api/notify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        childName: childName.value,
        webhook: dingtalkWebhook.value,
        isMonitorNotification: true,
        status: status
      })
    })

    const result = await response.json()
    if (result.success) {
      addLog(`已发送${status}通知`, 'info', true)
    } else {
      addLog(`${status}通知发送失败: ${result.error}`, 'error')
    }
  } catch (error) {
    console.error('监控通知发送失败:', error)
    addLog(`${status}通知发送失败`, 'error')
  }
}

const executeAnalysis = async () => {
  if (!isMonitoring.value || isAnalyzing.value) return
  
  const base64Image = captureImage()
  
  if (base64Image) {
    await analyzeImage(base64Image)
  }
}

// 设置管理
const loadSettings = () => {
  try {
    const saved = localStorage.getItem('homeworkMonitorSettings')
    if (saved) {
      const settings = JSON.parse(saved)
      
      childName.value = settings.childName || '小明'
      enablePostureDetection.value = settings.enablePostureDetection ?? true
      enableActivityDetection.value = settings.enableActivityDetection ?? true
      enableNotifications.value = settings.enableNotifications ?? true
      sensitivity.value = settings.sensitivity || 7
      captureInterval.value = settings.captureInterval || 3000
      dingtalkWebhook.value = settings.dingtalkWebhook || ''
      
      if (settings.notifyConditions) {
        notifyConditions.value = settings.notifyConditions
      }
    }
    
    // 加载日志
    const savedLogs = localStorage.getItem('homeworkMonitorLogs')
    if (savedLogs) {
      analysisLogs.value = JSON.parse(savedLogs)
    }
    
    // 加载统计
    const savedStats = localStorage.getItem('homeworkMonitorStats')
    if (savedStats) {
      stats.value = JSON.parse(savedStats)
    }
    
  } catch (error) {
    console.error('加载设置失败:', error)
  }
}

const saveSettings = () => {
  try {
    const settings = {
      childName: childName.value,
      enablePostureDetection: enablePostureDetection.value,
      enableActivityDetection: enableActivityDetection.value,
      enableNotifications: enableNotifications.value,
      sensitivity: sensitivity.value,
      captureInterval: captureInterval.value,
      dingtalkWebhook: dingtalkWebhook.value,
      notifyConditions: notifyConditions.value
    }
    
    localStorage.setItem('homeworkMonitorSettings', JSON.stringify(settings))
    
    addLog('设置已保存', 'success')
    
  } catch (error) {
    console.error('保存设置失败:', error)
    addLog('保存设置失败', 'error')
  }
}

const saveStats = () => {
  try {
    localStorage.setItem('homeworkMonitorStats', JSON.stringify(stats.value))
  } catch (error) {
    console.error('保存统计失败:', error)
  }
}

const resetSettings = () => {
  if (confirm('确定要恢复默认设置吗？这将清除所有自定义设置。')) {
    localStorage.removeItem('homeworkMonitorSettings')
    localStorage.removeItem('homeworkMonitorLogs')
    localStorage.removeItem('homeworkMonitorStats')
    
    // 重置为默认值
    childName.value = '小明'
    enablePostureDetection.value = true
    enableActivityDetection.value = true
    enableNotifications.value = true
    sensitivity.value = 7
    captureInterval.value = 3000
    dingtalkWebhook.value = ''
    
    notifyConditions.value = {
      phone: true,
      snack: true,
      leave: true,
      distracted: true,
      monitorStartStop: true
    }
    
    stats.value = {
      goodPosture: 0,
      badPosture: 0,
      alertsSent: 0,
      totalChecks: 0
    }
    
    analysisLogs.value = []
    currentAnalysis.value = null
    
    addLog('设置已恢复默认', 'info')
  }
}

// 日志管理
const addLog = (message, type = 'info', notified = false) => {
  const timestamp = new Date().toLocaleTimeString('zh-CN', { hour12: false })
  
  analysisLogs.value.unshift({
    time: timestamp,
    message,
    type,
    notified
  })
  
  // 限制日志数量
  if (analysisLogs.value.length > 100) {
    analysisLogs.value = analysisLogs.value.slice(0, 100)
  }
  
  // 自动保存日志
  setTimeout(() => {
    try {
      localStorage.setItem('homeworkMonitorLogs', JSON.stringify(analysisLogs.value))
    } catch (e) {
      console.error('保存日志失败:', e)
    }
  }, 100)
}

const clearLogs = () => {
  if (confirm('确定要清空所有日志吗？')) {
    analysisLogs.value = []
    localStorage.removeItem('homeworkMonitorLogs')
    addLog('日志已清空', 'info')
  }
}

const exportLogs = () => {
  const logsText = analysisLogs.value.map(log => 
    `[${log.time}] ${log.message}`
  ).join('\n')
  
  const statsText = `端正坐姿: ${stats.value.goodPosture}
坐姿提醒: ${stats.value.badPosture}
家长通知: ${stats.value.alertsSent}
总检测次数: ${stats.value.totalChecks}`
  
  const exportData = `AI作业小助手 - 日志导出
导出时间: ${new Date().toLocaleString()}
孩子姓名: ${childName.value}

=== 统计信息 ===
${statsText}

=== 详细日志 ===
${logsText}`
  
  const blob = new Blob([exportData], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `作业监督日志_${childName.value}_${new Date().toISOString().slice(0,10)}.txt`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  
  addLog('日志已导出', 'success')
}

// 工具函数
const dismissActivityAlert = () => {
  showActivityAlert.value = false
  showActivityAlertModal.value = false
}

// 触摸事件处理
const handleTouchStart = (event) => {
  // 防止默认行为
  event.preventDefault()
}
</script>

<style scoped>
/* 容器 */
.container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  width: 100%;
  position: relative;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

/* 头部 */
.app-header {
  background: white;
  padding: 16px 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
  flex-shrink: 0;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1600px;
  margin: 0 auto;
  width: 100%;
}

.header-left {
  flex: 1;
}

.app-title {
  font-size: 24px;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 4px;
}

.app-subtitle {
  font-size: 14px;
  color: #7f8c8d;
  margin: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  background: #f8f9fa;
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #95a5a6;
}

.status-indicator.status-active .status-dot {
  background: #2ecc71;
  animation: pulse 2s infinite;
}

.status-indicator.status-paused .status-dot {
  background: #f39c12;
}

.status-indicator.status-error .status-dot {
  background: #e74c3c;
}

.status-indicator.status-inactive .status-dot {
  background: #95a5a6;
}

.current-time {
  font-family: 'Courier New', monospace;
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
  padding: 8px 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

/* 设置按钮 */
.btn-settings {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  background: #f8f9fa;
  color: #2c3e50;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.btn-settings:hover {
  background: #e9ecef;
  transform: rotate(90deg);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.btn-settings:active {
  transform: rotate(90deg) scale(0.95);
}

/* 设置菜单覆盖层 */
.settings-menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
}

/* 设置菜单 */
.settings-menu {
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  animation: slideIn 0.3s ease;
}

/* 菜单头部 */
.menu-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e9ecef;
  position: sticky;
  top: 0;
  background: white;
  z-index: 10;
}

.menu-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 18px;
  font-weight: 600;
}

.btn-close {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  background: #f8f9fa;
  color: #7f8c8d;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.btn-close:hover {
  background: #e9ecef;
  color: #2c3e50;
}

/* 菜单内容 */
.menu-content {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
  max-height: calc(80vh - 72px); /* 80vh减去头部高度 */
}

/* 设置组 */
.setting-group {
  margin-bottom: 24px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

/* 设置标题 */
.setting-title {
  margin: 0 0 16px 0;
  color: #2c3e50;
  font-size: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 设置项 */
.setting-item {
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
}

/* 设置标签 */
.setting-label {
  font-size: 14px;
  color: #2c3e50;
  font-weight: 500;
  min-width: 100px;
}

/* 设置输入框 */
.setting-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  font-size: 14px;
  color: #2c3e50;
  transition: all 0.3s ease;
}

.setting-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

/* 设置滑块 */
.setting-slider {
  flex: 1;
  height: 6px;
  border-radius: 3px;
  background: #dee2e6;
  outline: none;
  -webkit-appearance: none;
}

.setting-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #667eea;
  cursor: pointer;
  transition: all 0.3s ease;
}

.setting-slider::-webkit-slider-thumb:hover {
  background: #5a6fd8;
  transform: scale(1.2);
}

.setting-slider::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #667eea;
  cursor: pointer;
  border: none;
  transition: all 0.3s ease;
}

.setting-slider::-moz-range-thumb:hover {
  background: #5a6fd8;
  transform: scale(1.2);
}

/* 滑块值 */
.slider-value {
  min-width: 30px;
  text-align: center;
  font-size: 14px;
  font-weight: 600;
  color: #667eea;
}

/* 设置复选框 */
.setting-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  color: #2c3e50;
}

.checkbox-input {
  display: none;
}

.checkbox-custom {
  width: 18px;
  height: 18px;
  border: 2px solid #dee2e6;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  background: white;
}

.checkbox-input:checked + .checkbox-custom {
  background: #667eea;
  border-color: #667eea;
}

.checkbox-input:checked + .checkbox-custom::after {
  content: '✓';
  color: white;
  font-size: 12px;
  font-weight: bold;
}

.checkbox-label {
  font-size: 14px;
  color: #2c3e50;
  font-weight: 500;
}

/* 按钮样式 */
.btn-primary {
  padding: 8px 16px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary:hover {
  background: #5a6fd8;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.btn-danger {
  padding: 8px 16px;
  background: #e74c3c;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-danger:hover {
  background: #c0392b;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(231, 76, 60, 0.3);
}

.btn-save {
  padding: 8px 16px;
  background: #2ecc71;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-save:hover {
  background: #27ae60;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(46, 204, 113, 0.3);
}

/* 动画 */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 主内容 */
.main-content {
  flex: 1;
  padding: 24px;
  max-width: 1600px;
  margin: 0 auto;
  width: 100%;
  min-height: calc(100vh - 140px);
  display: flex;
  flex-direction: column;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  flex: 1;
}

@media (max-width: 1400px) {
  .dashboard-grid {
    grid-template-columns: 1fr 1fr;
    grid-template-rows: auto auto;
  }
  
  .settings-section {
    grid-column: 1 / -1;
  }
}

@media (max-width: 1024px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}

/* 卡片通用样式 */
.camera-card,
.analysis-log,
.current-analysis,
.settings-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #eee;
}

.card-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 摄像头区域 */
.camera-container {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  background: #000;
  overflow: hidden;
  border-radius: 0;
  flex-shrink: 0;
}

.camera-feed {
  width: 100%;
  height: 100%;
  object-fit: contain;
  opacity: 0;
  transition: opacity 0.3s;
}

.camera-feed.camera-active {
  opacity: 1;
}

.camera-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.placeholder-icon {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.8;
}

.placeholder-text {
  margin-bottom: 24px;
  font-size: 16px;
  opacity: 0.9;
}

.camera-error {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #ff6b6b 0%, #c92a2a 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  padding: 30px;
  text-align: center;
  z-index: 10;
}

.error-icon {
  font-size: 64px;
  margin-bottom: 20px;
}

.camera-error h3 {
  margin: 0 0 15px 0;
  font-size: 24px;
}

.error-message {
  margin: 0 0 25px 0;
  font-size: 16px;
  opacity: 0.9;
  max-width: 600px;
  line-height: 1.5;
}

.error-solutions {
  background: rgba(255, 255, 255, 0.1);
  padding: 20px;
  border-radius: 10px;
  margin: 20px 0;
  text-align: left;
  max-width: 500px;
}

.error-solutions p {
  margin: 0 0 10px 0;
  font-weight: bold;
}

.error-solutions ul {
  margin: 0;
  padding-left: 20px;
}

.error-solutions li {
  margin: 5px 0;
  font-size: 14px;
}

.btn-retry {
  margin-top: 20px;
  padding: 12px 30px;
  background: white;
  color: #c92a2a;
  border: none;
  border-radius: 25px;
  font-weight: bold;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-retry:hover {
  background: #f8f9fa;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.activity-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 193, 7, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.3s;
  z-index: 5;
}

.activity-overlay .overlay-content {
  background: white;
  padding: 24px;
  border-radius: 12px;
  text-align: center;
  max-width: 80%;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.activity-overlay .overlay-icon {
  font-size: 48px;
  margin-bottom: 16px;
  color: #ff9800;
}

.activity-overlay h4 {
  margin: 0 0 8px 0;
  color: #ff9800;
}

.activity-overlay p {
  margin: 0;
  color: #666;
  line-height: 1.5;
}

/* 摄像头控制 */
.camera-controls {
  display: flex;
  gap: 20px;
  padding: 16px 24px;
  background: #f8f9fa;
  border-top: 1px solid #eee;
}

.control-group {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.control-label {
  font-size: 14px;
  color: #666;
  white-space: nowrap;
}

.control-select {
  padding: 6px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
  font-size: 14px;
  flex: 1;
  min-width: 0;
}

/* 截图预览 */
/* 统计卡片 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 24px;
  flex-shrink: 0;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border-left: 4px solid #ddd;
  transition: transform 0.2s, box-shadow 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-card.stat-good {
  border-left-color: #2ecc71;
  background: linear-gradient(135deg, #f1f8e9 0%, #e8f5e9 100%);
}

.stat-card.stat-warning {
  border-left-color: #f39c12;
  background: linear-gradient(135deg, #fff3e0 0%, #ffecb3 100%);
}

.stat-card.stat-alert {
  border-left-color: #e74c3c;
  background: linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%);
}

.stat-card.stat-total {
  border-left-color: #3498db;
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
}

.stat-icon {
  font-size: 32px;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #2c3e50;
  line-height: 1;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #7f8c8d;
}

/* 当前分析结果 */
.current-analysis {
  flex: 1;
  margin-bottom: 24px;
  display: flex;
  flex-direction: column;
  min-height: 300px;
}

.last-update {
  font-size: 12px;
  color: #95a5a6;
}

.analysis-result {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  flex: 1;
}

.result-section {
  padding: 20px;
  border-radius: 10px;
  border: 1px solid #eee;
  transition: all 0.3s;
  flex: 1;
}

.result-section.result-good {
  background: #f1f8e9;
  border-color: #c5e1a5;
}

.result-section.result-warning {
  background: #fff3e0;
  border-color: #ffcc80;
}

.result-section.result-alert {
  background: #ffebee;
  border-color: #ef9a9a;
}

.result-section.result-normal {
  background: #e3f2fd;
  border-color: #90caf9;
}

.result-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.result-icon {
  font-size: 24px;
}

.result-header h4 {
  margin: 0;
  font-size: 16px;
  color: #2c3e50;
}

.result-content {
  font-size: 14px;
  color: #555;
  flex: 1;
}

.result-desc {
  margin: 0 0 12px 0;
  line-height: 1.6;
}

.result-issues,
.result-advice,
.result-meta {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed rgba(0, 0, 0, 0.1);
  font-size: 13px;
}

.issues-label,
.advice-label,
.meta-label {
  font-weight: 600;
  color: #666;
  margin-right: 4px;
}

.issues-list,
.advice-text,
.meta-value {
  color: #444;
}

.meta-item {
  display: inline-block;
  margin-right: 20px;
}

.meta-value.notify-yes {
  color: #e74c3c;
  font-weight: 600;
}

.meta-value.notify-no {
  color: #2ecc71;
  font-weight: 600;
}

.analysis-placeholder {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #95a5a6;
}

.analysis-placeholder .placeholder-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.placeholder-hint {
  font-size: 14px;
  margin-top: 8px;
  opacity: 0.7;
}

/* 分析日志 */
.analysis-log {
  display: flex;
  flex-direction: column;
  height: 400px;
  min-height: 400px;
  max-height: 400px;
}

.log-container-scroll {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  padding: 0;
}

.log-container-inner {
  height: 100%;
  overflow-y: auto;
  padding: 0;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
  scrollbar-color: #cbd5e0 transparent;
}

.log-container-inner::-webkit-scrollbar {
  width: 6px;
}

.log-container-inner::-webkit-scrollbar-track {
  background: transparent;
}

.log-container-inner::-webkit-scrollbar-thumb {
  background-color: #cbd5e0;
  border-radius: 3px;
}

.log-container-inner::-webkit-scrollbar-thumb:hover {
  background-color: #94a3b8;
}

.log-entry {
  display: flex;
  align-items: center;
  padding: 12px 24px;
  border-bottom: 1px solid #f0f0f0;
  transition: background 0.2s;
  min-height: 44px;
}

.log-entry:hover {
  background: #fafafa;
}

.log-entry.good {
  border-left: 4px solid #2ecc71;
  background: #f9fdf7;
}

.log-entry.warning {
  border-left: 4px solid #f39c12;
  background: #fffaf0;
}

.log-entry.alert {
  border-left: 4px solid #e74c3c;
  background: #fff5f5;
}

.log-entry.error {
  border-left: 4px solid #9b59b6;
  background: #f9f0ff;
}

.log-entry.info {
  border-left: 4px solid #3498db;
  background: #f0f8ff;
}

.log-time {
  font-family: 'Courier New', monospace;
  font-size: 12px;
  color: #95a5a6;
  min-width: 70px;
}

.log-message {
  flex: 1;
  font-size: 14px;
  color: #333;
  line-height: 1.4;
}

.log-notified {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #e74c3c;
  background: rgba(231, 76, 60, 0.1);
  padding: 2px 8px;
  border-radius: 10px;
}

.notified-icon {
  font-size: 10px;
}

.log-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #bdc3c7;
}

.log-empty .empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

/* 设置区域 */
.settings-section {
  display: flex;
  flex-direction: column;
}

.settings-card {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.settings-content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.setting-group {
  margin-bottom: 32px;
}

.setting-group:last-child {
  margin-bottom: 0;
}

.setting-title {
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 16px 0;
  padding-bottom: 8px;
  border-bottom: 2px solid #f0f0f0;
}

.setting-item {
  margin-bottom: 20px;
}

.setting-item:last-child {
  margin-bottom: 0;
}

.setting-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #555;
  margin-bottom: 8px;
}

.setting-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.setting-input:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
}

/* Webhook输入组 */
.webhook-input-group {
  display: flex;
  gap: 8px;
  align-items: center;
}

.webhook-input-group .setting-input {
  flex: 1;
}

/* 帮助按钮 */
.btn-help {
  width: 36px;
  height: 36px;
  font-size: 18px;
  border: none;
  border-radius: 6px;
  background-color: #f8f9fa;
  color: #6c757d;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-help:hover {
  background-color: #e9ecef;
  color: #495057;
  transform: scale(1.05);
}

.setting-hint {
  font-size: 12px;
  color: #95a5a6;
  margin-top: 4px;
  line-height: 1.4;
}

.setting-checkbox {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  font-size: 14px;
  color: #555;
  user-select: none;
  min-height: 44px;
}

.checkbox-input {
  display: none;
}

.checkbox-custom {
  width: 20px;
  height: 20px;
  border: 2px solid #ddd;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
}

.checkbox-input:checked + .checkbox-custom {
  background: #3498db;
  border-color: #3498db;
}

.checkbox-input:checked + .checkbox-custom::after {
  content: '✓';
  color: white;
  font-size: 12px;
  font-weight: bold;
}

.checkbox-label {
  flex: 1;
}

/* 敏感度控制 */
.sensitivity-control {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sensitivity-slider {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: #ddd;
  outline: none;
  -webkit-appearance: none;
}

.sensitivity-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #3498db;
  cursor: pointer;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.sensitivity-slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #3498db;
  cursor: pointer;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.sensitivity-labels {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #95a5a6;
}

.label-current {
  color: #3498db;
  font-weight: 600;
}

/* 通知条件 */
.notification-conditions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #eee;
}

.condition-checkbox {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: #555;
  cursor: pointer;
  min-height: 44px;
}

.condition-checkbox input[type="checkbox"] {
  width: 16px;
  height: 16px;
}

/* 系统操作 */
.setting-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.btn-block {
  width: 100%;
  justify-content: center;
}

/* 按钮样式 */
button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  outline: none;
  min-height: 44px;
  -webkit-tap-highlight-color: transparent;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-monitor {
  background: #3498db;
  color: white;
  padding: 12px 24px;
  font-size: 15px;
  font-weight: 600;
}

.btn-monitor:hover:not(:disabled) {
  background: #2980b9;
  transform: translateY(-1px);
}

.btn-monitor.btn-active {
  background: #e74c3c;
}

.btn-monitor.btn-active:hover:not(:disabled) {
  background: #c0392b;
}

.btn-primary {
  background: #3498db;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2980b9;
  transform: translateY(-1px);
}

.btn-secondary {
  background: #95a5a6;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #7f8c8d;
  transform: translateY(-1px);
}

.btn-outline {
  background: transparent;
  color: #3498db;
  border: 2px solid #3498db;
}

.btn-outline:hover:not(:disabled) {
  background: #f0f8ff;
}

.btn-test {
  background: #9b59b6;
  color: white;
}

.btn-test:hover:not(:disabled) {
  background: #8e44ad;
  transform: translateY(-1px);
}

.btn-text {
  background: transparent;
  color: #7f8c8d;
  padding: 6px 12px;
  min-height: auto;
}

.btn-text:hover:not(:disabled) {
  background: #f8f9fa;
  color: #555;
}

.btn-icon {
  font-size: 16px;
}

/* 弹窗 */
.alert-modal-overlay,
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s;
  padding: 20px;
}

.alert-modal {
  background: white;
  padding: 40px;
  border-radius: 16px;
  text-align: center;
  max-width: 400px;
  width: 100%;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  animation: slideUp 0.3s ease;
}

.alert-icon {
  font-size: 64px;
  margin-bottom: 20px;
}

.alert-title {
  margin: 0 0 12px 0;
  color: #2c3e50;
  font-size: 20px;
}

.alert-message {
  margin: 0 0 24px 0;
  color: #666;
  line-height: 1.5;
}

.alert-button {
  background: #3498db;
  color: white;
  padding: 12px 32px;
  font-size: 16px;
  border-radius: 8px;
}

.alert-button:hover {
  background: #2980b9;
}

.modal-content {
  background: white;
  border-radius: 12px;
  max-width: 600px;
  width: 100%;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  animation: slideUp 0.3s ease;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #eee;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  color: #2c3e50;
}

.modal-close {
  background: transparent;
  border: none;
  font-size: 24px;
  color: #95a5a6;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  min-height: auto;
}

.modal-close:hover {
  background: #f8f9fa;
  color: #e74c3c;
}

.modal-body {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.modal-image {
  width: 100%;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.test-result {
  margin-top: 16px;
  padding: 16px;
  border-radius: 8px;
  text-align: center;
  font-weight: 500;
}

.test-result.success {
  background: #f1f8e9;
  color: #2ecc71;
  border: 1px solid #c5e1a5;
}

.test-result.error {
  background: #ffebee;
  color: #e74c3c;
  border: 1px solid #ef9a9a;
}

/* 动画效果 */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.fade-in {
  animation: fadeIn 0.5s ease-in;
}

.slide-up {
  animation: slideUp 0.5s ease-out;
}

/* 改善移动端滚动体验 */
.log-container-inner,
.settings-content,
.modal-body {
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
}

/* 钉钉帮助模态框特定样式 */
.dingtalk-help-modal {
  max-width: 800px;
}

.dingtalk-help-modal .modal-header h3 {
  font-size: 20px;
  color: #2c3e50;
}

.help-content {
  line-height: 1.6;
}

.help-content h4 {
  margin: 24px 0 16px 0;
  color: #34495e;
  font-size: 16px;
}

.help-steps {
  margin: 20px 0;
}

.help-step {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
  align-items: flex-start;
}

.step-number {
  width: 32px;
  height: 32px;
  background: #3498db;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 14px;
  flex-shrink: 0;
}

.step-content {
  flex: 1;
}

.step-content p {
  margin: 0;
  color: #555;
}

.help-image {
  margin: 24px 0;
  text-align: center;
}

.help-image img {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.help-note {
  margin: 24px 0;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #3498db;
}

.help-note ul {
  margin: 8px 0 0 0;
  padding-left: 20px;
}

.help-note li {
  margin-bottom: 8px;
  color: #555;
}

.help-note li:last-child {
  margin-bottom: 0;
}

/* 底栏样式 */
.app-footer {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px 0;
  margin-top: auto;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.footer-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 24px;
}

.footer-section {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.footer-text {
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
}

.footer-divider {
  color: rgba(255, 255, 255, 0.5);
  font-size: 14px;
}

.footer-link {
  color: rgba(255, 255, 255, 0.9);
  text-decoration: none;
  font-size: 14px;
  transition: color 0.2s;
  cursor: pointer;
}

.footer-link:hover {
  color: #fff;
  text-decoration: underline;
}

/* 捐助弹窗样式 */
.donate-modal {
  max-width: 800px;
}

.donate-text {
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 12px;
  text-align: center;
}

.donate-desc {
  color: #7f8c8d;
  margin-bottom: 24px;
  text-align: center;
  line-height: 1.6;
}

/* 二维码容器 */
.donate-qr-container {
  display: flex;
  gap: 32px;
  justify-content: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

/* 二维码卡片 */
.qr-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  text-align: center;
  min-width: 250px;
}

.qr-title {
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 16px;
}

.qr-tip {
  font-size: 12px;
  color: #7f8c8d;
  margin-top: 16px;
  margin-bottom: 8px;
}

/* 金额选择器 */
.donate-amount-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 20px;
  justify-content: center;
}

.amount-btn {
  padding: 10px 20px;
  border: 2px solid #e5e7eb;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: #4b5563;
  transition: all 0.2s;
  min-width: 80px;
}

.amount-btn:hover {
  border-color: #3b82f6;
  color: #3b82f6;
}

.amount-btn.amount-selected {
  border-color: #3b82f6;
  background: #3b82f6;
  color: white;
}

.amount-input {
  padding: 10px 12px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  width: 120px;
  text-align: center;
  transition: border-color 0.2s;
}

.amount-input:focus {
  outline: none;
  border-color: #3b82f6;
}

.donate-placeholder {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

.qr-placeholder {
  width: 200px;
  height: 200px;
  border: 2px dashed #d1d5db;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: #f9fafb;
}

.payment-qr {
  width: 100%;
  height: 100%;
  aspect-ratio: 1 / 1;
  object-fit: contain;
  border-radius: 8px;
  border: 2px solid #e5e7eb;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.payment-qr:hover {
  transform: scale(1.05);
}

/* 放大图片模态框样式 */
.enlarged-image-modal {
  max-width: 80vw;
  max-height: 90vh;
  width: auto;
  height: auto;
  display: flex;
  flex-direction: column;
}

.enlarged-image-body {
  padding: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24px;
}

.enlarged-image-container {
  max-width: 100%;
  max-height: 60vh;
  overflow: auto;
  padding: 16px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.enlarged-image {
  max-width: 100%;
  max-height: 60vh;
  object-fit: contain;
  border-radius: 8px;
}

.enlarged-image-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
}

.action-button {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
}

.save-button {
  background: #3b82f6;
  color: white;
}

.save-button:hover {
  background: #2563eb;
}

.close-button {
  background: #6b7280;
  color: white;
}

.close-button:hover {
  background: #4b5563;
}

.action-button .icon {
  font-size: 16px;
}

.payment-info {
  margin-top: 20px;
  text-align: center;
}

.payment-amount {
  font-size: 20px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 8px;
}

.payment-order-no {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 16px;
  word-break: break-all;
}

.qr-icon {
  font-size: 48px;
  opacity: 0.5;
}

.qr-placeholder p {
  color: #9ca3af;
  font-size: 14px;
  margin: 0;
}

.donate-tip {
  text-align: center;
  color: #3b82f6;
  font-size: 14px;
  margin: 0;
}

/* 支付结果弹窗 */
.payment-result-icon {
  font-size: 64px;
  text-align: center;
  margin-bottom: 20px;
}

.payment-result-message {
  text-align: center;
  font-size: 16px;
  color: #2c3e50;
  margin-bottom: 24px;
  line-height: 1.6;
}

.payment-result-details {
  background: #f9fafb;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.payment-result-details p {
  margin: 8px 0;
  font-size: 14px;
  color: #4b5563;
}

@media (max-width: 768px) {
  .footer-content {
    flex-direction: column;
    text-align: center;
  }

  .footer-section {
    justify-content: center;
  }

  .footer-text,
  .footer-link {
    font-size: 12px;
  }
}

/* 移动端优化：减少不必要的阴影和效果 */
@media (max-width: 768px) {
  .camera-card,
  .analysis-log,
  .current-analysis,
  .settings-card,
  .stat-card {
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  }
  
  button {
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
}

/* 移动端优化：简化过渡效果 */
@media (max-width: 768px) {
  .camera-feed,
  .stat-card,
  button,
  .log-entry {
    transition: none;
  }
}
</style>
