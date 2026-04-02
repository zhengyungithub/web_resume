<template>
  <div class="word-cloud-container relative">
    <!-- 弹窗遮罩 -->
    <div
      v-if="isExpanded"
      class="zen-overlay fixed inset-0 z-50 bg-white/60 backdrop-blur-sm transition-opacity duration-300"
      @click="closeWordCloud"
    ></div>

    <!-- 弹窗内容 -->
    <div
      v-if="isExpanded"
      class="zen-modal fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-8"
      @click.stop
    >
      <div class="zen-content relative w-full max-w-6xl h-[90vh] bg-white rounded-[2.5rem] shadow-2xl shadow-zen-green-100/50 overflow-hidden flex flex-col border border-zen-green-100">
        <!-- 顶部装饰 -->
        <div class="zen-header absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-zen-green-400 via-zen-green-500 to-zen-green-600"></div>
        <div class="zen-corner absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-zen-green-300 rounded-tl-2xl"></div>
        <div class="zen-corner absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-zen-green-300 rounded-tr-2xl"></div>
        <div class="zen-corner absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-zen-green-300 rounded-bl-2xl"></div>
        <div class="zen-corner absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-zen-green-300 rounded-br-2xl"></div>

        <!-- 关闭按钮 -->
        <button
          @click="closeWordCloud"
          class="zen-close absolute top-6 right-6 w-10 h-10 flex items-center justify-center bg-zen-green-50 hover:bg-zen-green-100 text-zen-green-600 hover:text-zen-green-700 rounded-full transition-all duration-300 z-20"
        >
          <i class="fas fa-times text-xl"></i>
        </button>

        <!-- 标题 -->
        <div class="zen-title text-center py-6 px-4">
          <h2 class="text-4xl md:text-5xl font-bold text-gray-900 mb-2">
            <i class="fas fa-cloud mr-3 text-zen-green-500 animate-pulse"></i>
            个人性格词云
          </h2>
          <p class="text-zen-green-600/70 text-sm">通过关键词展现我的性格特点和工作态度</p>
        </div>

        <!-- 词云画布区域 -->
        <div 
          class="zen-canvas flex-1 relative bg-gradient-to-b from-zen-green-50/50 to-white mx-4 mb-4 rounded-2xl overflow-hidden"
          @mousemove="handleCanvasMouseMove"
          @mouseleave="resetMousePos"
        >
          <!-- 水墨背景效果 -->
          <div 
            class="absolute inset-0 pointer-events-none opacity-5 transition-opacity duration-300"
            :style="{
              backgroundImage: mousePos.x > 0 && canvasRef.value ? 
                `radial-gradient(circle at ${((mousePos.x / canvasRef.value.clientWidth) * 100).toFixed(1)}% ${((mousePos.y / canvasRef.value.clientHeight) * 100).toFixed(1)}%, #10b981 0%, transparent 20%), radial-gradient(circle at ${(((canvasRef.value.clientWidth - mousePos.x) / canvasRef.value.clientWidth) * 100).toFixed(1)}% ${(((canvasRef.value.clientHeight - mousePos.y) / canvasRef.value.clientHeight) * 100).toFixed(1)}%, #3b82f6 0%, transparent 20%)` :
                'radial-gradient(circle at 20% 30%, #10b981 0%, transparent 20%), radial-gradient(circle at 80% 70%, #3b82f6 0%, transparent 20%)'
            }"
          ></div>
          
          <canvas ref="canvasRef" class="w-full h-full cursor-pointer"></canvas>

          <!-- 鼠标跟随提示 -->
          <div
            v-if="mousePos.x > 0"
            class="zen-tooltip absolute pointer-events-none z-20 bg-white/90 backdrop-blur-md border border-zen-green-200 rounded-xl px-4 py-3 shadow-lg shadow-zen-green-100/30 transition-all duration-200 ease-out"
            :style="{
              left: mousePos.x + 15 + 'px',
              top: mousePos.y + 15 + 'px',
              transform: 'translate(0, -50%)'
            }"
          >
            <div class="flex items-center gap-2 mb-1">
              <div class="w-2 h-2 rounded-full" :style="{ backgroundColor: mousePos.color }"></div>
              <span class="text-zen-green-600 text-xs font-medium">{{ mousePos.category }}</span>
            </div>
            <p class="text-gray-900 text-lg font-bold">{{ mousePos.word }}</p>
            <p class="text-zen-green-500/60 text-xs mt-1">点击关键词了解更多</p>
          </div>
        </div>

        <!-- 底部说明 -->
        <div class="zen-footer px-6 py-4 bg-zen-green-50/50 border-t border-zen-green-100">
          <div class="flex flex-wrap gap-4 justify-center">
            <div
              v-for="item in legendItems"
              :key="item.key"
              class="zen-legend flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-zen-green-200 shadow-sm hover:border-zen-green-300 hover:shadow-md transition-all duration-300 cursor-pointer"
              :class="{ 'ring-2 ring-zen-green-500 bg-zen-green-50': activeCategory === item.key }"
              :title="item.description"
              @click="filterByCategory(item.key)"
            >
              <div class="w-2.5 h-2.5 rounded-full" :style="{ backgroundColor: item.color }"></div>
              <span class="text-xs text-zen-green-700 font-medium">{{ item.label }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import WordCloud from 'wordcloud';

const containerRef = ref(null);
const canvasRef = ref(null);
const isExpanded = ref(false);
const mousePos = ref({ x: 0, y: 0, word: '', category: '', color: '' });
const activeCategory = ref('all');

const legendItems = [
  { key: 'all', label: '全部', color: '#10b981', description: '显示所有关键词' },
  { key: 'professional', label: '专业能力', color: '#10b981', description: '技术能力和专业素养' },
  { key: 'teamwork', label: '团队协作', color: '#3b82f6', description: '团队合作和沟通能力' },
  { key: 'personal', label: '个人特质', color: '#8b5cf6', description: '个人性格和工作态度' },
  { key: 'product', label: '产品思维', color: '#ec4899', description: '产品设计和用户思维' },
  { key: 'interest', label: '兴趣特长', color: '#f59e0b', description: '兴趣爱好和特殊技能' }
];

const personalityWords = [
  // 专业能力相关
  { text: '认真负责', weight: 9, category: 'professional' },
  { text: '细心耐心', weight: 8, category: 'professional' },
  { text: '逻辑清晰', weight: 8, category: 'professional' },
  { text: '学习能力强', weight: 9, category: 'professional' },
  { text: '解决问题', weight: 7, category: 'professional' },
  { text: '快速适应', weight: 7, category: 'professional' },
  { text: '技术视角', weight: 9, category: 'professional' },
  { text: '产品落地逻辑', weight: 8, category: 'professional' },
  { text: '技术与业务需求', weight: 8, category: 'professional' },
  { text: '钻研发新方法', weight: 7, category: 'professional' },
  { text: 'AI工具技术', weight: 8, category: 'professional' },
  { text: 'vibe coding', weight: 7, category: 'professional' },
  { text: '前端交互demo', weight: 7, category: 'professional' },
  { text: '演示讲解', weight: 6, category: 'professional' },
  { text: '验证产品方案', weight: 7, category: 'professional' },
  { text: '团队快速理解', weight: 6, category: 'professional' },
  { text: '推进评审落地', weight: 7, category: 'professional' },
  { text: '产品全流程', weight: 8, category: 'professional' },
  { text: '需求拆解', weight: 8, category: 'professional' },
  { text: '原型设计', weight: 7, category: 'professional' },
  { text: 'PRD', weight: 7, category: 'professional' },
  { text: '接口文档', weight: 6, category: 'professional' },
  
  // 团队协作相关
  { text: '善于沟通', weight: 8, category: 'teamwork' },
  { text: '团队协作', weight: 7, category: 'teamwork' },
  { text: '主动积极', weight: 7, category: 'teamwork' },
  { text: '乐于助人', weight: 6, category: 'teamwork' },
  { text: '跨部门协作', weight: 6, category: 'teamwork' },
  { text: '跨部门沟通', weight: 8, category: 'teamwork' },
  { text: '整合各方诉求', weight: 7, category: 'teamwork' },
  { text: '用户视角', weight: 7, category: 'teamwork' },
  { text: '协作方视角', weight: 6, category: 'teamwork' },
  { text: '高效沟通', weight: 8, category: 'teamwork' },
  { text: '需求顺畅落地', weight: 7, category: 'teamwork' },
  
  // 个人特质相关
  { text: '创新思维', weight: 6, category: 'personal' },
  { text: '抗压能力', weight: 6, category: 'personal' },
  { text: '持续学习', weight: 8, category: 'personal' },
  { text: '注重细节', weight: 7, category: 'personal' },
  { text: '追求完美', weight: 6, category: 'personal' },
  { text: '自我驱动', weight: 7, category: 'personal' },
  { text: '结果导向', weight: 9, category: 'personal' },
  { text: '任务规划', weight: 8, category: 'personal' },
  { text: '时间管理', weight: 7, category: 'personal' },
  { text: '拆解目标', weight: 7, category: 'personal' },
  { text: '制定落地计划', weight: 7, category: 'personal' },
  { text: '按节点交付', weight: 8, category: 'personal' },
  { text: '乐观执着', weight: 7, category: 'personal' },
  { text: '执行力', weight: 8, category: 'personal' },
  { text: '平衡工作生活', weight: 6, category: 'personal' },
  { text: '调节压力', weight: 6, category: 'personal' },
  { text: '独立钻研发分析', weight: 7, category: 'personal' },
  { text: '拆解问题', weight: 7, category: 'personal' },
  { text: '缜密思考', weight: 7, category: 'personal' },
  { text: '权衡利弊', weight: 6, category: 'personal' },
  { text: '寻求最优解', weight: 7, category: 'personal' },
  { text: '市场洞察', weight: 7, category: 'personal' },
  { text: '行业洞察', weight: 7, category: 'personal' },
  { text: '快速接收新知识', weight: 8, category: 'personal' },
  { text: '适配不同业务场景', weight: 7, category: 'personal' },
  { text: '共情能力', weight: 8, category: 'personal' },
  
  // 产品思维相关
  { text: '用户导向', weight: 8, category: 'product' },
  { text: '数据驱动', weight: 7, category: 'product' },
  { text: '敏捷迭代', weight: 7, category: 'product' },
  { text: '需求分析', weight: 8, category: 'product' },
  { text: '原型设计', weight: 7, category: 'product' },
  { text: '体验优化', weight: 6, category: 'product' },
  { text: '创新结合点', weight: 7, category: 'product' },
  
  // 兴趣特长相关
  { text: '摄影', weight: 6, category: 'interest' },
  { text: '写作', weight: 6, category: 'interest' },
  { text: '视频创作', weight: 5, category: 'interest' },
  { text: '审美能力', weight: 5, category: 'interest' }
];

const expandWordCloud = () => {
  isExpanded.value = true;
  nextTick(() => {
    initWordCloud();
  });
};

const closeWordCloud = () => {
  isExpanded.value = false;
  mousePos.value = { x: 0, y: 0, word: '', category: '', color: '' };
  activeCategory.value = 'all';
};

const filterByCategory = (category) => {
  activeCategory.value = category;
  nextTick(() => {
    initWordCloud();
  });
};

const initWordCloud = () => {
  if (!canvasRef.value) return;

  const ctx = canvasRef.value.getContext('2d');
  ctx.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height);

  const container = canvasRef.value.parentElement;
  if (container) {
    canvasRef.value.width = container.clientWidth;
    canvasRef.value.height = container.clientHeight;
  }

  const options = {
    list: personalityWords
      .filter(item => activeCategory.value === 'all' || item.category === activeCategory.value)
      .map(item => [item.text, item.weight, { 
        tooltip: item.category,
        callback: {
          click: (word, options) => {
            console.log('点击关键词:', word);
          }
        }
      }]),
    backgroundColor: 'transparent',
    weightFactor: 10,
    gridSize: 8,
    rotationRatio: 0.5,
    shuffle: true,
    drawMask: false,
    fontFamily: '"Microsoft YaHei", "PingFang SC", sans-serif',
    color: (word, weight) => {
      const item = personalityWords.find(w => w.text === word);
      if (!item) return '#10b981';
      
      const colors = {
        professional: ['#10b981', '#34d399', '#6ee7b7'],
        teamwork: ['#3b82f6', '#60a5fa', '#93c5fd'],
        personal: ['#8b5cf6', '#a78bfa', '#c4b5fd'],
        product: ['#ec4899', '#f472b6', '#fbcfe8'],
        interest: ['#f59e0b', '#fbbf24', '#fcd34d']
      };
      
      const categoryColors = colors[item.category] || ['#10b981'];
      return categoryColors[Math.floor(Math.random() * categoryColors.length)];
    },
    tooltip: {
      delay: 100,
      format: (word, options) => {
        const item = personalityWords.find(w => w.text === word);
        if (!item) return word;
        
        const categoryNames = {
          professional: '专业能力',
          teamwork: '团队协作',
          personal: '个人特质',
          product: '产品思维',
          interest: '兴趣特长'
        };
        
        return `${word} (${categoryNames[item.category] || '关键词'})`;
      }
    }
  };

  try {
    WordCloud(canvasRef.value, options);
  } catch (error) {
    console.error('词云初始化失败:', error);
  }
};

