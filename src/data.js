import { reactive, watch } from 'vue';

const defaultData = {
  profile: {
    name: "郑筠",
    title: "软件工程 | 产品实习生",
    bio: "具备良好的产品思维与技术背景，能以技术视角理解产品落地逻辑，独立完成从「用户痛点调研→需求拆解→原型设计→开发跟进→功能验证」的全流程产品工作。主导 2 个健康领域产品从 0 到 1 的原型输出与需求落地，通过用户访谈、数据分析推动核心功能迭代，实现用户满意度 88%、操作流畅度提升 60% 的业务成果。逻辑清晰，注重用户体验与商业价值的平衡，同时主动学习 AIGC 在产品设计中的应用，能快速适配不同业务场景的产品迭代需求。",
    email: "zhengyun_0629@qq.com",
    phone: "2746747178",
    location: "深圳、杭州、苏州、宁波",
    avatar: "/头像轮播图/1.jpg",
    avatarList: ["/头像轮播图/1.jpg", "/头像轮播图/2.jpg", "/头像轮播图/3.jpg", "/头像轮播图/4.jpg", "/头像轮播图/5.jpg", "/头像轮播图/6.jpg", "/头像轮播图/7.jpg", "/头像轮播图/8.jpg", "/头像轮播图/9.jpg"]
  },
  education: [
    {
      id: 1,
      school: "湖南理工大学",
      degree: "本科",
      major: "软件工程",
      period: "2022/09-2026/06",
      details: "班级排名: 3/42\n主修课程: 软件项目管理(89)、软件工程、后端技术开发(92)、软件体系结构(91)、数据库原理(SQLServer)、大型数据库应用(Oracle)、软件设计模式、数据结构、软件测试技术、系统分析与设计 (95)"
    }
  ],
  work: [
    {
      id: 1,
      company: "深圳量云能源网络科技有限公司",
      role: "产品实习生",
      period: "2026/01-至今",
      description: "1.为保障能源电力交易数据高效对接，协助产品经理完成 <strong>SaaS 平台</strong> 数据源收集与模板整理，学习并理解部门产品业务，<strong>熟悉前端页面交互与数据流转流程</strong>，参与跨部门沟通，保障数据对接流程顺畅。\n" +
          "2.为支撑 AI 功能赋能产品规划，调研主流 AI 技术与竞品应用，输出调研分析报告与业务流程图，为产品功能规划与技术可行性评估提供参考。\n" +
          "3.为验证 AI 方案可行性，撰写产品方案，<strong>通过 vibe coding 开发前端交互原型演示demo</strong>，对齐技术实现逻辑，辅助方案沟通与评审，提升方案说服力与落地性。\n" +
          "4.为探索智能化方向，学习 <strong>AI 智能体</strong> 技术概念，结合 <strong>前端业务场景与代码实现特点</strong>，探索其在能源电力交易场景的潜在应用方向，输出智能化场景建议。"
    }
  ],
  projects: [
    {
      id: 1,
      title: "项目案例更新中",
      role: "产品实践",
      period: "即将上线",
      description: "新的项目案例正在整理与撰写中，本栏目即将更新为最新项目内容，敬请期待。",
      image: ""
    },
    {
      id: 2,
      title: "更多项目筹备中",
      role: "产品实践",
      period: "敬请期待",
      description: "第二个项目内容筹备中。欢迎通过页面底部的留言表单或 AI 助手与我交流。",
      image: ""
    }
  ],
  certificates: [
    { id: 1, name: "软件设计师（软考中级）", image: "/软件设计师（软考中级).jpg" },
    { id: 2, name: "CET-6", image: "/CET-6(460).png" },
    { id: 3, name: "CET-4", image: "/CET-4(491).png" },
    { id: 4, name: "驾驶证", image: "" },
    { id: 5, name: "普通话二甲", image: "/普通话证书.png" }
  ],
  skills: [
    { name: "vibe coding", level: 80 },
    { name: "Cursor/TRAE", level: 80 },
    { name: "Figma/Axure", level: 75 },
    { name: "Processon/Xmind/Visio", level: 85 },
    { name: "Excel/PPT/Word", level: 80 },
    { name: "Vue3/HTML/CSS/JS", level: 75 },
    { name: "Java/Spring Boot", level: 85 },
    { name: "敏捷开发(mvp迭代)", level: 80 },
    { name: "RAG", level: 75 },
    { name: "Prompt", level: 80 },
    { name: "Coze", level: 85 },
    { name: "AI Workflow", level: 80 },
    { name: "Agent", level: 80 },
    { name: "大模型应用", level: 80 },
    { name: "AIGC", level: 80 },
    { name: "Power BI", level: 80 },
    { name: "SQL", level: 80 },
    { name: "Git", level: 80 },
    { name: "SQL", level: 80 },
    { name: "PRD", level: 80 }

  ],
  portfolio: [
    { id: 1, title: "作品整理中", url: "", description: "作品案例正在整理，敬请期待完整版本" },
    { id: 2, title: "更多作品筹备中", url: "", description: "新作品持续更新，敬请期待" },
    { id: 3, title: "敬请期待", url: "", description: "完整作品集即将上线" },
    { id: 4, title: "持续更新中", url: "", description: "更多内容陆续呈现" }
  ],
  interests: [
    "摄影: 善于使用后期软件进行后期调色与构图优化，具备良好的审美能力与细节把控力，可辅助产品设计等内容。",
    "随笔写作: 善于用文字记录思考与观察，注重逻辑性与表达深度。能助力需求业务文档、复盘报告撰写，提升文档质量",
    "视频创作: 具备视频拍摄与剪辑能力，能够制作产品演示、教程解说等视频内容。持续积累视频作品，打造个人视频作品集。"
  ]
};

