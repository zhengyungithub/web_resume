<template>
  <div class="min-h-screen bg-zen-green-50 text-gray-800 font-sans selection:bg-zen-green-200 selection:text-zen-green-900">
    <!-- Navbar -->
    <nav class="sticky top-0 z-40 bg-white/80 backdrop-blur-md shadow-sm border-b border-zen-green-100 transition-all duration-300">
      <div class="container mx-auto px-6 py-4 flex justify-between items-center">
        <div class="text-2xl font-bold text-zen-green-700 tracking-tight flex items-center gap-2">
          <i class="fas fa-leaf text-zen-green-500"></i>
          <span>{{ data.profile.name }}</span>
        </div>
        <ul class="hidden md:flex space-x-8 text-sm font-medium text-gray-600 items-center">
          <li v-for="link in navLinks" :key="link.href">
            <a :href="link.href" class="hover:text-zen-green-600 transition-colors py-2 border-b-2 border-transparent hover:border-zen-green-400">{{ link.text }}</a>
          </li>
          <!-- 下载简历下拉菜单 -->
          <li class="relative" @mouseenter="showResumeDropdown = true" @mouseleave="showResumeDropdown = false">
            <button
              type="button"
              class="hover:text-zen-green-600 transition-colors py-2 border-b-2 border-transparent hover:border-zen-green-400 flex items-center gap-1"
              @click="showResumeDropdown = !showResumeDropdown"
            >
              <i class="fas fa-download text-xs"></i>
              下载简历
              <i class="fas fa-chevron-down text-xs transition-transform" :class="showResumeDropdown ? 'rotate-180' : ''"></i>
            </button>
            <!-- 下拉选项 -->
            <transition
              enter-active-class="transition duration-200 ease-out"
              enter-from-class="opacity-0 translate-y-1"
              enter-to-class="opacity-100 translate-y-0"
              leave-active-class="transition duration-150 ease-in"
              leave-from-class="opacity-100 translate-y-0"
              leave-to-class="opacity-0 translate-y-1"
            >
              <div
                v-if="showResumeDropdown"
                class="absolute top-full left-0 mt-2 w-40 bg-white rounded-xl shadow-lg border border-zen-green-100 py-2 z-50"
              >
                <a
                  href="/郑筠.jpeg"
                  download
                  class="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-zen-green-50 hover:text-zen-green-700 transition-colors"
                  @click="showResumeDropdown = false"
                >
                  <i class="fas fa-image text-zen-green-500"></i>
                  <span>PNG 图片版</span>
                </a>
                <a
                  href="/郑筠.pdf"
                  download
                  class="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-zen-green-50 hover:text-zen-green-700 transition-colors"
                  @click="showResumeDropdown = false"
                >
                  <i class="fas fa-file-pdf text-red-500"></i>
                  <span>PDF 文档版</span>
                </a>
              </div>
            </transition>
          </li>
        </ul>
        <button class="md:hidden text-gray-600 hover:text-zen-green-600">
          <i class="fas fa-bars text-xl"></i>
        </button>
      </div>
    </nav>

    <!-- Hero Section -->
    <section id="home" class="relative pt-32 pb-20 overflow-hidden">
      <div class="absolute inset-0 bg-gradient-to-b from-zen-green-50 to-white -z-10"></div>
      <div class="container mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
        <div class="space-y-6 animate-fade-in-up">
          <h1 class="text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight relative overflow-visible">
            <!-- 背景大字 -->
            <span class="absolute -top-12 md:-top-16 left-1/2 -translate-x-[40%] text-7xl md:text-8xl lg:text-9xl font-black text-zen-green-200/70 tracking-wider uppercase italic select-none pointer-events-none whitespace-nowrap scale-110">ZHENGYUN</span>
            <!-- 主标题 -->
            <span class="relative block pt-4">你好，我是 <span class="text-zen-green-600">{{ data.profile.name }}</span></span>
          </h1>
          <p class="text-lg text-gray-600 leading-relaxed max-w-lg min-h-[28px]"></p>
