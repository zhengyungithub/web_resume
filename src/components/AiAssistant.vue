<template>
<!--  <div class="fixed bottom-6 right-6 z-40">-->
<!--    <button-->
<!--      type="button"-->
<!--      class="w-14 h-14 rounded-full shadow-xl overflow-hidden transition-all active:scale-95 hover:scale-105"-->
<!--      @click="toggleOpen"-->
<!--      aria-label="打开阿筠"-->
<!--    >-->
<!--      <img src="/阿筠.png" alt="阿筠" class="w-full h-full object-cover">-->
<!--    </button>-->
<!--  </div>-->

  <transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition duration-150 ease-in"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-gradient-to-b from-zen-green-900/25 via-zen-green-900/15 to-zen-green-900/25"></div>

      <div
        class="relative w-[98vw] sm:w-[600px] h-[85vh] sm:h-[720px] max-h-[95vh] max-w-[99vw] bg-white rounded-[28px] shadow-2xl border border-zen-green-100 overflow-hidden flex flex-col"
        @click.stop
      >
        <div class="bg-gradient-to-r from-zen-green-800 to-zen-green-600 px-6 py-5 flex items-center gap-4 shadow-md z-10">
          <div class="w-11 h-11 rounded-full bg-white/20 border border-white/30 flex items-center justify-center text-white overflow-hidden backdrop-blur-sm shadow-inner">
            <img src="/阿筠.png" alt="阿筠" class="w-full h-full object-cover">
          </div>
          <div class="flex-1 min-w-0 text-white">
            <div class="font-bold text-lg leading-tight truncate">阿筠</div>
            <div class="text-zen-green-100 text-xs leading-tight truncate mt-0.5 opacity-90">
              {{ t('subTitle') }}
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="w-8 h-8 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center"
              @click="toggleShortcuts"
              aria-label="快捷入口"
            >
              <i class="fas fa-th-large text-sm"></i>
            </button>
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
              class="px-2 py-1 rounded-full text-xs font-medium border border-white/30 text-white/90 hover:bg-white/10 transition-all"
              @click="toggleLang"
              aria-label="切换语言"
            >
              {{ lang === 'zh' ? 'CN' : 'EN' }}
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

        <div ref="scrollEl" class="flex-1 overflow-y-auto px-5 py-6 bg-slate-50/80 scroll-smooth">
          <div class="space-y-6">
            <div v-for="m in messages" :key="m.id" class="flex w-full" :class="m.role === 'user' ? 'justify-end' : 'justify-start'">
              <div class="max-w-[88%] flex gap-3" :class="{'flex-row-reverse': m.role === 'user'}">
                <div
                  class="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden shadow-sm mt-1"
                  :class="m.role === 'user' ? 'bg-zen-green-100' : 'bg-white border border-gray-100'"
                >
                   <img v-if="m.role === 'assistant'" src="/阿筠.png" class="w-full h-full object-cover">
                   <i v-else class="fas fa-user text-zen-green-600 text-xs"></i>
                </div>

                <div class="max-w-[calc(100%-48px)]">
                  <div
                    class="rounded-2xl px-5 py-3.5 text-[15px] leading-relaxed shadow-sm relative group transition-all overflow-hidden"
                    :class="m.role === 'user'
                      ? 'bg-zen-green-600 text-white rounded-tr-sm hover:shadow-md'
                      : 'bg-white text-gray-800 border border-gray-100 rounded-tl-sm hover:shadow-md'"
                  >
                    <div :class="m.role === 'user' ? 'whitespace-nowrap' : 'whitespace-pre-line break-words'">{{ m.text }}</div>
                  </div>

                  <div v-if="m.actions?.length" class="mt-3 flex flex-wrap gap-2 pl-1">
                    <button
                      v-for="a in m.actions"
                      :key="a.key"
                      type="button"
                      class="px-4 py-1.5 rounded-full text-xs font-medium bg-white border border-zen-green-200 text-zen-green-700 hover:bg-zen-green-50 hover:border-zen-green-300 transition-all shadow-sm"
                      @click="runAction(a)"
                    >
                      {{ a.label }}
                    </button>
                  </div>

                  <div v-if="m.citations?.length" class="mt-3 flex flex-wrap gap-2 pl-1">
                    <a
                      v-for="c in m.citations"
                      :key="c.href + c.title"
                      :href="c.href"
                      class="px-3 py-1.5 rounded-lg text-xs font-medium bg-zen-green-50/50 border border-zen-green-100 text-gray-600 hover:text-zen-green-700 hover:border-zen-green-300 transition-all flex items-center gap-1.5"
                      @click="onCitationClick"
                    >
                      <i class="fas fa-link text-[10px] opacity-60"></i>
                      {{ c.title }}
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <!-- 加载动画 -->
            <div v-if="isLoading" class="flex w-full justify-start">
              <div class="max-w-[88%] flex gap-3">
                <div class="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden shadow-sm mt-1 bg-white border border-gray-100">
                  <img src="/阿筠.png" class="w-full h-full object-cover">
                </div>
                <div>
                  <div class="rounded-2xl px-5 py-3.5 text-[15px] leading-relaxed shadow-sm relative group transition-all bg-white text-gray-800 border border-gray-100 rounded-tl-sm">
                    <div class="flex space-x-2">
                      <div class="w-2 h-2 rounded-full bg-zen-green-400 animate-bounce" style="animation-delay: 0ms"></div>
                      <div class="w-2 h-2 rounded-full bg-zen-green-400 animate-bounce" style="animation-delay: 150ms"></div>
                      <div class="w-2 h-2 rounded-full bg-zen-green-400 animate-bounce" style="animation-delay: 300ms"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="showShortcutsArea" class="mt-8 animate-fade-in-up">
            <div class="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100/80">
              <div class="flex items-center gap-2 mb-4 text-zen-green-800 font-medium text-sm">
                <i class="fas fa-lightbulb text-yellow-400"></i>
                <span>{{ t('quickLabel') }}</span>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  v-for="p in quickPrompts"
                  :key="p.key"
                  type="button"
                  class="text-left px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-zen-green-50 hover:border-zen-green-200 hover:shadow-sm transition-all group"
                  @click="handleQuickClick(p)"
                >
                  <div class="text-sm text-gray-800 font-medium group-hover:text-zen-green-800 mb-0.5">{{ lang === 'zh' ? p.labelZh : p.labelEn }}</div>
                  <div class="text-xs text-gray-400 group-hover:text-zen-green-600/70 truncate">点击立即提问</div>
                </button>
              </div>

              <div class="mt-6 flex items-center gap-2 mb-3 text-zen-green-800 font-medium text-sm">
                <i class="fas fa-compass text-zen-green-500"></i>
                <span>{{ t('guideLabel') }}</span>
              </div>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="s in guideSections"
                  :key="s.key"
                  type="button"
                  class="px-4 py-2 rounded-full bg-white border border-gray-200 text-sm text-gray-600 hover:bg-zen-green-600 hover:text-white hover:border-zen-green-600 transition-all shadow-sm hover:shadow-md"
                  @click="handleGuideClick(s)"
                >
                  {{ lang === 'zh' ? s.titleZh : s.titleEn }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="px-5 py-4 bg-white border-t border-gray-100 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.05)]">
          <form class="relative flex items-end gap-2" @submit.prevent="onSend">
            <div class="flex-1 relative">
              <textarea
                v-model="input"
                rows="1"
                class="w-full resize-none rounded-[24px] border border-gray-200 bg-slate-50 px-5 py-3.5 pr-12 text-sm text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-zen-green-500/20 focus:border-zen-green-500 transition-all"
                :placeholder="t('placeholder')"
                @keydown.enter.exact.prevent="onSend"
              />
              <div class="absolute right-3 bottom-2.5 text-[10px] text-gray-300 pointer-events-none">
                Enter
              </div>
            </div>
            <button
              type="submit"
              class="w-11 h-11 rounded-full bg-zen-green-600 hover:bg-zen-green-700 active:scale-95 text-white shadow-lg shadow-zen-green-200 flex items-center justify-center transition-all disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none disabled:cursor-not-allowed"
              :disabled="!canSend"
              aria-label="发送"
            >
              <i class="fas fa-paper-plane text-sm translate-x-[-1px] translate-y-[1px]"></i>
            </button>
          </form>
          <div class="text-center mt-2.5">
             <p class="text-[10px] text-gray-400 scale-90 origin-center">{{ t('disclaimer') }}</p>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';

const emit = defineEmits(['open-project']);

const props = defineProps({
  resumeData: { type: Object, required: true },
  visitorFormEndpoint: { type: String, default: '' },
  isVisitorFormConfigured: { type: Boolean, default: false }
});

const isOpen = ref(false);
const lang = ref('zh');
const input = ref('');
const scrollEl = ref(null);
const isLoading = ref(false);

const lead = ref(null);
const showShortcuts = ref(false);

const guideSections = computed(() => [
  { key: 'intro', titleZh: '介绍一下', titleEn: 'Introduce', href: '#about' },
  { key: 'projects', titleZh: '项目经历', titleEn: 'Projects', href: '#projects' },
  { key: 'certificates', titleZh: '证书', titleEn: 'Certificates', href: '#certificates' },
  { key: 'skills', titleZh: '技能', titleEn: 'Skills', href: '#skills-list' },
  { key: 'interests', titleZh: '兴趣特长', titleEn: 'Interests', href: '#interests' },
  { key: 'portfolio', titleZh: '作品集', titleEn: 'Portfolio', href: '#visitor' }
]);

const messages = ref([]);

const showGuide = computed(() => (messages?.value?.length || 0) === 0 || ((messages?.value?.length || 0) === 1 && messages?.value?.[0]?.meta === 'greeting'));
const showShortcutsArea = computed(() => showGuide.value || showShortcuts.value);

const quickPrompts = computed(() => [
  { key: 'projects', labelZh: '介绍一下你的项目经历', labelEn: 'Tell me about your projects', queryZh: '介绍一下你的项目经历', queryEn: 'tell me about your projects' },
  { key: 'skills', labelZh: '你有什么技能证书', labelEn: 'What skills and certificates', queryZh: '你有什么技能证书', queryEn: 'what skills and certificates do you have' },
  { key: 'internship', labelZh: '你在量云能源的实习经历', labelEn: 'Your internship experience', queryZh: '你在量云能源的实习经历', queryEn: 'your internship experience' },
  { key: 'contact', labelZh: '怎么联系你', labelEn: 'How to contact you', queryZh: '怎么联系你', queryEn: 'how to contact you' },
  { key: 'interests', labelZh: '你的兴趣爱好是什么', labelEn: 'What are your interests', queryZh: '你的兴趣爱好是什么', queryEn: 'what are your interests' }
]);

const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};

