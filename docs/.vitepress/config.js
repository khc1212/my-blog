import { defineConfig } from 'vitepress'

export default defineConfig({
  base: '/my-blog/',
  title: '我的博客',
  description: '个人技术笔记与学习记录',
  lang: 'zh-CN',
  lastUpdated: true,
  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ['meta', { name: 'theme-color', content: '#667eea' }]
  ],
  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      {
        text: '文章',
        items: [
          { text: '运维部署', items: [
            { text: 'Docker', link: '/docker' },
            { text: 'Nginx', link: '/Nginx' },
            { text: 'MySQL', link: '/MySql' }
          ]},
          { text: '开发框架', items: [
            { text: 'DRF', link: '/DRF' },
            { text: 'PyTorch', link: '/pytorch' }
          ]},
          { text: 'AI 探索', items: [
            { text: 'Qwen 3 本地部署', link: '/本地部署 Qwen 3：用 Ollama 跑 RAG 和 AI 代理的折腾记录' },
            { text: '生成式AI学习笔记', link: '/边学边做：生成式AI应用学习笔记' }
          ]},
          { text: '嵌入式', items: [
            { text: 'STM32 学习笔记', link: '/Stm32学习笔记' }
          ]}
        ]
      }
    ],
    sidebar: [
      {
        text: '运维与部署',
        items: [
          { text: 'Docker', link: '/docker' },
          { text: 'Nginx', link: '/Nginx' },
          { text: 'MySQL', link: '/MySql' }
        ]
      },
      {
        text: '开发框架',
        items: [
          { text: 'DRF', link: '/DRF' },
          { text: 'PyTorch', link: '/pytorch' }
        ]
      },
      {
        text: 'AI 探索',
        items: [
          { text: 'Qwen 3 本地部署', link: '/本地部署 Qwen 3：用 Ollama 跑 RAG 和 AI 代理的折腾记录' },
          { text: '生成式AI学习笔记', link: '/边学边做：生成式AI应用学习笔记' }
        ]
      },
      {
        text: '计算机基础',
        items: [
          { text: '计算机网络', link: '/计算机网络' },
          { text: '多进程与多线程', link: '/多进程，多线程' },
          { text: '找单独的数', link: '/找单独的数' }
        ]
      },
      {
        text: '嵌入式',
        items: [
          { text: 'STM32 学习笔记', link: '/Stm32学习笔记' }
        ]
      },
      {
        text: '其他',
        items: [
          { text: '设计模式', link: '/设计模式' }
        ]
      }
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/khc1212/my-blog' }
    ],
    search: {
      provider: 'local'
    },
    lastUpdated: {
      text: '最后更新于'
    },
    docFooter: {
      prev: '上一篇',
      next: '下一篇'
    },
    outline: {
      label: '页面导航'
    },
    returnToTopLabel: '回到顶部',
    sidebarMenuLabel: '菜单',
    darkModeSwitchLabel: '主题',
    lightModeSwitchTitle: '切换到浅色模式',
    darkModeSwitchTitle: '切换到深色模式'
  }
})