<!--           AI Assistant Preview-->
          <div class="flex items-center gap-4 pt-4 flex-wrap">
            <div class="relative flex items-center gap-3 bg-white/80 backdrop-blur-sm rounded-full pl-2 pr-5 py-2 border border-zen-green-100 shadow-sm hover:shadow-lg hover:shadow-zen-green-100/50 transition-all cursor-pointer group animate-pulse-slow" @click="openAiAssistant">
              <div class="absolute -inset-0.5 bg-gradient-to-r from-zen-green-200/50 via-zen-green-300/30 to-zen-green-200/50 rounded-full blur opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div class="absolute top-1 left-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white shadow-sm z-10">
                <span class="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-75"></span>
              </div>
              <div class="relative w-10 h-10 rounded-full overflow-hidden border-2 border-zen-green-200 group-hover:border-zen-green-400 transition-colors group-hover:scale-105 transform duration-300">
                <img src="/阿筠.png" alt="阿筠" class="w-full h-full object-cover">
              </div>
              <div class="relative flex flex-col">
                <span class="text-sm font-medium text-gray-800 group-hover:text-zen-green-600 transition-colors">和阿筠聊聊</span>
                <span class="text-xs text-gray-500 flex items-center gap-1">
                  <span class="w-1.5 h-1.5 bg-zen-green-400 rounded-full"></span>
                  点击开始对话
                </span>
              </div>
              <i class="fas fa-comment-dots text-zen-green-400 group-hover:text-zen-green-600 transition-colors ml-1 group-hover:scale-110 transform"></i>
            </div>

          </div>
        </div>
        <div class="relative flex justify-center md:justify-end animate-fade-in">
          <div class="relative w-72 h-72 md:w-96 md:h-96">
            <div class="absolute inset-0 bg-zen-green-200 rounded-full blur-3xl opacity-30 animate-pulse"></div>
            <!-- Carousel Container -->
            <div class="relative w-full h-full overflow-hidden rounded-[2rem] shadow-2xl border-4 border-white rotate-3 hover:rotate-0 transition-all duration-500">
              <transition-group name="fade">
                <img 
                  v-for="(img, index) in avatarList" 
                  :key="img"
                  v-show="currentAvatarIndex === index"
                  :src="img" 
                  alt="Profile" 
                  class="absolute inset-0 w-full h-full object-cover"
                  :loading="index === 0 ? 'eager' : 'lazy'"
                  decoding="async"
                  :fetchpriority="index === 0 ? 'high' : 'auto'"
                />
              </transition-group>
            </div>
            <!-- Indicators -->
            <div class="absolute -bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
              <div 
                v-for="(_, index) in avatarList" 
                :key="index"
                class="w-2 h-2 rounded-full transition-all duration-300"
                :class="currentAvatarIndex === index ? 'bg-zen-green-500 w-4' : 'bg-zen-green-200'"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- About Section -->
    <section id="about" class="py-20 bg-white relative group">
      <div class="container mx-auto px-6">
        <div class="flex justify-between items-end mb-12">
          <div>
            <h2 class="text-3xl font-bold text-gray-900">关于我</h2>
            <div class="h-1.5 w-24 bg-gradient-to-r from-zen-green-400 to-zen-green-600 mt-3 rounded-full opacity-80"></div>
          </div>
          <button v-if="isEditMode" @click="openAddModal('about')" class="w-10 h-10 rounded-full bg-zen-green-100 text-zen-green-600 hover:bg-zen-green-600 hover:text-white flex items-center justify-center transition-all shadow-sm group-hover:opacity-100 opacity-0 transform translate-y-2 group-hover:translate-y-0" title="添加经历">
            <i class="fas fa-plus"></i>
          </button>
        </div>

        <div class="grid md:grid-cols-2 gap-8">
          <div class="space-y-8">
            <div class="prose prose-lg text-gray-600">
              <!-- 个人简介已移除 -->
            </div>
            <!-- Education -->
            <div class="bg-gradient-to-br from-white to-zen-green-50 rounded-[2rem] p-8 border border-zen-green-100/60 shadow-md relative group/card hover:shadow-xl hover:to-zen-green-100 transition-all duration-500 hover:-translate-y-1">
              <button v-if="isEditMode" @click="openAddModal('education')" class="absolute top-4 right-4 w-8 h-8 rounded-full bg-white text-zen-green-500 hover:bg-zen-green-500 hover:text-white flex items-center justify-center transition-all shadow-sm opacity-0 group-hover/card:opacity-100" title="添加教育经历">
                <i class="fas fa-plus text-xs"></i>
              </button>
              <h3 id="education" class="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <i class="fas fa-graduation-cap text-zen-green-500"></i> 教育背景
                <!-- <button @click="openTranscriptPreview" class="ml-auto px-3 py-1 text-sm rounded-full bg-zen-green-100 text-zen-green-700 hover:bg-zen-green-600 hover:text-white transition-all">
                  查看成绩单
                </button> -->
              </h3>
              <div v-for="edu in data.education" :key="edu.id" class="mb-6 last:mb-0 border-l-2 border-zen-green-200 pl-4 ml-1 relative">
                <div class="absolute -left-[21px] top-1 w-3 h-3 bg-zen-green-500 rounded-full ring-4 ring-zen-green-50"></div>
                <div class="flex justify-between items-start flex-wrap gap-2 mb-2">
                  <h4 class="font-semibold text-lg text-gray-800">{{ edu.school }}</h4>
                  <span class="text-sm text-zen-green-600 font-medium bg-zen-green-100/80 px-3 py-0.5 rounded-full shadow-sm">
                    {{ edu.period }}
                  </span>
                </div>
                <p class="text-gray-600 mb-3">{{ edu.degree }} · {{ edu.major }}</p>
                <p class="text-sm text-gray-500 whitespace-pre-line leading-relaxed">
                  {{ edu.details }}
                </p>
              </div>
            </div>
          </div>
          <div class="space-y-6">
            <!-- Work Experience (Short) -->
            <div class="bg-gradient-to-br from-white to-zen-green-50/20 rounded-[2rem] pt-8 pb-8 px-8 border border-zen-green-100/60 shadow-md relative group/work hover:shadow-xl hover:to-zen-green-50/60 transition-all duration-500 min-h-[280px] hover:-translate-y-1">
              <button v-if="isEditMode" @click="openAddModal('work')" class="absolute top-3 right-4 w-8 h-8 rounded-full bg-zen-green-50 text-zen-green-500 hover:bg-zen-green-500 hover:text-white flex items-center justify-center transition-all shadow-sm opacity-0 group-hover/work:opacity-100" title="添加工作经历">
                <i class="fas fa-plus text-xs"></i>
              </button>
              <h3 id="work" class="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <i class="fas fa-briefcase text-zen-green-500"></i> 实习经历
              </h3>
              <div v-for="job in data.work" :key="job.id" class="mb-4 last:mb-0">
                <h4 class="font-semibold text-gray-800">{{ job.company }}</h4>
                <p class="text-sm text-zen-green-600 mb-1">{{ job.role }} | {{ job.period }}</p>
                <ul class="text-sm text-gray-500 space-y-1">
                  <li v-for="(item, index) in job.description.split('\n')" :key="index" class="leading-relaxed" v-html="item"></li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <!-- Work Experience (Full Width) -->
        <div class="mt-8 bg-gradient-to-br from-white to-zen-green-50 rounded-[2rem] p-8 border border-zen-green-100/60 shadow-md relative group/jobexp hover:shadow-xl hover:to-zen-green-100 transition-all duration-500 hover:-translate-y-1">
          <h3 id="work-exp" class="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <i class="fas fa-user-tie text-zen-green-500"></i> 工作经历
          </h3>
          <div class="border-l-2 border-zen-green-200 pl-4 ml-1 relative">
            <div class="absolute -left-[21px] top-1 w-3 h-3 bg-zen-green-500 rounded-full ring-4 ring-zen-green-50"></div>
            <div class="flex justify-between items-start flex-wrap gap-2 mb-2">
              <h4 class="font-semibold text-lg text-gray-800">珠海格力电器股份有限公司</h4>
              <span class="text-sm text-zen-green-600 font-medium bg-zen-green-100/80 px-3 py-0.5 rounded-full shadow-sm">2026/07-2027/01</span>
            </div>
            <p class="text-zen-green-600 mb-4">HR 数字化产品专员</p>
            <ul class="text-sm text-gray-500 space-y-2 leading-relaxed">
              <li><strong class="font-semibold text-gray-900">系统运维与测试</strong>：作为业务方负责格慧招聘校招期间日常运维与功能测试，覆盖笔试、面试、资料审核、Offer 发放、报到审核等全链路模块；</li>
              <li><strong class="font-semibold text-gray-900">业务流程梳理</strong>：入职后主动以产品经理视角走查系统设计逻辑，从用户（学生、HR、面试官）三方路径梳理业务链路，输出功能清单以及业务流程图等产品设计文档；负责绘制新需求（三方签约后入职报到）业务流程图，并借助 AI 工具输出原型图等产品方案，辅助向研发侧说明操作路径与节点交互；</li>
              <li><strong class="font-semibold text-gray-900">需求协同与迭代</strong>：基于校招期间收集三方（学生、HR、面试官）使用反馈沉淀业务痛点并提出系统优化需求点；参与 AI 资料审核需求评审，复述业务规则与异常场景，协助对齐"AI 初审 + 人工复核"人机边界与验收指标，跟进功能验收与 Bug 回归闭环，配合开发团队迭代优化系统流程，提升招聘效率与候选人应聘体验；</li>
              <li><strong class="font-semibold text-gray-900">校招全流程执行</strong>：参与多站点校招一线执行，含笔试／面试组织、面试间叫号控场、候选人资料审核与问题响应、Offer 与拒信发送，并负责校招咨询邮箱值守与应届生违约业务的流程梳理与数据通报。</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
    
    <div v-if="showTranscriptPreview" class="fixed inset-0 z-50 flex items-center justify-center" @click="closeTranscriptPreview">
      <div class="bg-white rounded-2xl shadow-2xl p-4 max-w-lg" @click.stop>
        <img :src="transcriptImage" alt="成绩单" class="max-w-full h-auto rounded-lg cursor-zoom-in" loading="lazy" decoding="async" @click.stop="openTranscriptZoom">
      </div>
    </div>
    
    <div v-if="showTranscriptZoom" class="fixed inset-0 z-[60] bg-zen-green-900/20 backdrop-blur-sm flex items-center justify-center p-6" @click="closeTranscriptZoom">
      <div class="bg-white rounded-2xl shadow-2xl p-4 max-w-[90vw] max-h-[90vh]" @click.stop>
        <div class="overflow-auto max-w-[85vw] max-h-[80vh] rounded-lg cursor-move" @mousemove="panTranscriptOnMove">
          <img :src="transcriptImage" alt="成绩单" class="max-w-none w-auto h-auto" loading="lazy" decoding="async">
        </div>
      </div>
    </div>
    
    <!-- Word Cloud Button -->
    <div class="fixed left-6 bottom-6 z-40">
      <button
        @click="openWordCloud"
        class="w-14 h-14 rounded-full bg-gradient-to-br from-zen-green-500 to-zen-green-600 text-white shadow-lg hover:shadow-2xl hover:shadow-zen-green-200/50 transition-all transform hover:scale-110 flex items-center justify-center group"
        title="点击查看个人性格词云"
      >
        <i class="fas fa-cloud text-xl group-hover:animate-bounce"></i>
      </button>
    </div>

    <!-- Projects Section -->
    <section id="projects" class="py-20 bg-zen-green-50 relative">
      <div class="container mx-auto px-6">
        <div class="flex justify-between items-end mb-12">
          <div>
            <h2 class="text-3xl font-bold text-gray-900">项目经历</h2>
            <div class="h-1.5 w-24 bg-gradient-to-r from-zen-green-400 to-zen-green-600 mt-3 rounded-full opacity-80"></div>
          </div>
          <button v-if="isEditMode" @click="openAddModal('project')" class="px-4 py-2 bg-zen-green-600 hover:bg-zen-green-700 text-white rounded-full flex items-center gap-2 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
            <i class="fas fa-plus"></i>
            <span class="text-sm font-medium">添加项目</span>
          </button>
        </div>

        <div class="grid md:grid-cols-2 gap-8">
          <div v-for="project in data.projects" :key="project.id" class="bg-gradient-to-br from-white to-zen-green-50/20 rounded-[2rem] overflow-hidden shadow-md hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 border border-zen-green-100/50 group">
            <div class="h-48 bg-zen-green-100/30 relative overflow-hidden">
              <!-- Project image -->
              <img v-if="project.image" :src="project.image" :alt="project.title" class="w-full h-full object-cover" loading="lazy" decoding="async">
              <div v-else class="absolute inset-0 flex items-center justify-center text-zen-green-300">
                <i class="fas fa-laptop-code text-6xl opacity-50"></i>
              </div>
              <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                <button @click="openProjectDetail(project)" class="px-4 py-2 bg-white text-gray-900 rounded-full text-sm font-medium hover:bg-zen-green-50">查看详情</button>
              </div>
            </div>
            <div class="p-8">
              <div class="flex justify-between items-start mb-4">
                <div>
                  <h3 class="text-xl font-bold text-gray-900 group-hover:text-zen-green-600 transition-colors">{{ project.title }}</h3>
                  <p class="text-sm text-gray-500 mt-1">{{ project.role }} | {{ project.period }}</p>
                </div>
              </div>
              <p class="text-gray-600 text-sm leading-relaxed mb-6 line-clamp-4 whitespace-pre-line" v-html="project.description.replace(/(需求挖掘与定位|AI应用与用户体验优化|跨团队协作与落地|数据驱动迭代|技术方案落地|用户需求挖掘|适老化体验优化|快速迭代与验证|跨角色协同设计)\s*：?/g, '<strong class=\'font-semibold text-gray-900\'>$1</strong>：')">
              </p>

              <div class="flex flex-wrap gap-3">
                <button @click="openDocPlaceholder('需求文档')" class="px-4 py-2 bg-zen-green-50 text-zen-green-700 font-medium rounded-lg border border-zen-green-100 hover:bg-zen-green-100 transition-all text-sm flex items-center gap-2">
                  <i class="fas fa-file-alt"></i>
                  <span>需求文档</span>
                </button>
                <button @click="openDocPlaceholder('产品设计文档')" class="px-4 py-2 bg-zen-green-50 text-zen-green-700 font-medium rounded-lg border border-zen-green-100 hover:bg-zen-green-100 transition-all text-sm flex items-center gap-2">
                  <i class="fas fa-pen-fancy"></i>
                  <span>产品设计文档</span>
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Portfolio Section -->
    <section id="portfolio" class="pt-4 pb-12 bg-zen-green-50 relative">
      <div class="container mx-auto px-6">
        <div class="flex justify-between items-end mb-8">
          <div>
            <h2 class="text-3xl font-bold text-gray-900">作品集</h2>
            <div class="h-1.5 w-24 bg-gradient-to-r from-zen-green-400 to-zen-green-600 mt-3 rounded-full opacity-80"></div>
          </div>
        </div>

        <div class="relative">
          <div ref="portfolioTrack" @scroll="onPortfolioScroll" class="flex gap-6 overflow-x-auto pb-2 snap-x snap-mandatory no-scrollbar">
            <div v-for="(item, index) in data.portfolio" :key="item.id" data-portfolio-card
                 class="flex-shrink-0 w-[82vw] max-w-[320px] md:max-w-none md:w-[320px] snap-start bg-gradient-to-br from-white to-zen-green-50/20 rounded-[2rem] overflow-hidden shadow-md hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 border border-zen-green-100/50 group">
              <div class="h-40 bg-gradient-to-br from-zen-green-100 to-zen-green-50 flex items-center justify-center overflow-hidden">
                <img v-if="item.cover" :src="item.cover" :alt="item.title" class="w-full h-full object-cover" />
                <i v-else :class="['fas', item.icon || 'fa-cube', 'text-4xl text-zen-green-400 group-hover:text-zen-green-600 transition-colors duration-500']"></i>
              </div>
              <div class="p-6">
                <h4 class="text-lg font-bold text-gray-900 group-hover:text-zen-green-600 transition-colors">{{ item.title }}</h4>
                <p class="text-gray-600 text-sm leading-relaxed mt-2">{{ item.description }}</p>
              </div>
            </div>
          </div>
          <div class="flex justify-center gap-2 mt-4">
            <button v-for="(item, index) in data.portfolio" :key="'dot-' + item.id"
                    @click="scrollToPortfolio(index)"
                    :class="['h-2 rounded-full transition-all duration-300', index === portfolioActive ? 'w-5 bg-zen-green-600' : 'w-2 bg-zen-green-200 hover:bg-zen-green-400']"
                    :aria-label="'切换到作品 ' + (index + 1)"></button>
          </div>
        </div>
      </div>
    </section>

    <!-- Skills Section -->
    <section id="skills" class="pt-16 pb-8 bg-white relative group">
      <div class="container mx-auto px-6">
        <div class="mb-10">
          <div class="flex justify-between items-end mb-6">
            <div>
              <h2 id="certificates" class="text-3xl font-bold text-gray-900">证书</h2>
              <div class="h-1.5 w-24 bg-gradient-to-r from-zen-green-400 to-zen-green-600 mt-3 rounded-full opacity-80"></div>
            </div>
            <div v-if="isEditMode" class="flex gap-2">
              <button @click="openAddModal('certificate')" class="w-10 h-10 rounded-full bg-zen-green-100 text-zen-green-600 hover:bg-zen-green-600 hover:text-white flex items-center justify-center transition-all shadow-sm group-hover:opacity-100 opacity-0 transform translate-y-2 group-hover:translate-y-0" title="添加证书">
                <i class="fas fa-plus"></i>
              </button>
              <button @click="toggleDeleteMode('certificate')" class="w-10 h-10 rounded-full bg-zen-green-100 text-zen-green-600 hover:bg-zen-green-600 hover:text-white flex items-center justify-center transition-all shadow-sm group-hover:opacity-100 opacity-0 transform translate-y-2 group-hover:translate-y-0" title="删除证书">
                <i class="fas fa-minus"></i>
              </button>
            </div>
          </div>
          <div class="bg-gradient-to-br from-zen-green-50/50 to-white rounded-[2.5rem] p-8 border border-zen-green-100/50 shadow-inner">
            <div class="flex flex-wrap gap-3">
              <div v-for="(cert, index) in data.certificates" :key="index" 
                   class="px-4 py-2 bg-white text-gray-700 rounded-lg shadow-sm hover:shadow-md hover:text-zen-green-600 transition-all cursor-pointer border border-gray-100 relative"
                   @mouseenter="showCertificateImage(cert, $event)"
                   @mouseleave="scheduleHideCertificateImage"
                   @click="openCertificateZoom(cert)">
                {{ cert.name }}
                <div v-if="isEditMode" class="absolute top-0 right-0 flex gap-1 p-1">
                  <button v-if="deleteMode === 'certificate'" @click.stop="deleteItem('certificates', index)" 
                          class="w-5 h-5 rounded-full bg-red-100 text-red-600 hover:bg-red-600 hover:text-white flex items-center justify-center transition-all text-xs"
                          title="删除证书">
                    <i class="fas fa-trash"></i>
                  </button>
                  <button @click.stop="openEditModal('certificate', cert, index)" 
                          class="w-5 h-5 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-600 hover:text-white flex items-center justify-center transition-all text-xs"
                          title="编辑证书">
                    <i class="fas fa-edit"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="mb-6">
          <div class="flex justify-between items-end mb-6">
            <div>
              <h2 id="skills-list" class="text-3xl font-bold text-gray-900">技能</h2>
              <div class="h-1.5 w-24 bg-gradient-to-r from-zen-green-400 to-zen-green-600 mt-3 rounded-full opacity-80"></div>
            </div>
            <div v-if="isEditMode" class="flex gap-2">
              <button @click="openAddModal('skill')" class="w-10 h-10 rounded-full bg-zen-green-100 text-zen-green-600 hover:bg-zen-green-600 hover:text-white flex items-center justify-center transition-all shadow-sm group-hover:opacity-100 opacity-0 transform translate-y-2 group-hover:translate-y-0" title="添加技能">
                <i class="fas fa-plus"></i>
              </button>
              <button @click="toggleDeleteMode('skill')" class="w-10 h-10 rounded-full bg-zen-green-100 text-zen-green-600 hover:bg-zen-green-600 hover:text-white flex items-center justify-center transition-all shadow-sm group-hover:opacity-100 opacity-0 transform translate-y-2 group-hover:translate-y-0" title="删除技能">
                <i class="fas fa-minus"></i>
              </button>
            </div>
          </div>
          <div class="bg-gradient-to-br from-zen-green-50/50 to-white rounded-[2.5rem] p-8 border border-zen-green-100/50 shadow-inner">
            <div class="flex flex-wrap gap-4">
              <div v-for="(skill, index) in normalizedSkills" :key="skill.id || skill.name || index"
                   class="group/skill bg-white rounded-xl shadow-sm border border-gray-100 px-3 py-1.5 hover:shadow-md transition-all relative w-fit max-w-full overflow-visible cursor-default"
                   :class="isEditMode ? 'pr-14' : ''"
                   :style="{ animationDelay: `${index * 0.05}s` }">
                <!-- 背景渐变效果 -->
                <div class="absolute inset-0 bg-gradient-to-r from-zen-green-100/0 to-zen-green-100/0 group-hover/skill:from-zen-green-100/30 group-hover/skill:to-zen-green-100/10 transition-all duration-300"></div>
                <!-- 发光效果 -->
                <div class="absolute -inset-0.5 bg-gradient-to-r from-zen-green-400/0 to-zen-green-500/0 rounded-xl opacity-0 group-hover/skill:opacity-30 transition-opacity duration-300 blur-sm"></div>
                <!-- 技能名称 -->
                <div class="text-gray-800 font-medium truncate relative z-10 group-hover/skill:text-zen-green-700 transition-colors duration-300">{{ skill.name }}</div>
                <!-- 悬浮描述气泡 -->
                <div v-if="skill.description && !isEditMode"
                     class="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-60 z-30 opacity-0 translate-y-1 group-hover/skill:opacity-100 group-hover/skill:translate-y-0 transition-all duration-200">
                  <div class="bg-white border border-zen-green-100 rounded-xl shadow-lg p-3 relative">
                    <p class="text-xs text-gray-600 leading-relaxed">{{ skill.description }}</p>
                    <div class="absolute top-full left-1/2 -translate-x-1/2 -mt-px w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-zen-green-100"></div>
                    <div class="absolute top-full left-1/2 -translate-x-1/2 mt-[5px] w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-white"></div>
                  </div>
                </div>
                <!-- 编辑模式按钮 -->
                <div v-if="isEditMode" class="absolute top-2 right-2 flex gap-1 relative z-20">
                  <button v-if="deleteMode === 'skill'" @click.stop="deleteItem('skills', index)" class="w-6 h-6 rounded-full bg-red-100 text-red-600 hover:bg-red-600 hover:text-white flex items-center justify-center transition-all text-xs transform hover:scale-110" title="删除技能">
                    <i class="fas fa-trash"></i>
                  </button>
                  <button @click.stop="openEditModal('skill', data.skills[index], index)" class="w-6 h-6 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-600 hover:text-white flex items-center justify-center transition-all text-xs transform hover:scale-110" title="编辑技能">
                    <i class="fas fa-edit"></i>
                  </button>
                </div>
                <!-- 点击效果 -->
                <div class="absolute inset-0 bg-zen-green-500/10 opacity-0 transition-opacity duration-200"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div v-if="showCertificatePopup && currentCertificate.value" 
           class="fixed z-50 bg-white rounded-2xl shadow-2xl p-4 max-w-lg"
           :style="{ top: popupPosition.y + 'px', left: popupPosition.x + 'px' }"
           @mouseenter="cancelHideCertificateImage"
           @mouseleave="hideCertificateImage">
        <img v-if="currentCertificate.value.image" 
             :src="currentCertificate.value.image" 
             :alt="currentCertificate.value.name" 
             class="max-w-full h-auto rounded-lg cursor-zoom-in" 
             @click.stop="openCertificateZoom(currentCertificate.value)"
             @error="console.error('证书图片加载失败:', currentCertificate.value.image)">
        <div v-else class="text-gray-500 text-center py-8">暂无证书图片</div>
      </div>
      
      <div v-if="showCertificateZoom && zoomCertificate" class="fixed inset-0 z-[60] flex items-center justify-center p-6" @click="closeCertificateZoom">
        <div class="bg-white rounded-2xl shadow-2xl p-6 max-w-2xl max-h-[80vh] flex flex-col" @click.stop>
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-xl font-bold text-gray-900">{{ zoomCertificate.name }}</h3>
            <button @click="closeCertificateZoom" class="text-gray-500 hover:text-gray-900 transition-colors w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-50">
              <i class="fas fa-times text-lg"></i>
            </button>
          </div>
          <div class="flex-1 overflow-auto flex items-center justify-center">
            <img :src="zoomCertificate.image" :alt="zoomCertificate.name" class="max-w-full max-h-[60vh] w-auto h-auto rounded-lg cursor-zoom-out" loading="eager" decoding="async" @click="closeCertificateZoom">
          </div>
        </div>
      </div>
    </section>

    <!-- Interests Section -->
    <section id="interests" class="pt-6 pb-10 bg-white relative">
      <div class="container mx-auto px-6">
        <div class="flex justify-between items-end mb-8">
          <div>
            <h2 class="text-3xl font-bold text-gray-900">兴趣特长</h2>
            <div class="h-1.5 w-24 bg-gradient-to-r from-zen-green-400 to-zen-green-600 mt-3 rounded-full opacity-80"></div>
          </div>
        </div>
        
        <div class="grid md:grid-cols-3 gap-6">
          <div class="bg-gradient-to-br from-white to-zen-green-50 rounded-[2rem] p-8 border border-zen-green-100/50 shadow-md relative group/card hover:shadow-xl hover:scale-[1.02] hover:to-zen-green-100 transition-all duration-500">
            <h3 class="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <i class="fas fa-camera text-zen-green-500"></i> 摄影
            </h3>
            <p class="text-gray-600 leading-relaxed mb-6 text-sm">
              熟练使用后期软件进行后期调色与构图优化，具备较强审美能力与细节把控力，可辅助产品截图美化、活动海报设计等宣传材料制作。
            </p>
            <button @click="openPhotoGallery" class="px-4 py-2 bg-zen-green-600 hover:bg-zen-green-700 text-white font-medium rounded-full shadow-lg shadow-zen-green-200 transition-all transform hover:-translate-y-1 text-sm">
              查看作品集
            </button>
          </div>
          
          <div class="bg-gradient-to-br from-white to-zen-green-50 rounded-[2rem] p-8 border border-zen-green-100/50 shadow-md relative group/card hover:shadow-xl hover:scale-[1.02] hover:to-zen-green-100 transition-all duration-500">
            <h3 class="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <i class="fas fa-pen-fancy text-zen-green-500"></i> 随笔写作
            </h3>
            <p class="text-gray-600 leading-relaxed mb-6 text-sm">
              善于用文字记录思考与观察，撰写技术随笔、复盘报告，注重逻辑性与表达深度。能助力需求业务文档、复盘报告撰写，提升文档质量。
            </p>
            <button @click="openWritingGallery" class="px-4 py-2 bg-zen-green-600 hover:bg-zen-green-700 text-white font-medium rounded-full shadow-lg shadow-zen-green-200 transition-all transform hover:-translate-y-1 text-sm">
              随笔作品集
            </button>
          </div>
          
          <div class="bg-gradient-to-br from-white to-zen-green-50 rounded-[2rem] p-8 border border-zen-green-100/50 shadow-md relative group/card hover:shadow-xl hover:scale-[1.02] hover:to-zen-green-100 transition-all duration-500">
            <h3 class="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <i class="fas fa-video text-zen-green-500"></i> 视频创作
            </h3>
            <p class="text-gray-600 leading-relaxed mb-6 text-sm">
              具备视频拍摄与剪辑能力，能够制作产品演示、教程解说等视频内容。持续积累视频作品，打造个人视频作品集。
            </p>
            <button @click="openVideoGallery" class="px-4 py-2 bg-zen-green-600 hover:bg-zen-green-700 text-white font-medium rounded-full shadow-lg shadow-zen-green-200 transition-all transform hover:-translate-y-1 text-sm">
              视频作品集
            </button>
          </div>
        </div>
      </div>
    </section>

    <section id="visitor" class="py-12 bg-zen-green-50 relative">
      <div class="container mx-auto px-6">
        <div class="mb-8">
          <h2 class="text-3xl font-bold text-gray-900">访客互动</h2>
          <div class="h-1.5 w-24 bg-gradient-to-r from-zen-green-400 to-zen-green-600 mt-3 rounded-full opacity-80"></div>
        </div>

        <div class="max-w-5xl mx-auto">
          <div class="bg-gradient-to-br from-white to-zen-green-50/40 rounded-[2.5rem] p-8 border border-zen-green-100/50 shadow-lg hover:shadow-2xl transition-all duration-500">
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-xl font-bold text-gray-900 flex items-center gap-2">
                <i class="fas fa-comment-dots text-zen-green-500"></i>
                联系表单
              </h3>
              <div class="flex items-center gap-2 text-sm text-gray-600" v-if="visitorCount > 0">
                <i class="fas fa-eye text-zen-green-500"></i>
                <span>浏览次数: {{ visitorCount }}</span>
              </div>
            </div>

            <form class="space-y-4" method="POST" :action="visitorFormEndpoint" @submit.prevent="submitVisitorForm">
              <input type="text" name="_gotcha" v-model="visitorHoneypot" class="hidden" tabindex="-1" autocomplete="off">

              <p class="text-gray-600 leading-relaxed">
                有合作/交流/机会欢迎留言，我会通过邮件回复。
              </p>

              <div class="grid sm:grid-cols-2 gap-3">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1" for="visitorName">姓名</label>
                  <input id="visitorName" name="name" v-model="visitorName" type="text" autocomplete="name" required class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-zen-green-500 focus:border-transparent transition-all outline-none">
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1" for="visitorEmail">邮箱 <span class="text-xs text-zen-green-600">(请仔细核对邮箱地址，方便我及时给你回信哦~)</span></label>
                  <input id="visitorEmail" name="email" v-model="visitorEmail" type="email" autocomplete="email" required class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-zen-green-500 focus:border-transparent transition-all outline-none">
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1" for="visitorSubject">主题</label>
                <input id="visitorSubject" name="subject" v-model="visitorSubject" type="text" autocomplete="off" required class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-zen-green-500 focus:border-transparent transition-all outline-none">
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1" for="visitorMessage">留言内容</label>
                <textarea id="visitorMessage" name="message" v-model="visitorMessage" rows="4" required class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-zen-green-500 focus:border-transparent transition-all outline-none resize-none"></textarea>
              </div>

              <div class="flex items-center justify-between gap-4">
                <p class="text-xs text-gray-500">
                  *提交即表示同意将表单内容用于邮件联系。
                </p>
                <button type="submit" :disabled="visitorSubmitting || !isVisitorFormConfigured" class="px-6 py-2 bg-zen-green-600 hover:bg-zen-green-700 disabled:bg-zen-green-300 disabled:cursor-not-allowed text-white rounded-full shadow-md transition-all">
                  {{ visitorSubmitting ? '发送中…' : '提交' }}
                </button>
              </div>

              <div v-if="!isVisitorFormConfigured" class="text-xs text-gray-500">
                未配置表单服务，暂时无法提交。请设置 VITE_FORMSPREE_ENDPOINT 后再试。
              </div>

              <div v-if="visitorStatus === 'success'" class="text-sm text-zen-green-700 bg-zen-green-50 border border-zen-green-100 rounded-lg px-3 py-2 flex items-center gap-2 animate-success-pulse">
                <i class="fas fa-check-circle text-zen-green-600 animate-success-icon"></i>
                <span>已发送，我会尽快回复。</span>
              </div>
              <div v-else-if="visitorStatus === 'error'" class="text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {{ visitorErrorText || '发送失败，请稍后重试。' }}
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>

    <!-- Contact Section -->
    <section id="contact" class="py-14 bg-zen-green-900 text-white relative overflow-hidden">
      <!-- Decorative circles -->
      <div class="absolute top-0 right-0 w-64 h-64 bg-zen-green-800 rounded-full blur-3xl opacity-50 transform translate-x-1/2 -translate-y-1/2"></div>
      
      <div class="container mx-auto px-6 relative z-10 text-center">
        <h2 class="text-3xl font-bold mb-8">联系方式</h2>
        <div class="flex flex-col md:flex-row justify-center gap-8 md:gap-16 mb-12">
          <div class="flex flex-col items-center gap-3 group">
            <div class="w-12 h-12 rounded-full bg-zen-green-800 flex items-center justify-center text-zen-green-300 group-hover:bg-zen-green-700 group-hover:text-white transition-all">
              <i class="fas fa-envelope text-xl"></i>
            </div>
            <span class="text-zen-green-100 group-hover:text-white transition-colors">{{ data.profile.email }}</span>
          </div>
          <div class="flex flex-col items-center gap-3 group">
            <div class="w-12 h-12 rounded-full bg-zen-green-800 flex items-center justify-center text-zen-green-300 group-hover:bg-zen-green-700 group-hover:text-white transition-all">
              <i class="fab fa-qq text-xl"></i>
            </div>
            <span class="text-zen-green-100 group-hover:text-white transition-colors">{{ data.profile.phone }}</span>
          </div>
          <div class="flex flex-col items-center gap-3 group">
            <div class="w-12 h-12 rounded-full bg-zen-green-800 flex items-center justify-center text-zen-green-300 group-hover:bg-zen-green-700 group-hover:text-white transition-all">
              <i class="fas fa-map-marker-alt text-xl"></i>
            </div>
            <span class="text-zen-green-100 group-hover:text-white transition-colors">{{ data.profile.location }}</span>
          </div>
        </div>
        
        <p class="text-zen-green-400 text-sm">
          © {{ new Date().getFullYear() }} {{ data.profile.name }}. Updates ongoing, stay tuned.
        </p>
        <p class="text-zen-green-400/70 text-xs mt-2">
          <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer"
             class="hover:text-zen-green-300 transition-colors">
            粤ICP备2026164325号-1
          </a>
        </p>
      </div>
    </section>

    <AiAssistant
      ref="aiAssistantRef"
      :resume-data="data"
      :visitor-form-endpoint="visitorFormEndpoint"
      :is-visitor-form-configured="isVisitorFormConfigured"
      @open-project="openProjectDetail"
    />



    <!-- Modal -->
    <AddModal
      v-if="isEditMode"
      :is-open="isModalOpen"
      :title="modalTitle"
      :schema="currentSchema"
      :initial-data="editData"
      @close="isModalOpen = false"
      @save="handleSave"
    />
  
    <!-- Project Detail Modal -->
    <div v-if="showProjectDetail" class="fixed inset-0 z-50 flex items-center justify-center bg-zen-green-900/20 backdrop-blur-sm">
      <div class="bg-white rounded-[2rem] shadow-2xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto border border-zen-green-100">
        <div class="bg-white px-6 py-5 flex justify-between items-center border-b border-zen-green-100 sticky top-0 z-10 backdrop-blur-md bg-white/90">
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-10 h-10 rounded-full bg-zen-green-50 border border-zen-green-100 flex items-center justify-center text-zen-green-700">
              <i class="fas fa-laptop-code text-lg"></i>
            </div>
            <h3 class="text-gray-900 text-lg font-semibold truncate">{{ currentProject?.title }}</h3>
          </div>
          <button @click="showProjectDetail = false" class="text-gray-500 hover:text-gray-900 transition-colors w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-50">
            <i class="fas fa-times text-lg"></i>
          </button>
        </div>
        <div class="p-8">
          <div class="mb-4">
            <p class="text-sm text-gray-500">{{ currentProject?.role }} | {{ currentProject?.period }}</p>
          </div>
          <div class="mb-6">
            <div v-if="currentProject?.image" class="overflow-hidden rounded-lg mb-4">
              <img
                :src="currentProject.image"
                :alt="currentProject.title"
                class="w-full h-64 object-cover transition-transform duration-300 cursor-zoom-in"
                :class="projectZoomed ? 'scale-[1.6] cursor-zoom-out' : 'scale-100'"
                loading="eager"
                decoding="async"
                @click="toggleProjectZoom"
              >
            </div>
            <p class="text-gray-600 leading-relaxed whitespace-pre-line" v-html="currentProject?.description.replace(/(需求挖掘与定位|AI应用与用户体验优化|跨团队协作与落地|数据驱动迭代|技术方案落地|用户需求挖掘|适老化体验优化|快速迭代与验证|跨角色协同设计)\s*：?/g, '<strong class=\'font-semibold text-gray-900\'>$1</strong>：')"></p>
          </div>
        </div>
      </div>
    </div>
  
    <!-- Photo Orientation Selector Modal -->
    <div v-if="showPhotoOrientationSelector" class="fixed inset-0 z-50 flex items-center justify-center bg-zen-green-900/20 backdrop-blur-sm animate-fade-in" @click="closePhotoOrientationSelector">
      <div class="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg mx-4 overflow-hidden border border-zen-green-100 animate-scale-up" @click.stop>
        <div class="bg-gradient-to-r from-zen-green-50 to-white px-6 py-5 flex justify-between items-center border-b border-zen-green-100">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-zen-green-100 border border-zen-green-200 flex items-center justify-center text-zen-green-600 shadow-sm">
              <i class="fas fa-camera text-lg"></i>
            </div>
            <div>
              <h3 class="text-gray-900 text-lg font-semibold">摄影作品集</h3>
              <p class="text-xs text-zen-green-600">请选择您想查看的照片类型</p>
            </div>
          </div>
          <button @click="closePhotoOrientationSelector" class="text-gray-500 hover:text-zen-green-600 transition-all w-9 h-9 flex items-center justify-center rounded-full hover:bg-zen-green-50 hover:shadow-md">
            <i class="fas fa-times text-lg"></i>
          </button>
        </div>
        <div class="p-8">
          <div class="grid grid-cols-2 gap-6">
            <button @click="selectPhotoOrientation('landscape')" class="group relative bg-gradient-to-br from-zen-green-50 to-white rounded-2xl p-6 border-2 border-zen-green-100 hover:border-zen-green-400 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div class="flex flex-col items-center gap-4">
                <div class="w-16 h-12 rounded-lg bg-zen-green-200 group-hover:bg-zen-green-300 transition-colors flex items-center justify-center shadow-md">
                  <i class="fas fa-image text-zen-green-600 text-xl"></i>
                </div>
                <div class="text-center">
                  <h4 class="text-gray-900 font-semibold text-lg mb-1">横屏照片</h4>
                  <p class="text-gray-500 text-sm">{{ landscapePhotos?.length || 0 }} 张作品</p>
                </div>
              </div>
              <div class="absolute top-3 right-3 w-6 h-6 rounded-full bg-zen-green-100 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <i class="fas fa-arrow-right text-zen-green-600 text-xs"></i>
              </div>
            </button>
            
            <button @click="selectPhotoOrientation('portrait')" class="group relative bg-gradient-to-br from-zen-green-50 to-white rounded-2xl p-6 border-2 border-zen-green-100 hover:border-zen-green-400 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div class="flex flex-col items-center gap-4">
                <div class="w-12 h-16 rounded-lg bg-zen-green-200 group-hover:bg-zen-green-300 transition-colors flex items-center justify-center shadow-md">
                  <i class="fas fa-image text-zen-green-600 text-xl"></i>
                </div>
                <div class="text-center">
                  <h4 class="text-gray-900 font-semibold text-lg mb-1">竖屏照片</h4>
                  <p class="text-gray-500 text-sm">{{ portraitPhotos?.length || 0 }} 张作品</p>
                </div>
              </div>
              <div class="absolute top-3 right-3 w-6 h-6 rounded-full bg-zen-green-100 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <i class="fas fa-arrow-right text-zen-green-600 text-xs"></i>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  
    <!-- Photo Gallery Modal -->
    <div v-if="showPhotoGallery" class="fixed inset-0 z-50 flex items-center justify-center bg-zen-green-900/20 backdrop-blur-sm animate-fade-in" @click="closePhotoGallery">
      <div class="bg-white rounded-[2rem] shadow-2xl w-full max-w-5xl mx-4 overflow-hidden border border-zen-green-100 animate-scale-up" :class="currentPhotoType === 'portrait' ? 'max-h-[95vh]' : 'max-h-[90vh]'" @click.stop>
        <div class="bg-gradient-to-r from-zen-green-50 to-white px-6 py-5 flex justify-between items-center border-b border-zen-green-100 sticky top-0 z-10 backdrop-blur-md">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-zen-green-100 border border-zen-green-200 flex items-center justify-center text-zen-green-600 shadow-sm">
              <i class="fas fa-camera text-lg"></i>
            </div>
            <div>
              <h3 class="text-gray-900 text-lg font-semibold">{{ currentPhotoType === 'landscape' ? '横屏' : '竖屏' }}摄影作品集</h3>
              <p class="text-xs text-zen-green-600">{{ photos?.length || 0 }} 张作品</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button @click="showPhotoGallery = false; showPhotoOrientationSelector = true" class="text-gray-500 hover:text-zen-green-600 transition-all px-3 py-1.5 rounded-full hover:bg-zen-green-50 text-sm">
              <i class="fas fa-exchange-alt mr-1"></i>切换
            </button>
            <button @click="closePhotoGallery" class="text-gray-500 hover:text-zen-green-600 transition-all w-9 h-9 flex items-center justify-center rounded-full hover:bg-zen-green-50 hover:shadow-md">
              <i class="fas fa-times text-lg"></i>
            </button>
          </div>
        </div>
        <div class="p-6 bg-gradient-to-b from-white to-zen-green-50/30">
          <div class="relative flex items-center justify-center overflow-hidden rounded-2xl bg-zen-green-50/50 shadow-inner" :style="currentPhotoType === 'portrait' ? 'height: 80vh; max-height: 700px;' : 'height: 60vh;'">
            <button @click.stop="prevPhoto" class="absolute left-4 top-1/2 transform -translate-y-1/2 w-12 h-12 rounded-full bg-zen-green-600/60 text-white flex items-center justify-center hover:bg-zen-green-700/80 transition-all z-20 shadow-lg hover:shadow-xl hover:scale-110 active:scale-95">
              <i class="fas fa-chevron-left"></i>
            </button>

            <div class="relative w-full h-full flex items-center justify-center">
              <img
                v-for="(photo, index) in photos"
                v-show="currentPhotoIndex === index || prevPhotoIndex === index"
                :key="index"
                :src="photo"
                :alt="`摄影作品 ${index + 1}`"
                class="absolute max-w-full max-h-full object-contain cursor-zoom-in transition-opacity duration-700 hover:scale-105 rounded-lg"
                :class="currentPhotoIndex === index ? 'opacity-100' : 'opacity-0'"
                loading="eager"
                decoding="async"
                @click="zoomPhoto"
              >
            </div>

            <button @click.stop="nextPhoto" class="absolute right-4 top-1/2 transform -translate-y-1/2 w-12 h-12 rounded-full bg-zen-green-600/60 text-white flex items-center justify-center hover:bg-zen-green-700/80 transition-all z-20 shadow-lg hover:shadow-xl hover:scale-110 active:scale-95">
              <i class="fas fa-chevron-right"></i>
            </button>
          </div>
          <div class="mt-6 flex justify-center gap-3">
            <button
              v-for="(photo, index) in photos"
              :key="index"
              @click.stop="prevPhotoIndex = currentPhotoIndex; currentPhotoIndex = index"
              class="w-3 h-3 rounded-full transition-all duration-300 hover:scale-125"
              :class="currentPhotoIndex === index ? 'bg-zen-green-500 w-6 shadow-md shadow-zen-green-200' : 'bg-gray-300 hover:bg-zen-green-300'"
            ></button>
          </div>
          <div class="mt-4 flex justify-center items-center gap-3">
            <span class="text-sm text-gray-600 font-medium">第 {{ currentPhotoIndex + 1 }} 张</span>
            <span class="text-sm text-gray-600">|</span>
            <span class="text-sm text-gray-600">共 {{ photos?.length || 0 }} 张</span>
            <div class="flex items-center gap-2 ml-4">
              <button @click.stop="toggleAutoPlay" class="px-3 py-1.5 rounded-full text-xs font-medium transition-all" :class="isAutoPlaying ? 'bg-zen-green-100 text-zen-green-700' : 'bg-gray-100 text-gray-600 hover:bg-zen-green-50 hover:text-zen-green-600'">
                <i :class="isAutoPlaying ? 'fas fa-pause' : 'fas fa-play'" class="mr-1"></i>
                {{ isAutoPlaying ? '暂停' : '自动播放' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Video Modal -->
    <div v-if="showVideoModal" class="fixed inset-0 z-50 flex items-center justify-center bg-zen-green-900/20 backdrop-blur-sm" @click="showVideoModal = false">
      <div class="bg-white rounded-[2rem] shadow-2xl w-full max-w-md mx-4 overflow-hidden border border-zen-green-100" @click.stop>
        <div class="bg-white px-6 py-5 flex justify-between items-center border-b border-zen-green-100 sticky top-0 z-10 backdrop-blur-md bg-white/90">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-zen-green-50 border border-zen-green-100 flex items-center justify-center text-zen-green-700">
              <i class="fas fa-video text-lg"></i>
            </div>
            <h3 class="text-gray-900 text-lg font-semibold">视频作品集</h3>
          </div>
          <button @click="showVideoModal = false" class="text-gray-500 hover:text-gray-900 transition-colors w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-50">
            <i class="fas fa-times text-lg"></i>
          </button>
        </div>
        <div class="p-8 text-center">
          <div class="w-20 h-20 mx-auto mb-6 rounded-full bg-zen-green-50 flex items-center justify-center">
            <i class="fas fa-rocket text-4xl text-zen-green-500 animate-bounce"></i>
          </div>
          <h4 class="text-xl font-bold text-gray-800 mb-3">敬请期待</h4>
          <p class="text-gray-600 leading-relaxed mb-6">
            视频作品集功能正在筹备中<br>
            新功能即将上线，敬请期待~
          </p>
          <div class="flex items-center justify-center gap-2 text-sm text-zen-green-600">
            <i class="fas fa-clock"></i>
            <span>即将推出</span>
          </div>
        </div>
        <div class="px-6 pb-6">
          <button @click="showVideoModal = false" class="w-full py-3 bg-zen-green-600 hover:bg-zen-green-700 text-white font-medium rounded-xl shadow-lg shadow-zen-green-200 transition-all transform hover:-translate-y-0.5">
            知道了
          </button>
        </div>
      </div>
    </div>
    
    <!-- Writing Modal -->
    <div v-if="showWritingModal" class="fixed inset-0 z-50 flex items-center justify-center bg-zen-green-900/20 backdrop-blur-sm" @click="showWritingModal = false">
      <div class="bg-white rounded-[2rem] shadow-2xl w-full max-w-md mx-4 overflow-hidden border border-zen-green-100" @click.stop>
        <div class="bg-white px-6 py-5 flex justify-between items-center border-b border-zen-green-100 sticky top-0 z-10 backdrop-blur-md bg-white/90">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-zen-green-50 border border-zen-green-100 flex items-center justify-center text-zen-green-700">
              <i class="fas fa-pen-fancy text-lg"></i>
            </div>
            <h3 class="text-gray-900 text-lg font-semibold">随笔作品集</h3>
          </div>
          <button @click="showWritingModal = false" class="text-gray-500 hover:text-gray-900 transition-colors w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-50">
            <i class="fas fa-times text-lg"></i>
          </button>
        </div>
        <div class="p-8 text-center">
          <div class="w-20 h-20 mx-auto mb-6 rounded-full bg-zen-green-50 flex items-center justify-center">
            <i class="fas fa-rocket text-4xl text-zen-green-500 animate-bounce"></i>
          </div>
          <h4 class="text-xl font-bold text-gray-800 mb-3">敬请期待</h4>
          <p class="text-gray-600 leading-relaxed mb-6">
            随笔作品集功能正在筹备中<br>
            新功能即将上线，敬请期待~
          </p>
          <div class="flex items-center justify-center gap-2 text-sm text-zen-green-600">
            <i class="fas fa-clock"></i>
            <span>即将推出</span>
          </div>
        </div>
        <div class="px-6 pb-6">
          <button @click="showWritingModal = false" class="w-full py-3 bg-zen-green-600 hover:bg-zen-green-700 text-white font-medium rounded-xl shadow-lg shadow-zen-green-200 transition-all transform hover:-translate-y-0.5">
            知道了
          </button>
        </div>
      </div>
    </div>

    <!-- Document Detail Modal -->
    <div v-if="showDocumentModal" class="fixed inset-0 z-50 flex items-center justify-center bg-zen-green-900/20 backdrop-blur-sm" @click="showDocumentModal = false">
      <div class="bg-white rounded-[2rem] shadow-2xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden border border-zen-green-100" @click.stop>
        <div class="bg-white px-6 py-5 flex justify-between items-center border-b border-zen-green-100 sticky top-0 z-10 backdrop-blur-md bg-white/90">
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-10 h-10 rounded-full bg-zen-green-50 border border-zen-green-100 flex items-center justify-center text-zen-green-700">
              <i class="fas fa-file-alt text-lg"></i>
            </div>
            <h3 class="text-gray-900 text-lg font-semibold truncate">{{ currentDocumentType }} - {{ currentDocumentProject }}</h3>
          </div>
          <button @click="showDocumentModal = false" class="text-gray-500 hover:text-gray-900 transition-colors w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-50">
            <i class="fas fa-times text-lg"></i>
          </button>
        </div>
        <div class="p-8 overflow-y-auto max-h-[60vh]">
          <!-- 加载状态 -->
          <div v-if="isLoadingPrd" class="flex flex-col items-center justify-center py-12">
            <div class="w-12 h-12 border-4 border-zen-green-200 border-t-zen-green-600 rounded-full animate-spin mb-4"></div>
            <p class="text-gray-500">正在加载文档内容...</p>
          </div>
          <!-- PRD文档内容 -->
          <div v-else-if="prdContent" class="prose prose-lg max-w-none">
            <div class="text-gray-700 leading-relaxed text-sm bg-gray-50 p-6 rounded-xl" v-html="prdContent"></div>
          </div>
          <!-- 默认提示 -->
          <div v-else class="mt-8 text-center">
            <p class="text-gray-500 text-sm">文档内容正在整理中，敬请期待完整版本</p>
          </div>
        </div>
        <div class="px-6 pb-6 border-t border-zen-green-100 pt-4">
          <button @click="showDocumentModal = false" class="w-full py-3 bg-zen-green-600 hover:bg-zen-green-700 text-white font-medium rounded-xl shadow-lg shadow-zen-green-200 transition-all transform hover:-translate-y-0.5">
            知道了
          </button>
        </div>
      </div>
    </div>

    <!-- 侧边悬浮按钮 -->
    <div class="fixed right-6 bottom-6 z-40">
      <button
        @click="openAiAssistant"
        class="w-14 h-14 rounded-full bg-gradient-to-br from-zen-green-500 to-zen-green-600 text-white shadow-lg hover:shadow-2xl hover:shadow-zen-green-200/50 transition-all transform hover:scale-110 flex items-center justify-center group"
        title="AI 助手"
      >
        <i class="fas fa-robot text-xl group-hover:animate-bounce"></i>
      </button>
    </div>

    <AiAssistant
      ref="aiAssistantRef"
      :resume-data="data"
      :visitor-form-endpoint="visitorFormEndpoint"
      :is-visitor-form-configured="isVisitorFormConfigured"
      @open-project="openProjectDetail"
    />

    <WordCloud ref="wordCloudRef" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useResumeData } from './data';
import AddModal from './components/AddModal.vue';
import AiAssistant from './components/AiAssistant.vue';
import WordCloud from './components/WordCloud.vue';


const { data, addItem, updateItem, deleteItem } = useResumeData();

const normalizedSkills = computed(() => {
  const raw = Array.isArray(data.skills) ? data.skills : [];
  return raw.map((skill) => {
    if (typeof skill === 'string') return { name: skill, level: 80 };
    const name = typeof skill?.name === 'string' ? skill.name : '';
    const parsed = Number(skill?.level);
    const level = Number.isFinite(parsed) ? Math.max(0, Math.min(100, parsed)) : 80;
    return { ...skill, name, level };
  });
});

// 权限控制
const isEditMode = ref(false);

const aiAssistantRef = ref(null);

const openAiAssistant = () => {
  aiAssistantRef.value?.open?.();
};

const wordCloudRef = ref(null);

const openWordCloud = () => {
  wordCloudRef.value?.expandWordCloud?.();
};

const visitorFormEndpoint = (import.meta.env.VITE_CONTACT_ENDPOINT || import.meta.env.VITE_FORMSPREE_ENDPOINT || '').trim();
const isVisitorFormConfigured = computed(() => {
  if (!visitorFormEndpoint) return false;
  if (visitorFormEndpoint.includes('yourFormId')) return false;
  return true;
});
const visitorName = ref('');
const visitorEmail = ref('');
const visitorSubject = ref('');
const visitorMessage = ref('');
const visitorHoneypot = ref('');
const visitorSubmitting = ref(false);
const visitorStatus = ref('');
const visitorErrorText = ref('');
const visitorPageOpenAt = Date.now();

// 浏览次数统计：真实 PV，来自服务端 /api/visit（自建服务器持久化，Vercel 转发）。
// 接口不可用时不显示数字，而不是退回假数据。
const visitorCount = ref(0);

const updateVisitorCount = async () => {
  // 清掉旧版 localStorage 假计数，避免误导
  localStorage.removeItem('visitor_count');
  try {
    const r = await fetch('/api/visit', { method: 'POST' });
    if (!r.ok) return;
    const j = await r.json();
    if (typeof j.pv === 'number' && j.pv > 0 && !j.unavailable) {
      visitorCount.value = j.pv;
    }
  } catch { /* 统计不可用，安静地隐藏 */ }
};

const submitVisitorForm = async () => {
  if (visitorSubmitting.value) return;
  if (visitorHoneypot.value) return;

  visitorErrorText.value = '';

  if (!isVisitorFormConfigured.value) {
    visitorStatus.value = 'error';
    visitorErrorText.value = '未配置表单服务（VITE_FORMSPREE_ENDPOINT）。';
    return;
  }

  const now = Date.now();
  if (now - visitorPageOpenAt < 800) {
    visitorStatus.value = 'error';
    visitorErrorText.value = '发送过快，请稍等片刻再提交。';
    return;
  }

  const lastSubmitAt = Number(localStorage.getItem('visitor_form_last_submit_at') || 0);
  if (Number.isFinite(lastSubmitAt) && lastSubmitAt > 0 && now - lastSubmitAt < 20000) {
    visitorStatus.value = 'error';
    visitorErrorText.value = '提交过于频繁，请稍后再试。';
    return;
  }

  const name = visitorName.value.trim();
  const email = visitorEmail.value.trim();
  const subject = visitorSubject.value.trim();
  const message = visitorMessage.value.trim();

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!name) {
    visitorStatus.value = 'error';
    visitorErrorText.value = '请填写姓名。';
    return;
  }
  if (!emailOk) {
    visitorStatus.value = 'error';
    visitorErrorText.value = '请填写正确的邮箱。';
    return;
  }
  if (!subject) {
    visitorStatus.value = 'error';
    visitorErrorText.value = '请填写主题。';
    return;
  }
  if (!message) {
    visitorStatus.value = 'error';
    visitorErrorText.value = '请填写留言内容。';
    return;
  }
  if (message.length > 2000) {
    visitorStatus.value = 'error';
    visitorErrorText.value = '留言内容过长，请控制在 2000 字以内。';
    return;
  }

  visitorSubmitting.value = true;
  visitorStatus.value = '';

  try {
    const isFormspree = /(^|\.)formspree\.io$/i.test(visitorFormEndpoint);

    const res = await fetch(visitorFormEndpoint, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        ...(isFormspree ? {} : { 'Content-Type': 'application/json' })
      },
      body: isFormspree
        ? (() => {
            const formData = new FormData();
            formData.append('name', name);
            formData.append('email', email);
            formData.append('subject', subject);
            formData.append('message', message);
            formData.append('_gotcha', visitorHoneypot.value);
            return formData;
          })()
        : JSON.stringify({ name, email, subject, message, _gotcha: visitorHoneypot.value })
    });

    if (!res.ok) {
      visitorStatus.value = 'error';
      visitorErrorText.value = '发送失败，请稍后重试。';
      return;
    }

    visitorStatus.value = 'success';
    visitorName.value = '';
    visitorEmail.value = '';
    visitorSubject.value = '';
    visitorMessage.value = '';
    visitorHoneypot.value = '';
    localStorage.setItem('visitor_form_last_submit_at', String(Date.now()));
  } catch (e) {
    visitorStatus.value = 'error';
    visitorErrorText.value = '发送失败，请检查网络后重试。';
  } finally {
    visitorSubmitting.value = false;
  }
};