const t = (key) => {
  const zh = {
    subTitle: '基于站内信息的对话助手',
    disclaimer: '回答基于站内信息；如需进一步沟通请联系我',
    placeholder: '问我：项目亮点 / 技能栈 / 经历 / 如何联系…',
    quickLabel: '快捷问题：',
    guideLabel: '你可以从这些模块开始：',
    greet: () => `你好，我是阿筠。我是郑筠的分身（AI助手）\n你可以从这些模块开始了解：关于我 / 项目经历 / 证书 / 技能 / 兴趣特长 / 访客互动`,
    askName: '先怎么称呼你？',
    askCompany: '你来自哪个公司/团队？（可选，直接回“跳过”也可以）',
    askNeedType: '你这次主要是：招聘 / 合作 / 交流？',
    askTime: '期望我什么时候联系你？（可选，例如“工作日晚上/本周三”）',
    askEmail: '留个邮箱方便我回复你（必填）：',
    askDetail: '把你的需求简单说一下（必填）：',
    confirmLead: '我整理了下信息，确认无误我就提交：',
    submit: '提交',
    cancel: '取消',
    skip: '跳过',
    copyEmail: '复制邮箱',
    openContact: '去“访客互动”留言',
    startLead: '在这里留言',
    jumpContact: '去联系方式',
    submitted: '已发送，我会尽快通过邮件回复你。',
    submitFail: '发送失败，请稍后重试，或直接用邮箱联系我。',
    notConfigured: '当前未配置表单服务，可以直接邮件联系我：',
    unknown: '这个问题在站内信息里暂时没有明确答案。我可以带你跳转到相关模块，或者你直接留言我补充说明。'
  };
  const en = {
    subTitle: 'Chat assistant grounded in this site',
    disclaimer: 'Answers are based on on-site info; contact me for details',
    placeholder: 'Ask: projects / stack / experience / contact…',
    quickLabel: 'Quick prompts:',
    guideLabel: 'Start from these sections:',
    greet: () => `Hi, I’m Ayun.\nI answer based on this resume site.\nStart from: About / Projects / Certificates / Skills / Interests / Visitor`,
    askName: 'How should I address you?',
    askCompany: 'Which company/team are you from? (optional, reply "skip")',
    askNeedType: 'Is this about hiring, collaboration, or networking?',
    askTime: 'When would you like me to reach out? (optional)',
    askEmail: 'Your email so I can reply (required):',
    askDetail: 'Briefly describe your request (required):',
    confirmLead: 'Here’s what I captured. Confirm to submit:',
    submit: 'Submit',
    cancel: 'Cancel',
    skip: 'Skip',
    copyEmail: 'Copy email',
    openContact: 'Leave a message',
    startLead: 'Leave a message here',
    jumpContact: 'Contact info',
    submitted: 'Sent. I’ll reply via email soon.',
    submitFail: 'Failed to send. Please try later, or email me directly.',
    notConfigured: 'Form is not configured. You can email me at:',
    unknown: 'I can’t find a definitive answer on this site. I can jump you to relevant sections or you can leave me a message.'
  };
  const dict = lang.value === 'zh' ? zh : en;
  return dict[key];
};

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
  if ((messages?.value?.length || 0) === 0) await resetToGuide();
};

