import { defineConfig } from 'vitepress'

export default defineConfig({
  title: '我的博客',
  description: '个人技术笔记与学习记录',
  lang: 'zh-CN',
  lastUpdated: true,
  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      { text: '全部文章', link: '/docker' }
    ],
    sidebar: [
      {
        text: '文章',
        items: [
          { text: 'Docker', link: '/docker' },
          { text: 'Nginx', link: '/Nginx' },
          { text: 'MySQL', link: '/MySql' },
          { text: 'DRF', link: '/DRF' },
          { text: 'PyTorch', link: '/pytorch' },
          { text: '计算机网络', link: '/计算机网络' },
          { text: '多进程与多线程', link: '/多进程，多线程' },
          { text: '找单独的数', link: '/找单独的数' },
          { text: 'Qwen 3 本地部署', link: '/本地部署 Qwen 3：用 Ollama 跑 RAG 和 AI 代理的折腾记录' },
          { text: '生成式AI学习笔记', link: '/边学边做：生成式AI应用学习笔记' }
        ]
      }
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/' }
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
    }
  }
})