const navLinks = [
  { text: '首页', href: '#home' },
  { text: '关于', href: '#about' },
  { text: '项目', href: '#projects' },
  { text: '作品集', href: '#portfolio' },
  { text: '技能', href: '#skills' },
  { text: '兴趣', href: '#interests' },
  { text: '联系', href: '#contact' },
];



const isModalOpen = ref(false);
const showResumeDropdown = ref(false);
const currentSection = ref('');
const editData = ref(null);
const deleteMode = ref(null);
const editIndex = ref(null);

// Project detail modal
const showProjectDetail = ref(false);
const currentProject = ref(null);

// Photo gallery modal
const showPhotoGallery = ref(false);
const showPhotoOrientationSelector = ref(false);
const showVideoModal = ref(false);
const showWritingModal = ref(false);
const currentPhotoType = ref('');

const photos = ref([
  "/横屏照片集/1.jpg", "/横屏照片集/2.jpg", "/横屏照片集/3.jpg", "/横屏照片集/4.jpg", "/横屏照片集/5.jpg",
  "/横屏照片集/6.jpg", "/横屏照片集/7.jpg", "/横屏照片集/8.jpg", "/横屏照片集/9.jpg", "/横屏照片集/10.jpg",
  "/横屏照片集/11.jpg"
]);