const close = () => {
  isOpen.value = false;
};

const toggleOpen = () => {
  if (isOpen.value) close();
  else open();
};

const toggleLang = () => {
  lang.value = lang.value === 'zh' ? 'en' : 'zh';
  if ((messages?.value?.length || 0) === 1 && messages?.value?.[0]?.meta === 'greeting') {
    messages.value[0] = {
      ...messages.value[0],
      text: t('greet')()
    };
  }
};

defineExpose({ open });

const toggleShortcuts = () => {
  showShortcuts.value = !showShortcuts.value;
};

const resetToGuide = async () => {
  lead.value = null;
  showShortcuts.value = false;
  input.value = '';
  messages.value = [];
  await nextTick();
  
  // 直接显示固定欢迎语，不等待 API
  await appendMessage({
    role: 'assistant',
    meta: 'greeting',
    text: '你好~我是阿筠，欢迎来到我的个人网站。你可以问我关于教育、实习、项目、技能或作品集的问题。',
    citations: [],
    actions: []
  });
};

const onCitationClick = () => {
  close();
};

const canSend = computed(() => (input?.value?.trim?.()?.length || 0) > 0);

const normalizeQuery = (q) => (q || '').trim();

const splitTokens = (q) => {
  const text = q.toLowerCase();
  const raw = [];
  const latin = text.match(/[a-z0-9]+/g) || [];
  raw.push(...latin);
  const zh = text.match(/[\u4e00-\u9fa5]{2,}/g) || [];
  for (const seg of zh) {
    raw.push(seg);
    const max = Math.min(seg.length, 6);
    for (let len = 2; len <= Math.min(3, max); len += 1) {
      for (let i = 0; i + len <= seg.length; i += 1) raw.push(seg.slice(i, i + len));
    }
  }
  const uniq = Array.from(new Set(raw.filter((x) => x && x.length >= 2)));
  return uniq.slice(0, 30);
};

const buildDocs = (resume) => {
  const profile = resume?.profile || {};
  const education = Array.isArray(resume?.education) ? resume.education : [];
  const work = Array.isArray(resume?.work) ? resume.work : [];
  const projects = Array.isArray(resume?.projects) ? resume.projects : [];
  const certificates = Array.isArray(resume?.certificates) ? resume.certificates : [];
  const skills = Array.isArray(resume?.skills) ? resume.skills : [];
  const interests = Array.isArray(resume?.interests) ? resume.interests : [];

  const eduText = education
    .map((e) => `${e.school || ''} ${e.degree || ''} ${e.major || ''} ${e.period || ''}\n${e.details || ''}`.trim())
    .filter(Boolean)
    .join('\n\n');
  const workText = work
    .map((w) => `${w.company || ''} ${w.role || ''} ${w.period || ''}\n${w.description || ''}`.trim())
    .filter(Boolean)
    .join('\n\n');
  const projectText = projects
    .map((p) => `${p.title || ''} ${p.role || ''} ${p.period || ''}\n${p.description || ''}`.trim())
    .filter(Boolean)
    .join('\n\n');
  const certText = certificates.map((c) => c?.name).filter(Boolean).join('、');
  const skillText = skills
    .map((s) => (typeof s === 'string' ? s : s?.name))
    .filter(Boolean)
    .join('、');
  const interestText = interests.filter(Boolean).join('\n');

  const contactText = [
    profile.email ? `邮箱：${profile.email}` : '',
    profile.phone ? `电话：${profile.phone}` : '',
    profile.location ? `所在地：${profile.location}` : ''
  ]
    .filter(Boolean)
    .join('\n');

  return [
    { key: 'about', title: '关于我', href: '#about', content: [profile.bio || '', eduText, workText].filter(Boolean).join('\n\n') },
    { key: 'projects', title: '项目经历', href: '#projects', content: projectText },
    { key: 'certificates', title: '证书', href: '#certificates', content: certText },
    { key: 'skills', title: '技能', href: '#skills-list', content: skillText },
    { key: 'interests', title: '兴趣特长', href: '#interests', content: interestText },
    { key: 'visitor', title: '访客互动', href: '#visitor', content: '联系表单' },
    { key: 'contact', title: '联系方式', href: '#contact', content: contactText }
  ];
};