const STORAGE_KEY = 'resume_data';

export const useResumeData = () => {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('reset') === '1') {
    localStorage.removeItem(STORAGE_KEY);
  }

  const savedData = localStorage.getItem(STORAGE_KEY);
  let initialData = savedData ? JSON.parse(savedData) : defaultData;
  
  // Migration: Replace old placeholder avatar with new local one
  if (initialData.profile && initialData.profile.avatar && initialData.profile.avatar.includes('placeholder.com')) {
    initialData.profile.avatar = '/头像轮播图/1.jpg';
  }

  // 图片压缩后扩展名变了（png → jpg），但老访客的 localStorage 里还存着旧路径，
  // 不改写的话头像/证书会 404。这里统一做一次映射。
  const LEGACY_IMAGE_REWRITES = [
    [/^\/头像轮播图\/(\d+)\.png$/, (m, n) => `/头像轮播图/${n}.jpg`],
    [/^\/软件设计师（软考中级\)\.png$/, () => '/软件设计师（软考中级).jpg'],
    [/^\/成绩单\.png$/, () => '/成绩单.jpg'],
    [/^\/卡通肖像\.png$/, () => '/头像轮播图/1.jpg'],
  ];
  const migrateImage = (value) => {
    if (typeof value !== 'string') return value;
    for (const [pattern, build] of LEGACY_IMAGE_REWRITES) {
      if (pattern.test(value)) return value.replace(pattern, build);
    }
    return value;
  };

  if (initialData.profile) {
    initialData.profile.avatar = migrateImage(initialData.profile.avatar);
    if (Array.isArray(initialData.profile.avatarList)) {
      initialData.profile.avatarList = initialData.profile.avatarList.map(migrateImage);
    }
  }
  if (Array.isArray(initialData.certificates)) {
    initialData.certificates = initialData.certificates.map((cert) =>
      cert && typeof cert === 'object' && cert.image ? { ...cert, image: migrateImage(cert.image) } : cert
    );
  }
  if (Array.isArray(initialData.projects)) {
    initialData.projects = initialData.projects.map((project) =>
      project && typeof project === 'object' && project.image
        ? { ...project, image: migrateImage(project.image) }
        : project
    );
  }
  if (Array.isArray(initialData.certificates)) {
    const certImageMap = {
      "软件设计师（软考中级）": "/软件设计师（软考中级).jpg",
      "CET-6": "/CET-6(460).png",
      "CET-6(460)": "/CET-6(460).png",
      "CET-4": "/CET-4(491).png",
      "CET-4(491)": "/CET-4(491).png",
      "普通话二甲": "/普通话证书.png",
    };
    initialData.certificates = initialData.certificates.map((cert) => {
      if (!cert || typeof cert !== 'object') return cert;
      if (cert.image) return cert;
      const mapped = certImageMap[cert.name];
      return mapped ? { ...cert, image: mapped } : cert;
    });
  }
  if (Array.isArray(initialData.projects)) {
    initialData.projects = initialData.projects.map((project) => {
      if (!project || typeof project !== 'object') return project;
      const description = typeof project.description === 'string' ? project.description : '';
      if (!description) return project;
      const cleaned = description
        .replaceAll('<strong>', '')
        .replaceAll('</strong>', '')
        .replaceAll('&lt;strong&gt;', '')
        .replaceAll('&lt;/strong&gt;', '');
      return cleaned === description ? project : { ...project, description: cleaned };
    });
  }
  if (Array.isArray(initialData.skills)) {
    initialData.skills = initialData.skills.map((skill) => {
      if (typeof skill === 'string') {
        return { name: skill, level: 80 };
      }
      if (!skill || typeof skill !== 'object') return skill;
      const name = typeof skill.name === 'string' ? skill.name : '';
      const parsed = Number(skill.level);
      const level = Number.isFinite(parsed) ? Math.max(0, Math.min(100, parsed)) : 80;
      return { ...skill, name, level };
    });
    
    // Migration: Reorder skills to match default order
    const skillOrder = defaultData.skills.map(s => s.name);
    initialData.skills.sort((a, b) => {
      const indexA = skillOrder.indexOf(a.name);
      const indexB = skillOrder.indexOf(b.name);
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });
  }
  
  // Migration: Update email address
  if (initialData.profile && initialData.profile.email === 'zhengyun_job@163.com') {
    initialData.profile.email = defaultData.profile.email;
  }

  // 项目/作品内容改版：强制刷新为 data.js 里的最新默认值。
  // 老访客的 localStorage 里存着旧内容，不清掉的话改版对存量访客不生效。
  // dataVersion 与 defaultData.projects / portfolio 内容绑定，更新内容时一起递增。
  const PORTFOLIO_DATA_VERSION = 3;
  if (initialData.dataVersion !== PORTFOLIO_DATA_VERSION) {
    initialData.projects = JSON.parse(JSON.stringify(defaultData.projects));
    initialData.portfolio = JSON.parse(JSON.stringify(defaultData.portfolio));
    initialData.dataVersion = PORTFOLIO_DATA_VERSION;
  }

  const data = reactive(initialData);

  watch(data, (newData) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
  }, { deep: true });

  const addItem = (section, item) => {
    if (Array.isArray(data[section])) {
      // Ensure unique ID
      if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
         item.id = Date.now();
      }
      data[section].unshift(item);
    }
  };
  
  const updateItem = (section, index, newItem) => {
      if (Array.isArray(data[section])) {
          if (Array.isArray(newItem)) {
              // 替换整个数组
              data[section].splice(0, data[section].length, ...newItem);
          } else {
              // 替换单个元素
              data[section][index] = newItem;
          }
      } else if (section === 'profile') {
          Object.assign(data.profile, newItem);
      }
  }

  const deleteItem = (section, index) => {
    if (Array.isArray(data[section])) {
      data[section].splice(index, 1);
    }
  };

  return {
    data,
    addItem,
    updateItem,
    deleteItem
  };
};