const landscapePhotos = ref([
  "/横屏照片集/1.jpg", "/横屏照片集/2.jpg", "/横屏照片集/3.jpg", "/横屏照片集/4.jpg", "/横屏照片集/5.jpg",
  "/横屏照片集/6.jpg", "/横屏照片集/7.jpg", "/横屏照片集/8.jpg", "/横屏照片集/9.jpg", "/横屏照片集/10.jpg",
  "/横屏照片集/11.jpg", "/横屏照片集/12.jpg", "/横屏照片集/13.jpg", "/横屏照片集/14.jpg", "/横屏照片集/15.jpg",
  "/横屏照片集/16.jpg", "/横屏照片集/17.jpg", "/横屏照片集/18.jpg", "/横屏照片集/19.jpg", "/横屏照片集/20.jpg",
  "/横屏照片集/21.jpg", "/横屏照片集/22.jpg", "/横屏照片集/23.jpg", "/横屏照片集/24.jpg", "/横屏照片集/25.jpg",
  "/横屏照片集/26.jpg", "/横屏照片集/27.jpg", "/横屏照片集/28.jpg", "/横屏照片集/29.jpg", "/横屏照片集/30.jpg",
  "/横屏照片集/31.jpg", "/横屏照片集/32.jpg", "/横屏照片集/33.jpg", "/横屏照片集/34.jpg", "/横屏照片集/35.jpg",
  "/横屏照片集/36.jpg", "/横屏照片集/37.jpg", "/横屏照片集/38.jpg", "/横屏照片集/39.jpg", "/横屏照片集/40.jpg",
  "/横屏照片集/41.jpg", "/横屏照片集/42.jpg", "/横屏照片集/43.jpg", "/横屏照片集/44.jpg", "/横屏照片集/45.jpg",
  "/横屏照片集/46.jpg", "/横屏照片集/47.jpg", "/横屏照片集/48.jpg", "/横屏照片集/49.jpg", "/横屏照片集/50.jpg",
  "/横屏照片集/51.jpg", "/横屏照片集/52.jpg", "/横屏照片集/53.jpg", "/横屏照片集/54.jpg", "/横屏照片集/55.jpg",
  "/横屏照片集/56.jpg", "/横屏照片集/57.jpg", "/横屏照片集/58.jpg", "/横屏照片集/59.jpg", "/横屏照片集/60.jpg",
  "/横屏照片集/61.jpg", "/横屏照片集/62.jpg"
]);

