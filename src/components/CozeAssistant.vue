<template>
  <transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition duration-150 ease-in"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-gradient-to-b from-blue-900/25 via-blue-900/15 to-blue-900/25"></div>

      <div
        class="relative w-[98vw] sm:w-[600px] h-[85vh] sm:h-[720px] max-h-[95vh] max-w-[99vw] bg-white rounded-[28px] shadow-2xl border border-blue-100 overflow-hidden flex flex-col"
        @click.stop
      >
        <!-- 头部 -->
        <div class="bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-5 flex items-center gap-4 shadow-md z-10">
          <div class="w-11 h-11 rounded-full bg-white/20 border border-white/30 flex items-center justify-center text-white overflow-hidden backdrop-blur-sm shadow-inner">
            <i class="fas fa-robot text-xl"></i>
          </div>
          <div class="flex-1 min-w-0 text-white">
            <div class="font-bold text-lg leading-tight truncate">智能助手</div>
            <div class="text-blue-100 text-xs leading-tight truncate mt-0.5 opacity-90">
              基于 Coze 工作流的 AI 对话助手
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="w-8 h-8 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center"
              @click="resetToGuide"
              aria-label="重置对话"
              title="重置"
            >
              <i class="fas fa-rotate-left text-sm"></i>
            </button>
            <button
              type="button"
              class="w-8 h-8 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center"
              @click="close"
              aria-label="关闭"
            >
              <i class="fas fa-times text-lg"></i>
            </button>
          </div>
        </div>

        <!-- 消息区域 -->
        <div ref="scrollEl" class="flex-1 overflow-y-auto px-5 py-6 bg-slate-50/80 scroll-smooth">
          <div class="space-y-6">
            <div v-for="m in messages" :key="m.id" class="flex w-full" :class="m.role === 'user' ? 'justify-end' : 'justify-start'">
              <div class="max-w-[88%] flex gap-3" :class="{'flex-row-reverse': m.role === 'user'}">
                <div
                  class="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden shadow-sm mt-1"
                  :class="m.role === 'user' ? 'bg-blue-100' : 'bg-white border border-gray-100'"
                >
                   <i v-if="m.role === 'assistant'" class="fas fa-robot text-blue-500 text-sm"></i>
                   <i v-else class="fas fa-user text-blue-600 text-xs"></i>
                </div>

                <div>
                  <div
                    class="rounded-2xl px-5 py-3.5 text-[15px] leading-relaxed shadow-sm relative group transition-all"
                    :class="m.role === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-sm hover:shadow-md'
                      : 'bg-white text-gray-800 border border-gray-100 rounded-tl-sm hover:shadow-md'"
                  >
                    <div class="whitespace-pre-line">{{ m.text }}</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 加载动画 -->
            <div v-if="isLoading" class="flex w-full justify-start">
              <div class="max-w-[88%] flex gap-3">
                <div class="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden shadow-sm mt-1 bg-white border border-gray-100">
                  <i class="fas fa-robot text-blue-500 text-sm"></i>
                </div>
                <div>
                  <div class="rounded-2xl px-5 py-3.5 text-[15px] leading-relaxed shadow-sm relative group transition-all bg-white text-gray-800 border border-gray-100 rounded-tl-sm">
                    <div class="flex space-x-2">
                      <div class="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style="animation-delay: 0ms"></div>
                      <div class="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style="animation-delay: 150ms"></div>
                      <div class="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style="animation-delay: 300ms"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 快捷问题区域 -->
          <div v-if="showShortcutsArea" class="mt-8 animate-fade-in-up">
            <div class="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100/80">
              <div class="flex items-center gap-2 mb-4 text-blue-800 font-medium text-sm">
                <i class="fas fa-lightbulb text-yellow-400"></i>
                <span>快捷问题：</span>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  v-for="p in quickPrompts"
                  :key="p.key"
                  type="button"
                  class="text-left px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-blue-50 hover:border-blue-200 hover:shadow-sm transition-all group"
                  @click="handleQuickClick(p)"
                >
                  <div class="text-sm text-gray-800 font-medium group-hover:text-blue-800 mb-0.5">{{ p.label }}</div>
                  <div class="text-xs text-gray-400 group-hover:text-blue-600/70 truncate">点击立即提问</div>
                </button>
              </div>

              <div class="mt-6 flex items-center gap-2 mb-3 text-blue-800 font-medium text-sm">
                <i class="fas fa-compass text-blue-500"></i>
                <span>你可以从这些模块开始：</span>
              </div>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="s in guideSections"
                  :key="s.key"
                  type="button"
                  class="px-4 py-2 rounded-full bg-white border border-gray-200 text-sm text-gray-600 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all shadow-sm hover:shadow-md"
                  @click="handleGuideClick(s)"
                >
                  {{ s.title }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 输入区域 -->
        <div class="px-5 py-4 bg-white border-t border-gray-100 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.05)]">
          <form class="relative flex items-end gap-2" @submit.prevent="onSend">
            <div class="flex-1 relative">
              <textarea
                v-model="input"
                rows="1"
                class="w-full resize-none rounded-[24px] border border-gray-200 bg-slate-50 px-5 py-3.5 pr-12 text-sm text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                placeholder="问我：项目亮点 / 技能栈 / 经历 / 如何联系…"
                @keydown.enter.exact.prevent="onSend"
              />
              <div class="absolute right-3 bottom-2.5 text-[10px] text-gray-300 pointer-events-none">
                Enter
              </div>
            </div>
            <button
              type="submit"
              class="w-11 h-11 rounded-full bg-blue-600 hover:bg-blue-700 active:scale-95 text-white shadow-lg shadow-blue-200 flex items-center justify-center transition-all disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none disabled:cursor-not-allowed"
              :disabled="!canSend"
              aria-label="发送"
            >
              <i class="fas fa-paper-plane text-sm translate-x-[-1px] translate-y-[1px]"></i>
            </button>
          </form>
          <div class="text-center mt-2.5">
             <p class="text-[10px] text-gray-400 scale-90 origin-center">回答基于 Coze 工作流；如需进一步沟通请联系我</p>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue';

const emit = defineEmits(['open-project']);

const isOpen = ref(false);
const input = ref('');
const scrollEl = ref(null);
const isLoading = ref(false);
const showShortcuts = ref(false);

const messages = ref([]);

const showGuide = computed(() => messages.value.length === 0 || (messages.value.length === 1 && messages.value[0]?.meta === 'greeting'));
const showShortcutsArea = computed(() => showGuide.value || showShortcuts.value);

const guideSections = [
  { key: 'about', title: '关于我', href: '#about' },
  { key: 'projects', title: '项目经历', href: '#projects' },
  { key: 'certificates', title: '证书', href: '#certificates' },
  { key: 'skills', title: '技能', href: '#skills-list' },
  { key: 'interests', title: '兴趣特长', href: '#interests' },
  { key: 'visitor', title: '访客互动', href: '#visitor' }
];

const quickPrompts = [
  { key: 'top_projects', label: '介绍你最强的3个项目', query: '最强的3个项目' },
  { key: 'fit_role', label: '你适合什么岗位/方向', query: '你适合什么岗位' },
  { key: 'stack', label: '给我你的技术栈', query: '技术栈' },
  { key: 'contact', label: '如何联系你', query: '如何联系' },
  { key: 'leave_message', label: '我想合作/交流，怎么留言', query: '我要留言' }
];

const newId = () => `${Date.now()}_${Math.random().toString(16).slice(2)}`;

const appendMessage = async (m) => {
  messages.value.push({ id: newId(), ...m });
  await nextTick();
  const el = scrollEl.value;
  if (el) el.scrollTop = el.scrollHeight;
};

const open = async () => {
  isOpen.value = true;
  await nextTick();
  if (messages.value.length === 0) await resetToGuide();
};

const close = () => {
  isOpen.value = false;
};

defineExpose({ open });

const resetToGuide = async () => {
  showShortcuts.value = false;
  input.value = '';
  messages.value = [];
  await nextTick();
  
  isLoading.value = true;
  try {
    const reply = await callCozeApi('你好');
    await appendMessage({
      role: 'assistant',
      meta: 'greeting',
      text: reply
    });
  } catch (error) {
    console.error('获取问候语失败：', error);
    await appendMessage({
      role: 'assistant',
      meta: 'greeting',
      text: '你好，我是基于 Coze 工作流的智能助手。\n你可以问我关于简历的任何问题，或者从下方快捷问题开始。'
    });
  } finally {
    isLoading.value = false;
  }
};

const canSend = computed(() => input.value.trim().length > 0 && !isLoading.value);

const onSend = async () => {
  const q = input.value.trim();
  if (!q || isLoading.value) return;
  input.value = '';
  await appendMessage({ role: 'user', text: q });

  isLoading.value = true;
  try {
    const reply = await callCozeApi(q);
    await appendMessage({ role: 'assistant', text: reply });
  } catch (error) {
    console.error('API 调用失败：', error);
    await appendMessage({ 
      role: 'assistant', 
      text: `抱歉，调用 Coze 工作流失败：${error.message || '未知错误'}` 
    });
  } finally {
    isLoading.value = false;
  }
};

const callCozeApi = async (question) => {
  const response = await fetch('/api/chat?' + Date.now(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8'
    },
    body: JSON.stringify({ question })
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData?.error || `HTTP ${response.status}`);
  }
  
  const data = await response.json();
  
  if (!data.reply || data.reply.trim() === '') {
    throw new Error('Coze 工作流未返回任何回答');
  }
  
  return data.reply;
};

const handleQuickClick = async (p) => {
  input.value = p.query;
  await onSend();
};

const handleGuideClick = async (s) => {
  const q = s.title;
  await appendMessage({ role: 'user', text: q });
  isLoading.value = true;
  try {
    const reply = await callCozeApi(q);
    await appendMessage({ role: 'assistant', text: reply });
  } catch (error) {
    console.error('API 调用失败：', error);
    await appendMessage({ 
      role: 'assistant', 
      text: `抱歉，调用 Coze 工作流失败：${error.message || '未知错误'}` 
    });
  } finally {
    isLoading.value = false;
  }
};
</script>
