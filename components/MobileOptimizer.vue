<template>
  <!-- 空组件，仅用于逻辑处理 -->
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'

// 防止移动端双击缩放
let lastTouchEnd = 0

const preventDoubleTapZoom = (e) => {
  const now = Date.now()
  if (now - lastTouchEnd <= 300) {
    e.preventDefault()
  }
  lastTouchEnd = now
}

// 防止移动端拖动时触发页面滚动
const preventPullToRefresh = (e) => {
  if (e.touches.length !== 1) return
  
  const touch = e.touches[0]
  const el = document.elementFromPoint(touch.clientX, touch.clientY)
  
  // 只在特定元素上阻止
  if (el && (el.tagName === 'BUTTON' || el.tagName === 'INPUT' || el.tagName === 'SELECT')) {
    e.preventDefault()
  }
}

// 改善移动端滚动性能
const improveScrollPerformance = () => {
  document.documentElement.style.setProperty('--webkit-overflow-scrolling', 'touch')
  document.documentElement.style.setProperty('overflow-scrolling', 'touch')
}

// 检测PWA模式
const detectPWAMode = () => {
  const isInStandaloneMode = () => {
    return window.matchMedia('(display-mode: standalone)').matches || 
           window.navigator.standalone === true
  }
  
  if (isInStandaloneMode()) {
    console.log('运行在PWA模式中')
    document.documentElement.classList.add('pwa-mode')
  }
}

onMounted(() => {
  // 确保在客户端环境中执行
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return
  }
  
  // 添加事件监听器
  document.addEventListener('touchend', preventDoubleTapZoom, { passive: false })
  document.addEventListener('touchmove', preventPullToRefresh, { passive: false })
  
  // 应用滚动优化
  improveScrollPerformance()
  
  // 检测PWA模式
  detectPWAMode()
  
  // 检测设备类型并添加到html标签
  const userAgent = navigator.userAgent.toLowerCase()
  if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
    document.documentElement.classList.add('ios-device')
  } else if (userAgent.includes('android')) {
    document.documentElement.classList.add('android-device')
  }
})

onUnmounted(() => {
  // 清理事件监听器
  document.removeEventListener('touchend', preventDoubleTapZoom)
  document.removeEventListener('touchmove', preventPullToRefresh)
})
</script>

<style>
/* 全局移动端优化样式 */
.pwa-mode {
  /* PWA模式下的特殊样式 */
  user-select: none;
}

/* 改善移动端输入体验 */
input, textarea, select {
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  border-radius: 0;
}

/* 移除移动端输入框的内阴影 */
input[type="text"],
input[type="password"],
input[type="email"],
input[type="number"],
textarea {
  -webkit-box-shadow: none;
  box-shadow: none;
}

/* 改善移动端按钮触摸反馈 */
button:active {
  opacity: 0.7;
}

/* 改善移动端滚动条 */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}

/* 改善移动端选择文本 */
::selection {
  background-color: rgba(52, 152, 219, 0.3);
}

/* iOS设备特定样式 */
.ios-device input,
.ios-device textarea,
.ios-device select {
  font-size: 16px; /* 防止iOS自动缩放 */
}

.ios-device button {
  cursor: pointer;
}

/* Android设备特定样式 */
.android-device input,
.android-device textarea,
.android-device select {
  font-size: 16px;
}

/* 触摸设备优化 */
@media (hover: none) and (pointer: coarse) {
  /* 增加可点击区域 */
  a, button, input[type="button"], input[type="submit"] {
    min-height: 44px;
    min-width: 44px;
  }
  
  /* 改善触摸反馈 */
  *:active {
    opacity: 0.7;
  }
}

/* 防止长按菜单 */
* {
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  user-select: none;
}

input, textarea {
  -webkit-touch-callout: default;
  -webkit-user-select: text;
  user-select: text;
}

/* 改善移动端动画性能 */
* {
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}
</style>