const portraitPhotos = ref([
  "/竖屏照片集/1.jpg", "/竖屏照片集/2.jpg", "/竖屏照片集/3.jpg", "/竖屏照片集/4.jpg", "/竖屏照片集/5.jpg",
  "/竖屏照片集/6.jpg", "/竖屏照片集/7.jpg", "/竖屏照片集/8.jpg", "/竖屏照片集/9.jpg", "/竖屏照片集/10.jpg",
  "/竖屏照片集/11.jpg", "/竖屏照片集/12.jpg", "/竖屏照片集/13.jpg", "/竖屏照片集/14.jpg", "/竖屏照片集/15.jpg",
  "/竖屏照片集/16.jpg", "/竖屏照片集/17.jpg", "/竖屏照片集/18.jpg", "/竖屏照片集/19.jpg", "/竖屏照片集/20.jpg"
]);

const currentPhotoIndex = ref(0);
const prevPhotoIndex = ref(-1);
let photoTimer = null;

const startPhotoCarousel = () => {
  photoTimer = setInterval(() => {
    prevPhotoIndex.value = currentPhotoIndex.value;
    currentPhotoIndex.value = (currentPhotoIndex.value + 1) % (photos.value?.length || 1);
  }, 3000);
};

const stopPhotoCarousel = () => {
  if (photoTimer) {
    clearInterval(photoTimer);
    photoTimer = null;
  }
};

