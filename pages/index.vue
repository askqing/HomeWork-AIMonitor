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
                  <option :value="2000">2秒/次</option>
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
            
            <!-- 最新截图预览 -->
            <div class="snapshot-preview">
              <h4>最新截图</h4>
              <div class="snapshot-container">
                <img 
                  v-if="latestSnapshot" 
                  :src="latestSnapshot" 
                  alt="最新截图"
                  class="snapshot-image"
                  @click="showSnapshotPreview = true"
                />
                <div v-else class="snapshot-placeholder">
                  <span class="placeholder-icon">🖼️</span>
                  <p>暂无截图</p>
                </div>
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
            
            <div class="log-container">
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

        
          <div class="settings-card">
            <div class="card-header">
              <h3>⚙️ 系统设置</h3>
            </div>
            
            <div class="settings-content">
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
                  <label class="setting-label">检测敏感度：</label>
                  <div class="sensitivity-control">
                    <input 
                      type="range" 
                      v-model="sensitivity" 
                      min="1" 
                      max="10" 
                      class="sensitivity-slider"
                    />
                    <div class="sensitivity-labels">
                      <span class="label-low">低</span>
                      <span class="label-current">{{ sensitivity }}</span>
                      <span class="label-high">高</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- 通知设置 -->
              <div class="setting-group">
                <h4 class="setting-title">🔔 通知设置</h4>
                
                <div class="setting-item">
                  <div class="setting-label-with-help">
                    <label class="setting-label">钉钉Webhook：</label>
                    <span class="help-icon" @click="showWebhookHelp = true">?</span>
                  </div>
                  <input 
                    type="text" 
                    v-model="dingtalkWebhook" 
                    placeholder="请输入钉钉机器人Webhook地址"
                    class="setting-input"
                  />
                  <p class="setting-hint">
                    格式：https://oapi.dingtalk.com/robot/send?access_token=your_token
                  </p>
                </div>
                
                <div class="setting-item">
                  <label class="setting-label">通知条件：</label>
                  <div class="notification-conditions">
                    <label class="condition-checkbox">
                      <input type="checkbox" v-model="notifyConditions.phone" />
                      <span>玩手机</span>
                    </label>
                    <label class="condition-checkbox">
                      <input type="checkbox" v-model="notifyConditions.snack" />
                      <span>吃零食</span>
                    </label>
                    <label class="condition-checkbox">
                      <input type="checkbox" v-model="notifyConditions.leave" />
                      <span>离开座位</span>
                    </label>
                    <label class="condition-checkbox">
                      <input type="checkbox" v-model="notifyConditions.distracted" />
                      <span>分心行为</span>
                    </label>
                    <label class="condition-checkbox">
                      <input type="checkbox" v-model="notifyConditions.monitorStartStop" />
                      <span>监控开始/停止</span>
                    </label>
                  </div>
                </div>
              </div>
              
              <!-- 系统操作 -->
              <div class="setting-group">
                <h4 class="setting-title">🛠️ 系统操作</h4>
                
                <div class="setting-actions">
                  <button @click="saveSettings" class="btn-primary btn-block">
                    💾 保存设置
                  </button>
                  <button @click="resetSettings" class="btn-secondary btn-block">
                    🔄 恢复默认
                  </button>
                  <button @click="exportLogs" class="btn-outline btn-block">
                    📥 导出日志
                  </button>
                  <button @click="testNotification" class="btn-test btn-block">
                    🔔 测试通知
                  </button>
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
              <label class="setting-label">检测敏感度：</label>
              <div class="sensitivity-control">
                <input 
                  type="range" 
                  v-model="sensitivity" 
                  min="1" 
                  max="10" 
                  class="sensitivity-slider"
                />
                <div class="sensitivity-labels">
                  <span class="label-low">低</span>
                  <span class="label-current">{{ sensitivity }}</span>
                  <span class="label-high">高</span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 通知设置 -->
          <div class="setting-group">
            <h4 class="setting-title">🔔 通知设置</h4>
            
            <div class="setting-item">
              <div class="setting-label-with-help">
                <label class="setting-label">钉钉Webhook：</label>
                <span class="help-icon" @click="showWebhookHelp = true">?</span>
              </div>
              <input 
                type="text" 
                v-model="dingtalkWebhook" 
                placeholder="请输入钉钉机器人Webhook地址"
                class="setting-input"
              />
              <p class="setting-hint">
                格式：https://oapi.dingtalk.com/robot/send?access_token=your_token
              </p>
            </div>
            
            <div class="setting-item">
              <label class="setting-label">通知条件：</label>
              <div class="notification-conditions">
                <label class="condition-checkbox">
                  <input type="checkbox" v-model="notifyConditions.phone" />
                  <span>玩手机</span>
                </label>
                <label class="condition-checkbox">
                  <input type="checkbox" v-model="notifyConditions.snack" />
                  <span>吃零食</span>
                </label>
                <label class="condition-checkbox">
                  <input type="checkbox" v-model="notifyConditions.leave" />
                  <span>离开座位</span>
                </label>
                <label class="condition-checkbox">
                  <input type="checkbox" v-model="notifyConditions.distracted" />
                  <span>分心行为</span>
                </label>
                <label class="condition-checkbox">
                  <input type="checkbox" v-model="notifyConditions.monitorStartStop" />
                  <span>监控开始/停止</span>
                </label>
              </div>
            </div>
          </div>
          
          <!-- 系统操作 -->
          <div class="setting-group">
            <h4 class="setting-title">🛠️ 系统操作</h4>
            
            <div class="setting-actions">
              <button @click="saveSettings" class="btn-primary btn-block">
                💾 保存设置
              </button>
              <button @click="resetSettings" class="btn-secondary btn-block">
                🔄 恢复默认
              </button>
              <button @click="exportLogs" class="btn-outline btn-block">
                📥 导出日志
              </button>
              <button @click="testNotification" class="btn-test btn-block">
                🔔 测试通知
              </button>
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
    
    <!-- 截图预览弹窗 -->
    <div v-if="showSnapshotPreview" class="modal-overlay" @click="showSnapshotPreview = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>截图预览</h3>
          <button @click="showSnapshotPreview = false" class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          <img v-if="latestSnapshot" :src="latestSnapshot" alt="预览" class="modal-image" />
        </div>
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
    
    <!-- Webhook配置帮助弹窗 -->
    <div v-if="showWebhookHelp" class="modal-overlay" @click="showWebhookHelp = false">
      <div class="modal-content webhook-help-content" @click.stop>
        <div class="modal-header">
          <h3>钉钉Webhook配置指南</h3>
          <button @click="showWebhookHelp = false" class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          <div class="help-section">
            <h4>功能说明</h4>
            <p>钉钉Webhook用于将孩子的学习状态通知发送到钉钉群，让您能够及时了解孩子的学习情况。当系统检测到孩子可能影响学习的行为时，会自动发送包含截图的提醒消息到钉钉群。</p>
          </div>
          
          <div class="help-section">
            <img :src="webhookHelpImage" alt="钉钉机器人配置" class="help-image" @error="handleImageError" />
            <div v-if="imageError" class="image-placeholder">
              <p>配置图片将显示在这里</p>
            </div>
          </div>
          
          <div class="help-section">
            <h4>配置方法</h4>
            <ol class="help-steps">
              <li>在钉钉群中，点击右上角"..."，选择"设置" > "智能群助手" > "添加机器人"</li>
              <li>选择"自定义"机器人，点击"添加"</li>
              <li>输入机器人名称（如"儿童学习监督"），选择要添加的群组</li>
              <li><strong>安全设置必须选择"关键词"选项</strong></li>
              <li><strong>在关键词输入框中填写：来自AI作业小助手</strong></li>
              <li>勾选"我已阅读并同意《自定义机器人服务及免责条款》"，点击"完成"</li>
              <li>复制生成的Webhook地址，粘贴到本系统的"钉钉Webhook"输入框中</li>
              <li>点击"测试通知"按钮验证配置是否成功</li>
            </ol>
            <div class="important-note">
              <strong>重要提醒：</strong>关键词必须设置为"来自AI作业小助手"，否则消息无法发送成功！
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'

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
const latestSnapshot = ref('')
const showActivityAlert = ref(false)
const showActivityAlertModal = ref(false)
const activityAlertMessage = ref('')
const showSnapshotPreview = ref(false)
const showTestNotificationModal = ref(false)
const showWebhookHelp = ref(false)
const webhookHelpImage = ref('/setding.png')
const imageError = ref(false)
// 分析控制标志，防止并发请求
const isAnalyzing = ref(false)



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