const handleMouseMove = (e) => {
  if (!isExpanded.value) return;

  const rect = canvasRef.value.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  const wordCloudItems = document.querySelectorAll('.wordcloud-item');
  let hoveredWord = null;

  wordCloudItems.forEach(item => {
    const word = item.textContent.trim();
    const bbox = item.getBoundingClientRect();
    if (e.clientX >= bbox.left && e.clientX <= bbox.right &&
        e.clientY >= bbox.top && e.clientY <= bbox.bottom) {
      hoveredWord = word;
    }
  });

  if (hoveredWord) {
    const wordItem = personalityWords.find(w => w.text === hoveredWord);
    if (wordItem) {
      const colors = {
        professional: '#10b981',
        teamwork: '#3b82f6',
        personal: '#8b5cf6',
        product: '#ec4899',
        interest: '#f59e0b'
      };
      mousePos.value = {
        x,
        y,
        word: hoveredWord,
        category: wordItem.category,
        color: colors[wordItem.category] || '#10b981'
      };
    }
  } else {
    mousePos.value = { x: 0, y: 0, word: '', category: '', color: '' };
  }
};

const handleCanvasMouseMove = (e) => {
  handleMouseMove(e);
};

const resetMousePos = () => {
  mousePos.value = { x: 0, y: 0, word: '', category: '', color: '' };
};