const openPhotoGallery = () => {
  showPhotoOrientationSelector.value = true;
  prevPhotoIndex.value = -1;
};

const selectPhotoOrientation = (orientation) => {
  currentPhotoType.value = orientation;
  if (orientation === 'landscape') {
    photos.value = landscapePhotos.value;
  } else {
    photos.value = portraitPhotos.value;
  }
  currentPhotoIndex.value = 0;
  prevPhotoIndex.value = -1;
  showPhotoOrientationSelector.value = false;
  showPhotoGallery.value = true;
};

const closePhotoOrientationSelector = () => {
  showPhotoOrientationSelector.value = false;
};

const closePhotoGallery = () => {
  showPhotoGallery.value = false;
  showPhotoOrientationSelector.value = false;
  stopPhotoCarousel();
  isAutoPlaying.value = false;
};

const openVideoGallery = () => {
  // 显示友好的提示弹窗
  showVideoModal.value = true;
};

const openWritingGallery = () => {
  // 显示友好的提示弹窗
  showWritingModal.value = true;
};

// Document modal
const showDocumentModal = ref(false);
const currentDocumentType = ref('');
const currentDocumentProject = ref('');
const prdContent = ref('');
const isLoadingPrd = ref(false);

// 文档按钮占位提示（旧文档内容已清除，新文档上线前仅提示）
const openDocPlaceholder = (type) => {
  currentDocumentType.value = type;
  currentDocumentProject.value = '项目案例';
  prdContent.value = '';
  showDocumentModal.value = true;
};