// 实时保存设置的函数
const saveSettingsAutomatically = () => {
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
    console.log('已自动保存设置')
  } catch (error) {
    console.error('自动保存设置失败:', error)
  }
}

// 为所有设置项添加实时保存监听
watch(
  [childName, enablePostureDetection, enableActivityDetection, enableNotifications, 
   sensitivity, captureInterval, dingtalkWebhook, notifyConditions],
  () => {
    saveSettingsAutomatically()
  },
  { deep: true } // 深度监听对象变化
)

// 单独监听captureInterval变化，确保监控频率实时生效
watch(captureInterval, (newInterval) => {
  if (isMonitoring.value && monitoringTimer) {
    // 清除旧定时器
    clearInterval(monitoringTimer)
    // 设置新定时器
    monitoringTimer = setInterval(executeAnalysis, newInterval)
    console.log(`监控频率已更新为 ${newInterval/1000} 秒/次`)
    addLog(`监控频率已更新为 ${newInterval/1000} 秒/次`, 'info')
  }
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
  
  // 添加点击外部关闭设置菜单的事件监听
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  stopMonitoring()
  stopCamera()
  clearInterval(timeUpdateTimer)
})

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
    latestSnapshot.value = base64Image
    
    return base64Image.split(',')[1]
  } catch (error) {
    console.error('图像捕获失败:', error)
    addLog('图像捕获失败', 'error')
    return null
  }
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
      enableAINotifications: enableNotifications.value,
      webhookUrl: dingtalkWebhook.value,
      autoSendNotification: true,
      enablePostureNotifications: true,
      enableActivityNotifications: true,
      enablePraiseMessages: true
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
          sendNotification(compressedImage, activity.details, 'activity')
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
  
  if (activity === '玩手机' && notifyConditions.value.phone) return true
  if (activity === '吃零食' && notifyConditions.value.snack) return true
  if (activity === '离开座位' && notifyConditions.value.leave) return true
  if (activity === '其他分心行为' && notifyConditions.value.distracted) return true
  
  return false
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
const sendNotification = async (base64Image, activityDetails, type = 'activity') => {
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
      // 活动通知
      messageBody = {
        image: base64Image,
        childName: childName.value,
        activity: activityDetails,
        webhook: dingtalkWebhook.value
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

// 发送监控状态通知
const sendMonitorStatusNotification = async (status) => {
  if (!enableNotifications.value || !notifyConditions.value.monitorStartStop) {
    return
  }
  
  try {
    // 捕获当前图像用于通知
    const base64Image = captureImage()
    const compressedImage = base64Image ? await compressImageForNotification(base64Image) : null
    
    await sendNotification(compressedImage, status, 'monitor')
    
  } catch (error) {
    console.error('发送监控状态通知失败:', error)
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

// 处理图片加载错误
const handleImageError = () => {
  imageError.value = true
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
  
  // 发送开始监控通知
  if (enableNotifications.value && notifyConditions.value.monitorStartStop) {
    await sendMonitorStatusNotification('开始监控')
  }
  
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
  
  // 发送停止监控通知
  if (enableNotifications.value && notifyConditions.value.monitorStartStop) {
    await sendMonitorStatusNotification('停止监控')
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

/* 设置按钮样式 */
.btn-settings {
  background: #3498db;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: white;
  font-size: 20px;
  box-shadow: 0 2px 8px rgba(52, 152, 219, 0.3);
  transition: all 0.2s ease;
}

.btn-settings:hover {
  background: #2980b9;
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.4);
}

.btn-settings:active {
  transform: scale(0.95);
}

/* 设置菜单样式 */
.settings-menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  padding: 80px 24px 24px;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.settings-menu {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
  width: 100%;
  max-width: 400px;
  max-height: calc(100vh - 100px);
  overflow-y: auto;
  animation: slideIn 0.2s ease;
}

@keyframes slideIn {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}

.menu-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #eee;
}

.menu-header h3 {
  margin: 0;
  font-size: 18px;
  color: #2c3e50;
}

.btn-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #95a5a6;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.btn-close:hover {
  background: #f1f2f6;
  color: #2c3e50;
}

.menu-content {
  padding: 24px;
}

/* 适配移动端 */
@media (max-width: 768px) {
  .settings-menu-overlay {
    padding: 80px 16px 16px;
  }
  
  .settings-menu {
    max-width: 100%;
    max-height: calc(100vh - 80px);
  }
  
  .menu-content {
    padding: 16px;
  }
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

/* 主内容 */
.main-content {
  flex: 1;
  padding: 24px;
  max-width: 1600px;
  margin: 0 auto;
  width: 100%;
  min-height: calc(100vh - 140px); /* 确保内容区域足够高 */
  display: flex;
  flex-direction: column;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: 24px;
  flex: 1;
}

/* 隐藏原来的右侧设置区 */
.settings-section {
  display: none !important;
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
  height: 400px;
  background: #000;
  overflow: hidden;
  border-radius: 0;
  flex-shrink: 0;
}

.camera-feed {
  width: 100%;
  height: 100%;
  object-fit: cover;
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
.snapshot-preview {
  padding: 20px 24px;
  border-top: 1px solid #eee;
  flex-shrink: 0;
}

.snapshot-preview h4 {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: #2c3e50;
}

.snapshot-container {
  width: 100%;
  height: 120px;
  border-radius: 8px;
  overflow: hidden;
  background: #f8f9fa;
  border: 2px solid #eee;
  cursor: pointer;
  transition: border-color 0.2s;
}

.snapshot-container:hover {
  border-color: #3498db;
}

.snapshot-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.snapshot-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #95a5a6;
}

.snapshot-placeholder .placeholder-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.snapshot-placeholder p {
  margin: 0;
  font-size: 14px;
}

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
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 300px;
}

.log-container {
  flex: 1;
  overflow-y: auto;
  padding: 0;
  -webkit-overflow-scrolling: touch;
}

.log-entry {
  display: flex;
  align-items: center;
  padding: 12px 24px;
  border-bottom: 1px solid #f0f0f0;
  transition: background 0.2s;
  min-height: 44px; /* 移动端触摸友好 */
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
  min-height: 44px; /* 移动端触摸友好 */
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
  min-height: 44px; /* 移动端触摸友好 */
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
  min-height: 44px; /* 移动端触摸友好 */
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

/* ============ 移动端适配 ============ */

/* 平板设备 (768px - 1024px) */
@media (max-width: 1024px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto auto;
    gap: 20px;
  }
  
  .camera-container {
    height: 350px;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .analysis-log {
    min-height: 300px;
  }
  
  .camera-controls {
    flex-direction: column;
    align-items: stretch;
    gap: 15px;
  }
  
  .control-group {
    justify-content: space-between;
  }
}

/* 手机设备 (425px - 768px) */
@media (max-width: 768px) {
  .app-header {
    padding: 12px 16px;
  }
  
  .header-content {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }
  
  .header-right {
    justify-content: space-between;
  }
  
  .main-content {
    padding: 16px;
  }
  
  .dashboard-grid {
    gap: 16px;
  }
  
  .camera-container {
    height: 300px;
  }
  
  .camera-card .card-header {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }
  
  .card-actions {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  
  .btn-monitor,
  .btn-secondary {
    width: 100%;
    justify-content: center;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .stat-card {
    padding: 15px;
  }
  
  .stat-icon {
    width: 40px;
    height: 40px;
    font-size: 24px;
  }
  
  .stat-value {
    font-size: 24px;
  }
  
  .analysis-result {
    padding: 15px;
  }
  
  .result-section {
    padding: 15px;
  }
  
  .result-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .result-meta {
    flex-direction: column;
    gap: 8px;
  }
  
  .meta-item {
    margin-right: 0;
  }
  
  .log-entry {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .log-time {
    min-width: auto;
  }
  
  .settings-content {
    padding: 16px;
  }
  
  .setting-group {
    margin-bottom: 24px;
  }
  
  .setting-actions {
    gap: 10px;
  }
  
  .notification-conditions {
    padding: 12px;
  }
}

/* 小手机设备 (320px - 425px) */
@media (max-width: 425px) {
  .app-title {
    font-size: 20px;
  }
  
  .app-subtitle {
    font-size: 13px;
  }
  
  .status-indicator {
    padding: 6px 12px;
    font-size: 12px;
  }
  
  .current-time {
    font-size: 14px;
    padding: 6px 12px;
  }
  
  .camera-container {
    height: 250px;
  }
  
  .activity-overlay .overlay-content {
    padding: 20px;
    max-width: 90%;
  }
  
  .activity-overlay .overlay-icon {
    font-size: 36px;
  }
  
  .card-header h3 {
    font-size: 16px;
  }
  
  .last-update {
    font-size: 11px;
  }
  
  .result-content {
    font-size: 13px;
  }
  
  .setting-title {
    font-size: 15px;
  }
  
  .setting-label {
    font-size: 13px;
  }
  
  .setting-input {
    padding: 8px 10px;
    font-size: 13px;
  }
  
  .condition-checkbox {
    font-size: 13px;
  }
  
  button {
    padding: 8px 16px;
    font-size: 13px;
  }
  
  .btn-icon {
    font-size: 14px;
  }
}

/* 超小手机设备 (< 320px) */
@media (max-width: 320px) {
  .camera-container {
    height: 200px;
  }
  
  .stat-value {
    font-size: 20px;
  }
  
  .stat-label {
    font-size: 12px;
  }
  
  .card-header {
    padding: 15px;
  }
  
  .analysis-result,
  .log-entry,
  .setting-item {
    padding: 12px;
  }
}

/* ============ 横屏适配 ============ */
@media (orientation: landscape) and (max-height: 500px) {
  .app-header {
    padding: 8px 16px;
  }
  
  .dashboard-grid {
    grid-template-columns: 1fr 1fr;
    grid-template-rows: auto;
  }
  
  .camera-section {
    grid-column: 1;
  }
  
  .analysis-section {
    grid-column: 2;
    overflow-y: auto;
  }
  
  .settings-section {
    display: none;
  }
  
  .camera-container {
    height: calc(100% - 150px);
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* ============ 触摸设备优化 ============ */
@media (hover: none) and (pointer: coarse) {
  .sensitivity-slider::-webkit-slider-thumb {
    width: 28px;
    height: 28px;
  }
  
  .sensitivity-slider::-moz-range-thumb {
    width: 28px;
    height: 28px;
  }
}

/* ============ 深色模式支持 ============ */
@media (prefers-color-scheme: dark) {
  .camera-card,
  .analysis-log,
  .current-analysis,
  .settings-card,
  .stat-card {
    background: #1e1e1e;
    border-color: #333;
  }
  
  .card-header {
    border-color: #333;
  }
  
  .camera-container {
    background: #000;
  }
  
  .camera-placeholder {
    background: linear-gradient(135deg, #2d3748 0%, #4a5568 100%);
  }
  
  .snapshot-container {
    background: #2d3748;
    border-color: #4a5568;
  }
  
  .result-section {
    border-color: #333;
  }
  
  .log-entry {
    border-color: #333;
  }
  
  .log-entry:hover {
    background: #2d3748;
  }
  
  .notification-conditions {
    background: #2d3748;
    border-color: #4a5568;
  }
  
  .setting-input,
  .control-select {
    background: #2d3748;
    border-color: #4a5568;
    color: #e2e8f0;
  }
  
  .setting-input:focus {
    border-color: #4299e1;
    box-shadow: 0 0 0 2px rgba(66, 153, 225, 0.2);
  }
  
  .checkbox-custom {
    border-color: #4a5568;
    background: #2d3748;
  }
  
  .checkbox-input:checked + .checkbox-custom {
    background: #4299e1;
    border-color: #4299e1;
  }
  
  .sensitivity-slider {
    background: #4a5568;
  }
  
  .sensitivity-slider::-webkit-slider-thumb {
    background: #4299e1;
  }
  
  .sensitivity-slider::-moz-range-thumb {
    background: #4299e1;
  }
}

/* ============ 减少动画 ============ */
@media (prefers-reduced-motion: reduce) {
  .status-dot {
    animation: none !important;
  }
  
  button:hover:not(:disabled) {
    transform: none !important;
  }
  
  .fade-in,
  .slide-up,
  .pulse {
    animation: none !important;
  }
}

/* 确保移动端输入框不会被缩放 */
input, select, textarea {
  font-size: 16px;
}

/* 改善移动端滚动体验 */
.log-container,
.settings-content,
.modal-body {
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
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

/* 移动端优化：简化界面元素 */
@media (max-width: 425px) {
  .header-right {
    flex-direction: column;
    gap: 10px;
  }
  
  .status-indicator,
  .current-time {
    width: 100%;
    justify-content: center;
  }
  
  .camera-controls {
    padding: 12px;
  }
  
  .control-group {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }
  
  .control-label {
    text-align: center;
  }
  
  .result-header {
    text-align: center;
    align-items: center;
  }
  
  .setting-actions {
    grid-template-columns: 1fr;
  }
}

/* 移动端优化：改善小屏幕上的文本换行 */
@media (max-width: 375px) {
  .app-title {
    font-size: 18px;
    text-align: center;
  }
  
  .status-text {
    font-size: 11px;
  }
  
  .log-message {
    font-size: 13px;
  }
  
  .result-desc {
    font-size: 13px;
  }
}

/* PC端特定样式 - 确保页脚在底部 */
@media (min-width: 769px) {
  .container {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  }
  
  .main-content {
    flex: 1;
  }
}

/* Webhook帮助相关样式 */
.setting-label-with-help {
  display: flex;
  align-items: center;
  gap: 8px;
}

.help-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  background-color: #4a90e2;
  color: white;
  border-radius: 50%;
  font-size: 12px;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s;
}

.help-icon:hover {
  background-color: #357abd;
}

.webhook-help-content {
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
}

.help-section {
  margin-bottom: 24px;
}

.help-section h4 {
  color: #333;
  font-size: 18px;
  margin-bottom: 12px;
  border-bottom: 1px solid #eee;
  padding-bottom: 6px;
}

.help-section p {
  color: #666;
  line-height: 1.6;
  margin-bottom: 16px;
}

.help-image {
  max-width: 100%;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  margin: 16px 0;
}

.image-placeholder {
  background-color: #f5f5f5;
  border: 1px dashed #ccc;
  border-radius: 8px;
  padding: 40px;
  text-align: center;
  color: #999;
  margin: 16px 0;
}

.help-steps {
  padding-left: 20px;
  color: #555;
  line-height: 1.8;
}

.help-steps li {
  margin-bottom: 10px;
}

.important-note {
  background-color: #fffbe6;
  border-left: 4px solid #faad14;
  padding: 12px 16px;
  margin-top: 16px;
  border-radius: 4px;
  color: #d46b08;
}

.important-note strong {
  color: #d46b08;
}
</style>