const handleResize = () => {
  if (isExpanded.value) {
    nextTick(() => {
      initWordCloud();
    });
  }
};

onMounted(() => {
  window.addEventListener('resize', handleResize);
  window.addEventListener('mousemove', handleMouseMove);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  window.removeEventListener('mousemove', handleMouseMove);
});

defineExpose({
  expandWordCloud
});
</script>

<style scoped>
.word-cloud-container {
  width: 100%;
}

/* 清新风格弹窗 */
.zen-overlay {
  background: radial-gradient(circle at center, rgba(16, 185, 129, 0.05) 0%, rgba(255, 255, 255, 0.8) 100%);
}

.zen-modal {
  animation: zenPopIn 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes zenPopIn {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(30px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.zen-content {
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  animation: zenSlideUp 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes zenSlideUp {
  from {
    opacity: 0;
    transform: translateY(50px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 清新装饰角 */
.zen-corner {
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.1);
  transition: all 0.3s ease;
}

.zen-corner:hover {
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
  transform: scale(1.1);
}

/* 清新标题 */
.zen-title h2 {
  font-family: 'KaiTi', 'STKaiti', 'Microsoft YaHei', serif;
  font-weight: 600;
  letter-spacing: 0.05em;
}

.zen-title i {
  animation: zenFloat 3s ease-in-out infinite;
}

@keyframes zenFloat {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
}

/* 清新关闭按钮 */
.zen-close {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.zen-close:hover {
  background: rgba(16, 185, 129, 0.1);
  transform: rotate(90deg) scale(1.1);
}

/* 清新图例 */
.zen-legend {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.zen-legend:hover {
  transform: translateY(-2px) scale(1.05);
}

/* 清新提示框 */
.zen-tooltip {
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.1);
  transition: all 0.2s ease;
}

/* 词云项悬停效果 */
:deep(.wordcloud-item) {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
}

:deep(.wordcloud-item:hover) {
  transform: scale(1.15) !important;
  opacity: 1 !important;
}
</style>
