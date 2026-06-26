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
          { text: '踩坑复盘', items: [
            { text: '物联网设备掉线排查', link: '/物联网设备掉线排查：MySQL慢查询引发的连锁反应' },
            { text: 'MQTT 数据丢失排查', link: '/MQTT数据丢失排查：400台设备的ClientID冲突' },
            { text: '数据查询 Agent 踩坑记', link: '/从零搭建数据查询Agent：LangChain踩坑到自研框架' },
            { text: 'JSON 设备数据入库', link: '/JSON设备数据入库：从一把梭到表结构拆分' },
            { text: '接口性能优化', link: '/接口性能优化：从2秒到200毫秒' }
          ]},
          { text: 'AI 探索', items: [
            { text: 'Qwen 3 本地部署与 RAG', link: '/Qwen 3 本地部署与 RAG 实践' },
            { text: '生成式AI学习笔记', link: '/边学边做：生成式AI应用学习笔记' }
          ]},
          { text: '学习笔记', items: [
            { text: 'Docker', link: '/docker' },
            { text: 'Nginx', link: '/Nginx' },
            { text: 'MySQL 基础', link: '/MySql' },
            { text: 'MySQL 索引', link: '/mysql索引' },
            { text: 'MySQL 日志', link: '/mysql日志' },
            { text: 'MySQL 锁', link: '/mysql锁' },
            { text: 'DRF', link: '/DRF' },
            { text: 'PyTorch', link: '/pytorch' },
            { text: 'STM32 学习笔记', link: '/Stm32学习笔记' }
          ]}
        ]
      }
    ],
    sidebar: [
      {
        text: '🔧 踩坑复盘',
        items: [
          { text: '物联网设备掉线排查', link: '/物联网设备掉线排查：MySQL慢查询引发的连锁反应' },
          { text: 'MQTT 数据丢失排查', link: '/MQTT数据丢失排查：400台设备的ClientID冲突' },
          { text: '数据查询 Agent 踩坑记', link: '/从零搭建数据查询Agent：LangChain踩坑到自研框架' },
          { text: 'JSON 设备数据入库', link: '/JSON设备数据入库：从一把梭到表结构拆分' },
          { text: '接口性能优化', link: '/接口性能优化：从2秒到200毫秒' }
        ]
      },
      {
        text: '🤖 AI 探索',
        items: [
          { text: 'Qwen 3 本地部署与 RAG', link: '/Qwen 3 本地部署与 RAG 实践' },
          { text: '生成式AI学习笔记', link: '/边学边做：生成式AI应用学习笔记' }
        ]
      },
      {
        text: '📚 学习笔记',
        collapsed: false,
        items: [
          {
            text: '运维与部署',
            collapsed: true,
            items: [
              { text: 'Docker', link: '/docker' },
              { text: 'Nginx', link: '/Nginx' },
              {
                text: 'MySQL',
                collapsed: true,
                items: [
                  { text: '基础', link: '/MySql' },
                  { text: '索引', link: '/mysql索引' },
                  { text: '日志', link: '/mysql日志' },
                  { text: '锁', link: '/mysql锁' }
                ]
              }
            ]
          },
          {
            text: '开发框架',
            collapsed: true,
            items: [
              { text: 'DRF', link: '/DRF' },
              { text: 'PyTorch', link: '/pytorch' }
            ]
          },
          {
            text: '计算机基础',
            collapsed: true,
            items: [
              { text: '计算机网络', link: '/计算机网络' },
              { text: '多进程与多线程', link: '/多进程，多线程' },
              { text: '找单独的数', link: '/找单独的数' }
            ]
          },
          {
            text: '嵌入式',
            collapsed: true,
            items: [
              { text: 'STM32 学习笔记', link: '/Stm32学习笔记' }
            ]
          },
          {
            text: '其他',
            collapsed: true,
            items: [
              { text: '设计模式', link: '/设计模式' }
            ]
          }
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