// 作品集横向滑动
const portfolioTrack = ref(null);
const portfolioActive = ref(0);

const onPortfolioScroll = () => {
  const el = portfolioTrack.value;
  if (!el) return;
  const card = el.querySelector('[data-portfolio-card]');
  const step = card ? card.offsetWidth + 24 : 320;
  portfolioActive.value = Math.min(
    (data.portfolio?.length || 1) - 1,
    Math.max(0, Math.round(el.scrollLeft / step))
  );
};

const scrollToPortfolio = (index) => {
  const el = portfolioTrack.value;
  if (!el || !el.children[index]) return;
  const card = el.children[index];
  el.scrollTo({ left: card.offsetLeft - el.offsetLeft, behavior: 'smooth' });
};

const nextPhoto = () => {
  prevPhotoIndex.value = currentPhotoIndex.value;
  currentPhotoIndex.value = (currentPhotoIndex.value + 1) % (photos.value?.length || 1);
};

const prevPhoto = () => {
  prevPhotoIndex.value = currentPhotoIndex.value;
  currentPhotoIndex.value = (currentPhotoIndex.value - 1 + (photos.value?.length || 1)) % (photos.value?.length || 1);
};

const isAutoPlaying = ref(false);

const zoomPhoto = () => {
  const img = document.querySelector('.cursor-zoom-in');
  if (img) {
    img.classList.toggle('scale-150');
    img.classList.toggle('transition-transform');
    img.classList.toggle('duration-300');
  }
};