const docs = computed(() => buildDocs(props.resumeData));

const retrieve = (q) => {
  const tokens = splitTokens(q);
  const scored = docs.value
    .map((d) => {
      const hay = `${d.title}\n${d.content}`.toLowerCase();
      let score = 0;
      for (const tk of tokens) {
        if (!tk) continue;
        const idx = hay.indexOf(tk);
        if (idx >= 0) score += Math.min(6, tk.length) * 2;
      }
      return { d, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
  return scored.map((x) => x.d);
};

const makeCitations = (picked) =>
  picked.map((d) => ({
    title: d.title,
    href: d.href
  }));

const pickHighlights = (desc) => {
  if (!desc || typeof desc !== 'string') return '';
  const first = desc.split('\n').map((x) => x.trim()).filter(Boolean)[0] || '';
  return first.length > 120 ? `${first.slice(0, 120)}…` : first;
};

const filterProjectsByDirection = (direction) => {
  const projects = Array.isArray(props.resumeData?.projects) ? props.resumeData.projects : [];
  const textOf = (p) => `${p?.title || ''}\n${p?.description || ''}`.toLowerCase();

  const rules = {
    frontend: ['vue', 'tailwind', 'html', 'css', 'javascript', 'vite'],
    backend: ['java', 'spring', 'redis', 'mysql', 'oracle', 'sql', 'server'],
    ai: ['ai', '大模型', 'ollama', 'prompt', 'aigc', 'llm'],
    perf: ['性能', '缓存', 'redis', '加载', '优化', 'p95'],
    eng: ['工程化', '埋点', '文档', 'prd', '接口', '敏捷']
  };

  const keys = rules[direction] || [];
  const picked = projects.filter((p) => keys.some((k) => textOf(p).includes(String(k).toLowerCase())));
  return picked.length ? picked : projects;
};

const projectDirectionActions = () => [
  { key: 'dir_frontend', label: lang.value === 'zh' ? '前端' : 'Frontend', type: 'project_dir', direction: 'frontend' },
  { key: 'dir_backend', label: lang.value === 'zh' ? '后端' : 'Backend', type: 'project_dir', direction: 'backend' },
  { key: 'dir_ai', label: 'AI', type: 'project_dir', direction: 'ai' },
  { key: 'dir_perf', label: lang.value === 'zh' ? '性能' : 'Performance', type: 'project_dir', direction: 'perf' },
  { key: 'dir_eng', label: lang.value === 'zh' ? '工程化' : 'Engineering', type: 'project_dir', direction: 'eng' }
];

const basicAnswer = (q) => {
  const profile = props.resumeData?.profile || {};
  const text = q.toLowerCase();

  const isContact =
    ['联系', '邮箱', '邮件', '电话', '微信', '沟通', '合作', '投递', '预约'].some((k) => q.includes(k)) ||
    ['contact', 'email', 'mail', 'phone'].some((k) => text.includes(k));

  const isProjects = q.includes('项目') || text.includes('project');
  const isSkills = q.includes('技能') || q.includes('技术栈') || text.includes('stack') || text.includes('skill');
  const isCert = q.includes('证书') || text.includes('certificate') || text.includes('cet');
  const isInterests = q.includes('兴趣') || q.includes('特长') || text.includes('interest');
  const isAbout = ['关于', '经历', '教育', '学校', '专业', '实习', '工作', '你是谁', '自我介绍'].some((k) => q.includes(k)) || text.includes('about');
  const isRoleFit =
    q.includes('适合') || q.includes('岗位') || q.includes('方向') || text.includes('role') || text.includes('position') || text.includes('fit');

  if (isContact) {
    const email = profile.email || '';
    const phone = profile.phone || '';
    const location = profile.location || '';
    const lines = [
      lang.value === 'zh' ? '我可以通过这几种方式联系：' : 'You can reach me via:',
      email ? `${lang.value === 'zh' ? '邮箱' : 'Email'}：${email}` : '',
      phone ? `${lang.value === 'zh' ? '电话' : 'Phone'}：${phone}` : '',
      location ? `${lang.value === 'zh' ? '所在地' : 'Location'}：${location}` : ''
    ].filter(Boolean);

    const actions = [];
    if (email) actions.push({ key: 'copy_email', label: t('copyEmail'), type: 'copy_email' });
    actions.push({ key: 'jump_contact', label: t('jumpContact'), type: 'jump', href: '#contact' });
    actions.push({ key: 'jump_visitor', label: t('openContact'), type: 'jump', href: '#visitor' });
    actions.push({ key: 'start_lead', label: t('startLead'), type: 'start_lead' });

    return {
      text: lines.join('\n'),
      citations: makeCitations([{ title: '联系方式', href: '#contact' }, { title: '访客互动', href: '#visitor' }]),
      actions
    };
  }

  if (isProjects) {
    const direction =
      q.includes('前端') ? 'frontend' :
      q.includes('后端') ? 'backend' :
      (q.includes('AI') || q.includes('大模型') || text.includes('ai')) ? 'ai' :
      (q.includes('性能') || text.includes('performance')) ? 'perf' :
      (q.includes('工程化') || q.includes('埋点') || q.includes('文档') || text.includes('engineering')) ? 'eng' :
      '';

    const projects = direction ? filterProjectsByDirection(direction) : (Array.isArray(props.resumeData?.projects) ? props.resumeData.projects : []);
    const top = projects.slice(0, 3);
    const lines = [
      lang.value === 'zh'
        ? (direction ? `按「${q.includes('前端') ? '前端' : q.includes('后端') ? '后端' : (q.includes('性能') ? '性能' : (q.includes('工程化') ? '工程化' : 'AI'))}」方向推荐的项目：` : '我最主要的项目经历：')
        : (direction ? 'Projects by direction:' : 'Highlighted projects:'),
      ...top.map((p, idx) => {
        const title = p?.title || '';
        const meta = [p?.role, p?.period].filter(Boolean).join(' | ');
        const hl = pickHighlights(p?.description || '');
        const prefix = lang.value === 'zh' ? `${idx + 1}. ` : `${idx + 1}. `;
        return [prefix + title, meta ? `   ${meta}` : '', hl ? `   ${hl}` : ''].filter(Boolean).join('\n');
      })
    ].filter(Boolean);
    return {
      text: lines.join('\n'),
      citations: makeCitations([{ title: '项目经历', href: '#projects' }]),
      actions: [
        ...top
          .filter((p) => p && (typeof p.id !== 'undefined' && p.id !== null))
          .map((p) => ({ key: `open_project_${p.id}`, label: (lang.value === 'zh' ? `查看《${p.title || '项目'}》详情` : `Open "${p.title || 'Project'}"`), type: 'open_project', projectId: p.id })),
        { key: 'jump_projects', label: lang.value === 'zh' ? '跳转到项目' : 'Go to projects', type: 'jump', href: '#projects' },
        ...projectDirectionActions()
      ]
    };
  }

  if (isSkills) {
    const skills = Array.isArray(props.resumeData?.skills) ? props.resumeData.skills : [];
    const names = skills
      .map((s) => (typeof s === 'string' ? s : s?.name))
      .filter(Boolean)
      .slice(0, 12);
    const lines = [
      lang.value === 'zh' ? '我的技能栈概览：' : 'My stack overview:',
      names.length ? names.join('、') : (lang.value === 'zh' ? '（暂无）' : '(none)')
    ];
    return { text: lines.join('\n'), citations: makeCitations([{ title: '技能', href: '#skills-list' }]), actions: [{ key: 'jump_skills', label: lang.value === 'zh' ? '跳转到技能' : 'Go to skills', type: 'jump', href: '#skills-list' }] };
  }

  if (isCert) {
    const certs = Array.isArray(props.resumeData?.certificates) ? props.resumeData.certificates : [];
    const names = certs.map((c) => c?.name).filter(Boolean);
    const lines = [
      lang.value === 'zh' ? '证书列表：' : 'Certificates:',
      names.length ? names.join('、') : (lang.value === 'zh' ? '（暂无）' : '(none)')
    ];
    return { text: lines.join('\n'), citations: makeCitations([{ title: '证书', href: '#certificates' }]), actions: [{ key: 'jump_certs', label: lang.value === 'zh' ? '跳转到证书' : 'Go to certificates', type: 'jump', href: '#certificates' }] };
  }

  if (isInterests) {
    const interests = Array.isArray(props.resumeData?.interests) ? props.resumeData.interests : [];
    const lines = [
      lang.value === 'zh' ? '兴趣特长：' : 'Interests:',
      ...(interests.length ? interests.map((x) => `- ${x}`) : [lang.value === 'zh' ? '（暂无）' : '(none)'])
    ];
    return { text: lines.join('\n'), citations: makeCitations([{ title: '兴趣特长', href: '#interests' }]), actions: [{ key: 'jump_interests', label: lang.value === 'zh' ? '跳转到兴趣' : 'Go to interests', type: 'jump', href: '#interests' }] };
  }

  if (isAbout) {
    const bio = (profile.bio || '').split('。').filter(Boolean).slice(0, 2).join('。');
    const lines = [
      lang.value === 'zh' ? `我叫 ${profile.name || ''}，目前方向：${profile.title || ''}` : `I’m ${profile.name || ''}. Focus: ${profile.title || ''}`,
      bio ? `${bio}。` : ''
    ].filter(Boolean);
    return { text: lines.join('\n'), citations: makeCitations([{ title: '关于我', href: '#about' }]), actions: [{ key: 'jump_about', label: lang.value === 'zh' ? '跳转到关于我' : 'Go to about', type: 'jump', href: '#about' }] };
  }

  if (isRoleFit) {
    const title = profile.title || '';
    const skillNames = (Array.isArray(props.resumeData?.skills) ? props.resumeData.skills : [])
      .map((s) => (typeof s === 'string' ? s : s?.name))
      .filter(Boolean)
      .join('、');
    const prefersProduct = title.includes('产品') || (profile.bio || '').includes('产品') || skillNames.includes('PRD') || skillNames.includes('Axure') || skillNames.includes('Figma');
    const prefersDev = title.includes('软件') || skillNames.toLowerCase().includes('java') || skillNames.toLowerCase().includes('spring');

    const roles = [];
    if (prefersProduct) roles.push(lang.value === 'zh' ? '产品实习生 / 助理产品经理（偏 AI/健康方向）' : 'Product intern / Associate PM (AI/health)');
    if (prefersDev) roles.push(lang.value === 'zh' ? '后端开发实习（Java / Spring Boot）' : 'Backend intern (Java / Spring Boot)');
    roles.push(lang.value === 'zh' ? '产品需求分析 / 业务分析（有技术背景）' : 'Product/Business analyst (with engineering background)');

    const lines = [
      lang.value === 'zh' ? '结合站内信息，我更匹配的岗位/方向：' : 'Based on this site, best-fit roles:',
      ...roles.slice(0, 3).map((r) => `- ${r}`),
      '',
      lang.value === 'zh' ? `当前定位：${title || '（未填写）'}` : `Current focus: ${title || '(not set)'}`,
      lang.value === 'zh' ? '你更想了解哪一类：前端 / 后端 / AI / 产品？' : 'Which area do you prefer: Frontend / Backend / AI / Product?'
    ].filter(Boolean);

    return {
      text: lines.join('\n'),
      citations: makeCitations([{ title: '关于我', href: '#about' }, { title: '技能', href: '#skills-list' }, { title: '项目经历', href: '#projects' }]),
      actions: [
        { key: 'dir_ai', label: 'AI', type: 'project_dir', direction: 'ai' },
        { key: 'dir_backend', label: lang.value === 'zh' ? '后端' : 'Backend', type: 'project_dir', direction: 'backend' },
        { key: 'dir_eng', label: lang.value === 'zh' ? '工程化' : 'Engineering', type: 'project_dir', direction: 'eng' },
        { key: 'start_lead', label: t('startLead'), type: 'start_lead' }
      ]
    };
  }

  const picked = retrieve(q);
  if (picked.length) {
    const first = picked[0];
    const snippet = (first.content || '').split('\n').map((x) => x.trim()).filter(Boolean).slice(0, 3).join('\n');
    const leadText = lang.value === 'zh'
      ? `我在「${first.title}」里找到了相关信息：\n${snippet}`
      : `I found something relevant under "${first.title}":\n${snippet}`;
    return { text: leadText, citations: makeCitations(picked), actions: [{ key: 'jump_first', label: lang.value === 'zh' ? '打开相关模块' : 'Open section', type: 'jump', href: first.href }] };
  }

  return {
    text: t('unknown'),
    citations: makeCitations([{ title: '关于我', href: '#about' }, { title: '项目经历', href: '#projects' }, { title: '访客互动', href: '#visitor' }]),
    actions: [
      { key: 'jump_projects', label: lang.value === 'zh' ? '看看项目经历' : 'Projects', type: 'jump', href: '#projects' },
      { key: 'start_lead', label: t('startLead'), type: 'start_lead' }
    ]
  };
};

// 过滤锚点标识符的函数
const filterAnchors = (text) => {
  if (typeof text !== 'string') return text;
  // 移除常见的锚点标识符（包括 # 前缀）
  const anchors = ['skills-list', 'project', 'work', 'projects', 'about', 'certificates', 'interests', 'visitor', 'contact'];
  let filteredText = text;
  anchors.forEach(anchor => {
    // 移除任意位置的锚点（包括 # 前缀）
    filteredText = filteredText.replace(new RegExp(`^#?${anchor}$`, 'gm'), '');
  });
  return filteredText.trim();
};

const callChatApi = async (q) => {
  try {
    console.log('前端发送的问题：', q);
    console.log('问题类型：', typeof q);
    console.log('问题长度：', q ? q.length : 0);

    const question = String(q || '').trim();
    console.log('处理后的问题：', question);

    const payload = {
      question: question
    };

    console.log('前端发送的 payload：', payload);

    const payloadStr = JSON.stringify(payload);
    console.log('序列化后的 payload：', payloadStr);

    const res = await fetch('/api/chat?' + Date.now(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: payloadStr
    });

    console.log('后端响应状态：', res.status);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const msg = data?.error || `HTTP ${res.status}`;
      throw new Error(msg);
    }

    const data = await res.json();
    console.log('后端响应数据：', data);
    console.log('后端返回的 reply 长度：', data?.reply ? data.reply.length : 0);
    console.log('后端返回的 reply 内容：', data?.reply);
    
    const replyText = typeof data?.reply === 'string' ? data.reply : '';
    
    if (!replyText || replyText.trim() === '') {
      throw new Error('Coze 工作流未返回任何回答');
    }
    
    // 检测是否为通用欢迎语
    const genericWelcome = '你好！我是基于 Coze 工作流的智能助手。';
    if (replyText.includes(genericWelcome)) {
      console.log('Coze 工作流返回了通用欢迎语，使用本地备用回答');
      return basicAnswer(question);
    }
    
    // 检测是否为余额不足错误
    if (replyText.includes('Insufficient coze credits balance') || replyText.includes('余额不足')) {
      console.log('Coze 工作流余额不足，使用本地备用回答');
      return basicAnswer(question);
    }
    
    // 取消过滤，直接使用原始文本
    console.log('原始文本长度：', replyText.length);
    console.log('原始文本内容：', replyText);
    
    return {
      text: replyText,
      citations: Array.isArray(data?.citations) && data.citations.length ? data.citations : [],
      actions: []
    };
  } catch (error) {
    console.error('API 调用错误：', error);
    console.error('错误信息：', error.message);
    console.error('错误堆栈：', error.stack);
    // 出错时使用本地备用回答
    console.log('API 调用失败，使用本地备用回答');
    return basicAnswer(String(q || '').trim());
  }
};

const startLeadFlow = async () => {
  lead.value = { step: 'name', name: '', company: '', needType: '', time: '', email: '', detail: '' };
  await appendMessage({ role: 'assistant', text: t('askName'), citations: [], actions: [] });
};

const isEmailOk = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((email || '').trim());

const leadPromptActions = (allowSkip) =>
  allowSkip ? [{ key: 'skip', label: t('skip'), type: 'lead_skip' }, { key: 'cancel', label: t('cancel'), type: 'lead_cancel' }] : [{ key: 'cancel', label: t('cancel'), type: 'lead_cancel' }];

const askNeedTypeActions = () => [
  { key: 'type_hire', label: lang.value === 'zh' ? '招聘' : 'Hiring', type: 'lead_set', field: 'needType', value: lang.value === 'zh' ? '招聘' : 'Hiring' },
  { key: 'type_collab', label: lang.value === 'zh' ? '合作' : 'Collaboration', type: 'lead_set', field: 'needType', value: lang.value === 'zh' ? '合作' : 'Collaboration' },
  { key: 'type_chat', label: lang.value === 'zh' ? '交流' : 'Networking', type: 'lead_set', field: 'needType', value: lang.value === 'zh' ? '交流' : 'Networking' },
  { key: 'cancel', label: t('cancel'), type: 'lead_cancel' }
];

const renderLeadSummary = (s) => {
  const lines = [
    `${lang.value === 'zh' ? '称呼' : 'Name'}：${s.name || '-'}`,
    `${lang.value === 'zh' ? '公司/团队' : 'Company/Team'}：${s.company || '-'}`,
    `${lang.value === 'zh' ? '需求类型' : 'Type'}：${s.needType || '-'}`,
    `${lang.value === 'zh' ? '期望联系时间' : 'Preferred time'}：${s.time || '-'}`,
    `${lang.value === 'zh' ? '邮箱' : 'Email'}：${s.email || '-'}`,
    `${lang.value === 'zh' ? '需求描述' : 'Details'}：${s.detail || '-'}`
  ];
  return lines.join('\n');
};

const submitLead = async () => {
  const s = lead.value;
  if (!s) return;
  const profile = props.resumeData?.profile || {};
  const endpoint = (props.visitorFormEndpoint || '').trim();

  if (!props.isVisitorFormConfigured || !endpoint) {
    const email = profile.email || '';
    const lines = [t('notConfigured'), email].filter(Boolean).join(' ');
    await appendMessage({
      role: 'assistant',
      text: lines,
      citations: makeCitations([{ title: '联系方式', href: '#contact' }]),
      actions: email ? [{ key: 'copy_email', label: t('copyEmail'), type: 'copy_email' }, { key: 'jump_contact', label: t('jumpContact'), type: 'jump', href: '#contact' }] : [{ key: 'jump_contact', label: t('jumpContact'), type: 'jump', href: '#contact' }]
    });
    lead.value = null;
    return;
  }

  const subject = [s.needType, s.company, s.time].filter(Boolean).join(' | ').slice(0, 120) || (lang.value === 'zh' ? '访客留言' : 'Visitor message');
  const message = [
    `称呼: ${s.name}`,
    `公司/团队: ${s.company || '-'}`,
    `需求类型: ${s.needType}`,
    `期望联系时间: ${s.time || '-'}`,
    `联系邮箱: ${s.email}`,
    '',
    s.detail
  ].join('\n');

  try {
    const targetUrl = new URL(endpoint, window.location.origin);
    const isFormspree = /(^|\.)formspree\.io$/i.test(targetUrl.hostname);
    const res = await fetch(targetUrl.toString(), {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        ...(isFormspree ? {} : { 'Content-Type': 'application/json' })
      },
      body: isFormspree
        ? (() => {
            const formData = new FormData();
            formData.append('name', s.name);
            formData.append('email', s.email);
            formData.append('subject', subject);
            formData.append('message', message);
            formData.append('_gotcha', '');
            return formData;
          })()
        : JSON.stringify({ name: s.name, email: s.email, subject, message, _gotcha: '' })
    });

    if (!res.ok) {
      await appendMessage({ role: 'assistant', text: t('submitFail'), citations: makeCitations([{ title: '联系方式', href: '#contact' }]), actions: [{ key: 'jump_contact', label: t('jumpContact'), type: 'jump', href: '#contact' }] });
      lead.value = null;
      return;
    }

    await appendMessage({ role: 'assistant', text: t('submitted'), citations: makeCitations([{ title: '访客互动', href: '#visitor' }]), actions: [{ key: 'jump_visitor', label: t('openContact'), type: 'jump', href: '#visitor' }] });
    lead.value = null;
  } catch {
    await appendMessage({ role: 'assistant', text: t('submitFail'), citations: makeCitations([{ title: '联系方式', href: '#contact' }]), actions: [{ key: 'jump_contact', label: t('jumpContact'), type: 'jump', href: '#contact' }] });
    lead.value = null;
  }
};

const handleLeadInput = async (userText) => {
  const s = lead.value;
  if (!s) return null;

  const value = userText.trim();
  const isSkip = value.toLowerCase() === 'skip' || value === t('skip') || value === '跳过';
  if (s.step === 'name') {
    if (!value) return { text: t('askName'), citations: [], actions: [] };
    s.name = value;
    s.step = 'company';
    return { text: t('askCompany'), citations: [], actions: leadPromptActions(true) };
  }
  if (s.step === 'company') {
    if (!isSkip) s.company = value;
    s.step = 'needType';
    return { text: t('askNeedType'), citations: [], actions: askNeedTypeActions() };
  }
  if (s.step === 'time') {
    if (!isSkip) s.time = value;
    s.step = 'email';
    return { text: t('askEmail'), citations: [], actions: leadPromptActions(false) };
  }
  if (s.step === 'email') {
    if (!isEmailOk(value)) return { text: t('askEmail'), citations: [], actions: leadPromptActions(false) };
    s.email = value;
    s.step = 'detail';
    return { text: t('askDetail'), citations: [], actions: leadPromptActions(false) };
  }
  if (s.step === 'detail') {
    if (!value) return { text: t('askDetail'), citations: [], actions: leadPromptActions(false) };
    s.detail = value;
    s.step = 'confirm';
    return {
      text: `${t('confirmLead')}\n${renderLeadSummary(s)}`,
      citations: [],
      actions: [
        { key: 'lead_submit', label: t('submit'), type: 'lead_submit' },
        { key: 'lead_cancel', label: t('cancel'), type: 'lead_cancel' }
      ]
    };
  }
  return null;
};

const runAction = async (a) => {
  if (a.type === 'jump') {
    close();
    await nextTick();
    window.location.hash = a.href || '';
    return;
  }
  if (a.type === 'ask') {
    const label = String(a.label || a.query || '').trim();
    const query = String(a.query || a.label || '').trim();
    if (!query) return;
    await appendMessage({ role: 'user', text: label || query, citations: [], actions: [] });
    isLoading.value = true;
    try {
    const reply = await callChatApi(query);
    await appendMessage({ role: 'assistant', ...reply });
  } catch (error) {
    console.error('API 调用失败：', error);
    
    // 使用本地备用回答
    console.log('使用本地 basicAnswer 作为备用');
    const fallbackReply = basicAnswer(query);
    console.log('备用回答：', fallbackReply);
    await appendMessage({ 
      role: 'assistant', 
      ...fallbackReply
    });
  } finally {
    isLoading.value = false;
  }
    return;
  }
  if (a.type === 'open_project') {
    const projects = Array.isArray(props.resumeData?.projects) ? props.resumeData.projects : [];
    const proj = projects.find((p) => String(p?.id) === String(a.projectId));
    if (proj) emit('open-project', proj);
    close();
    return;
  }
  if (a.type === 'project_dir') {
    const label =
      a.direction === 'frontend' ? (lang.value === 'zh' ? '前端' : 'Frontend') :
      a.direction === 'backend' ? (lang.value === 'zh' ? '后端' : 'Backend') :
      a.direction === 'ai' ? 'AI' :
      a.direction === 'perf' ? (lang.value === 'zh' ? '性能' : 'Performance') :
      (lang.value === 'zh' ? '工程化' : 'Engineering');
    const query = lang.value === 'zh' ? `${label} 项目` : `projects ${label}`;
    await appendMessage({ role: 'user', text: lang.value === 'zh' ? `按${label}方向推荐项目` : `Recommend projects: ${label}`, citations: [], actions: [] });
    isLoading.value = true;
    try {
    const reply = await callChatApi(query);
    await appendMessage({ role: 'assistant', ...reply });
  } catch (error) {
    console.error('API 调用失败：', error);
    
    // 使用本地备用回答
    console.log('使用本地 basicAnswer 作为备用');
    const fallbackReply = basicAnswer(query);
    console.log('备用回答：', fallbackReply);
    await appendMessage({ 
      role: 'assistant', 
      ...fallbackReply
    });
  } finally {
    isLoading.value = false;
  }
    return;
  }
  if (a.type === 'copy_email') {
    const email = props.resumeData?.profile?.email || '';
    if (!email) return;
    const ok = await copyToClipboard(email);
    if (ok) await appendMessage({ role: 'assistant', text: lang.value === 'zh' ? '邮箱已复制。' : 'Email copied.', citations: [], actions: [] });
    return;
  }
  if (a.type === 'start_lead') {
    await startLeadFlow();
    return;
  }
  if (a.type === 'lead_cancel') {
    lead.value = null;
    await appendMessage({ role: 'assistant', text: lang.value === 'zh' ? '好的，已取消。' : 'Okay, cancelled.', citations: [], actions: [] });
    return;
  }
  if (a.type === 'lead_skip') {
    const s = lead.value;
    if (!s) return;
    if (s.step === 'company') {
      s.step = 'needType';
      await appendMessage({ role: 'assistant', text: t('askNeedType'), citations: [], actions: askNeedTypeActions() });
      return;
    }
    if (s.step === 'time') {
      s.step = 'email';
      await appendMessage({ role: 'assistant', text: t('askEmail'), citations: [], actions: leadPromptActions(false) });
      return;
    }
    return;
  }
  if (a.type === 'lead_set') {
    const s = lead.value;
    if (!s) return;
    if (a.field === 'needType') {
      s.needType = a.value;
      s.step = 'time';
      await appendMessage({ role: 'assistant', text: t('askTime'), citations: [], actions: leadPromptActions(true) });
      return;
    }
    return;
  }
  if (a.type === 'lead_submit') {
    await submitLead();
    return;
  }
};

const onSend = async () => {
  const q = normalizeQuery(input.value);
  if (!q) return;
  input.value = '';
  await appendMessage({ role: 'user', text: q, citations: [], actions: [] });

  const leadReply = await handleLeadInput(q);
  if (leadReply) {
    await appendMessage({ role: 'assistant', ...leadReply });
    return;
  }

  isLoading.value = true;
  try {
    console.log('开始调用 callChatApi');
    const reply = await callChatApi(q);
    console.log('callChatApi 返回：', reply);
    await appendMessage({ role: 'assistant', ...reply });
  } catch (error) {
    console.error('API 调用失败：', error);
    console.error('错误信息：', error.message);
    console.error('错误堆栈：', error.stack);
    
    // 使用本地备用回答
    console.log('使用本地 basicAnswer 作为备用');
    const fallbackReply = basicAnswer(q);
    console.log('备用回答：', fallbackReply);
    await appendMessage({ 
      role: 'assistant', 
      ...fallbackReply
    });
  } finally {
    isLoading.value = false;
  }
};

const handleGuideClick = async (s) => {
  const q = lang.value === 'zh' ? s.titleZh : s.titleEn;
  await appendMessage({ role: 'user', text: q, citations: [], actions: [] });
  isLoading.value = true;
  try {
    const reply = await callChatApi(q);
    await appendMessage({ role: 'assistant', ...reply });
  } catch (error) {
    console.error('API 调用失败：', error);
    
    // 使用本地备用回答
    console.log('使用本地 basicAnswer 作为备用');
    const fallbackReply = basicAnswer(q);
    console.log('备用回答：', fallbackReply);
    await appendMessage({ 
      role: 'assistant', 
      ...fallbackReply
    });
  } finally {
    isLoading.value = false;
  }
};

const handleQuickClick = async (p) => {
  const q = lang.value === 'zh' ? p.labelZh : p.labelEn;
  await appendMessage({ role: 'user', text: q, citations: [], actions: [] });
  isLoading.value = true;
  try {
    const reply = await callChatApi(q);
    await appendMessage({ role: 'assistant', ...reply });
  } catch (error) {
    console.error('API 调用失败：', error);
    
    // 使用本地备用回答
    console.log('使用本地 basicAnswer 作为备用');
    const fallbackReply = basicAnswer(q);
    console.log('备用回答：', fallbackReply);
    await appendMessage({ 
      role: 'assistant', 
      ...fallbackReply
    });
  } finally {
    isLoading.value = false;
  }
};

watch(
  () => isOpen.value,
  async (openNow) => {
    if (!openNow) return;
    await nextTick();
    const el = scrollEl.value;
    if (el) el.scrollTop = el.scrollHeight;
  }
);

const onKeydown = (e) => {
  if (e.key === 'Escape' && isOpen.value) close();
};

onMounted(() => {
  window.addEventListener('keydown', onKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown);
});
</script>

