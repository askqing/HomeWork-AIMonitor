<template>
  <footer class="app-footer">
    <div class="footer-content">
      <div class="footer-info">
        <p class="footer-text">
          © 2025 儿童作业监督系统 | 保护儿童视力，培养良好习惯
        </p>
        <p class="footer-disclaimer">
          注意：所有图像数据仅在分析时临时使用，不会永久存储
        </p>
      </div>
      
      <div class="footer-links">
        <a href="#" class="footer-link">隐私政策</a>
        <span class="footer-separator">|</span>
        <a href="#" class="footer-link">使用条款</a>
        <span class="footer-separator">|</span>
        <a href="#" class="footer-link">联系客服</a>
      </div>
    </div>
  </footer>
</template>

<script setup>
// 组件逻辑
</script>

<style scoped>
.app-footer {
  background: #2c3e50;
  color: white;
  padding: 30px 20px;
  width: 100%;
  flex-shrink: 0;
  position: relative;
  bottom: 0;
  left: 0;
  right: 0;
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.footer-info {
  text-align: center;
  width: 100%;
}

.footer-text {
  margin: 0 0 12px 0;
  font-size: 15px;
  opacity: 0.9;
  font-weight: 500;
}

.footer-disclaimer {
  margin: 0;
  font-size: 13px;
  opacity: 0.7;
  line-height: 1.5;
  max-width: 800px;
  margin: 0 auto;
}

.footer-links {
  display: flex;
  align-items: center;
  gap: 15px;
  flex-wrap: wrap;
  justify-content: center;
}

.footer-link {
  color: #3498db;
  text-decoration: none;
  font-size: 14px;
  transition: color 0.2s;
}

.footer-link:hover {
  color: #1abc9c;
  text-decoration: underline;
}

.footer-separator {
  color: #7f8c8d;
  font-size: 12px;
}

/* PC端适配 - 确保页脚在底部 */
@media (min-width: 769px) {
  .app-footer {
    margin-top: auto;
  }
}

/* 移动端适配 */
@media (max-width: 768px) {
  .app-footer {
    padding: 20px 15px;
  }
  
  .footer-content {
    gap: 15px;
  }
  
  .footer-text {
    font-size: 14px;
    margin-bottom: 10px;
  }
  
  .footer-disclaimer {
    font-size: 12px;
  }
  
  .footer-links {
    gap: 10px;
  }
  
  .footer-link {
    font-size: 13px;
  }
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  .app-footer {
    background: #1a1a2e;
  }
  
  .footer-link {
    color: #4dabf7;
  }
  
  .footer-link:hover {
    color: #74c0fc;
  }
}
</style>