const toggleAutoPlay = () => {
  isAutoPlaying.value = !isAutoPlaying.value;
  if (isAutoPlaying.value) {
    startPhotoCarousel();
  } else {
    stopPhotoCarousel();
  }
};



// Carousel Logic
const currentAvatarIndex = ref(0);
const avatarList = computed(() => data.profile.avatarList || [data.profile.avatar]);
const currentAvatarSrc = computed(() => {
  const list = avatarList.value;
  const idx = currentAvatarIndex.value;
  if (!Array.isArray(list) || list.length === 0) return '';
  return list[idx] || list[0];
});
let timer = null;

const preloadImages = (urls) => {
  if (!Array.isArray(urls) || urls.length === 0) return Promise.resolve();
  return Promise.all(
    urls.map(
      (url) =>
        new Promise((resolve) => {
          const img = new Image();
          img.onload = () => resolve(true);
          img.onerror = () => resolve(false);
          img.src = url;
        })
    )
  );
};

const startCarousel = () => {
  if (avatarList?.value?.length > 1) {
    timer = setInterval(() => {
      currentAvatarIndex.value = (currentAvatarIndex.value + 1) % (avatarList?.value?.length || 1);
    }, 3000);
  }
};

onMounted(async () => {
  await preloadImages(avatarList.value);
  startCarousel();
  updateVisitorCount();

  // 检查URL参数
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('mode') === 'edit') {
    isEditMode.value = true;
  }
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});

// ... rest of the script

const schemas = {
  education: {
    school: { label: '学校名称', type: 'text' },
    degree: { label: '学位', type: 'text' },
    major: { label: '专业', type: 'text' },
    period: { label: '时间段', type: 'text' },
    details: { label: '详细描述', type: 'textarea' }
  },
  work: {
    company: { label: '公司名称', type: 'text' },
    role: { label: '职位', type: 'text' },
    period: { label: '时间段', type: 'text' },
    description: { label: '工作描述', type: 'textarea' }
  },
  project: {
    title: { label: '项目名称', type: 'text' },
    role: { label: '担任角色', type: 'text' },
    period: { label: '时间段', type: 'text' },
    description: { label: '项目描述', type: 'textarea' }
  },
  skill: {
    name: { label: '技能名称', type: 'text' },
    level: { label: '熟练度(0-100)', type: 'number' }
  },
  certificate: {
    name: { label: '证书名称', type: 'text' },
    image: { label: '证书图片', type: 'file' }
  },
  profile: {
    name: { label: '姓名', type: 'text' },
    title: { label: '职位/标语', type: 'text' },
    bio: { label: '简介', type: 'textarea' },
    email: { label: '邮箱', type: 'text' },
    phone: { label: '电话', type: 'text' },
    location: { label: '所在地', type: 'text' },
    avatar: { label: '头像路径', type: 'text' }
  }
};

const modalTitle = computed(() => {
  const titles = {
    education: '添加教育经历',
    work: '添加工作经历',
    project: '添加项目',
    skill: '添加技能',
    certificate: '添加证书',
    profile: '编辑个人信息'
  };
  return titles[currentSection.value] || '添加内容';
});

const currentSchema = computed(() => schemas[currentSection.value] || {});

const openAddModal = (section, initialData = null) => {
  currentSection.value = section;
  editData.value = initialData || (section === 'profile' ? data.profile : null);
  editIndex.value = null;
  isModalOpen.value = true;
};

const openEditModal = (section, item, index) => {
  currentSection.value = section;
  if (section === 'skill') {
    if (typeof item === 'string') {
      editData.value = { name: item, level: 80 };
    } else {
      editData.value = { name: item?.name || '', level: item?.level ?? 80 };
    }
  } else if (section === 'certificate') {
    editData.value = { ...item };
  }
  editIndex.value = index;
  isModalOpen.value = true;
};

const toggleDeleteMode = (section) => {
  if (deleteMode.value === section) {
    deleteMode.value = null;
  } else {
    deleteMode.value = section;
  }
};

const openProjectDetail = (project) => {
  currentProject.value = project;
  showProjectDetail.value = true;
};



const handleSave = (formData) => {
  if (currentSection.value === 'profile') {
    updateItem('profile', 0, formData);
  } else if (currentSection.value === 'skill') {
    const parsed = Number(formData.level);
    const level = Number.isFinite(parsed) ? Math.max(0, Math.min(100, parsed)) : 80;
    // 保留原有 description（悬浮描述），编辑弹窗只改名称与等级
    const base = editIndex.value !== null ? (data.skills[editIndex.value] || {}) : {};
    const skillData = { ...base, name: formData.name, level };
    if (editIndex.value !== null) {
      const updatedSkills = [...data.skills];
      updatedSkills[editIndex.value] = skillData;
      updateItem('skills', 0, updatedSkills);
    } else {
      addItem('skills', skillData);
    }
  } else if (currentSection.value === 'certificate') {
    if (editIndex.value !== null) {
      const updatedCert = {
        ...data.certificates[editIndex.value],
        name: formData.name,
        image: formData.image || ''
      };
      const updatedCerts = [...data.certificates];
      updatedCerts[editIndex.value] = updatedCert;
      updateItem('certificates', 0, updatedCerts);
    } else {
      const certData = {
        id: Date.now(),
        name: formData.name,
        image: formData.image || ''
      };
      addItem('certificates', certData);
    }
  } else if (currentSection.value === 'project') {
    addItem('projects', formData);
  } else if (currentSection.value === 'education') {
    addItem('education', formData);
  } else if (currentSection.value === 'work') {
    addItem('work', formData);
  }
};

const showCertificatePopup = ref(false);
const currentCertificate = ref(null);
const popupPosition = ref({ x: 0, y: 0 });
const showCertificateZoom = ref(false);
const zoomCertificate = ref(null);
let certificateHideTimer = null;

const showTranscriptPreview = ref(false);
const showTranscriptZoom = ref(false);
const transcriptImage = '/成绩单.jpg';

const showCertificateImage = (cert, event) => {
  console.log('显示证书:', cert);
  if (certificateHideTimer) {
    clearTimeout(certificateHideTimer);
    certificateHideTimer = null;
  }
  currentCertificate.value = cert;
  showCertificatePopup.value = true;
  
  if (event) {
    popupPosition.value = {
      x: event.clientX + 20,
      y: event.clientY + 20
    };
  }
};

const scheduleHideCertificateImage = () => {
  if (certificateHideTimer) clearTimeout(certificateHideTimer);
  certificateHideTimer = setTimeout(() => {
    hideCertificateImage();
  }, 150);
};

const cancelHideCertificateImage = () => {
  if (certificateHideTimer) {
    clearTimeout(certificateHideTimer);
    certificateHideTimer = null;
  }
};

const hideCertificateImage = () => {
  if (certificateHideTimer) {
    clearTimeout(certificateHideTimer);
    certificateHideTimer = null;
  }
  showCertificatePopup.value = false;
  currentCertificate.value = null;
};

const openCertificateZoom = (cert) => {
  if (!cert || !cert.image) return;
  zoomCertificate.value = cert;
  showCertificateZoom.value = true;
};

const closeCertificateZoom = () => {
  showCertificateZoom.value = false;
  zoomCertificate.value = null;
};



const openTranscriptPreview = () => {
  showTranscriptPreview.value = true;
};

const closeTranscriptPreview = () => {
  showTranscriptPreview.value = false;
  showTranscriptZoom.value = false;
};

const openTranscriptZoom = () => {
  showTranscriptPreview.value = false;
  showTranscriptZoom.value = true;
};

const closeTranscriptZoom = () => {
  showTranscriptZoom.value = false;
};

const panTranscriptOnMove = (event) => {
  const el = event.currentTarget;
  if (!el) return;
  const rect = el.getBoundingClientRect();
  const x = rect.width ? (event.clientX - rect.left) / rect.width : 0;
  const y = rect.height ? (event.clientY - rect.top) / rect.height : 0;
  const maxLeft = el.scrollWidth - el.clientWidth;
  const maxTop = el.scrollHeight - el.clientHeight;
  if (maxLeft > 0) el.scrollLeft = maxLeft * Math.min(Math.max(x, 0), 1);
  if (maxTop > 0) el.scrollTop = maxTop * Math.min(Math.max(y, 0), 1);
};

</script><style>
html {
  scroll-behavior: smooth;
}
.font-sans {
  font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}

/* Fade Animation for Carousel */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 1s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Slow Pulse Animation for AI Assistant */
@keyframes pulse-slow {
  0%, 100% {
    box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
  }
  50% {
    box-shadow: 0 4px 6px -1px rgb(16 185 129 / 0.15), 0 2px 4px -2px rgb(16 185 129 / 0.1);
  }
}

.animate-pulse-slow {
  animation: pulse-slow 3s ease-in-out infinite;
}

.animate-pulse-slow:hover {
  animation: none;
}

/* 作品集横向滑动：隐藏滚动条 */
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

/* 技能标签动画效果 */
@keyframes skill-enter {
  0% {
    opacity: 0;
    transform: translateY(20px) scale(0.9);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes skill-click {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(0.95);
  }
  100% {
    transform: scale(1);
  }
}

/* 技能标签样式 */
.group {
  animation: skill-enter 0.5s ease-out forwards;
  position: relative;
  overflow: hidden;
}

/* 技能标签进入动画延迟 */
.group {
  animation: skill-enter 0.5s ease-out forwards;
}
</style>

