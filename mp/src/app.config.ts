// MP_PLUGIN=1 构建时启用微信同声传译插件（整句英文合成）
// 需先：注册小程序账号 → mp 后台「设置-第三方设置-插件管理」添加「同声传译」
const withPlugin = process.env.MP_PLUGIN === '1'

export default defineAppConfig({
  ...(withPlugin
    ? { plugins: { WechatSI: { version: '0.3.5', provider: 'wx069ba97219f66d99' } } }
    : {}),
  pages: [
    'pages/home/index',
    'pages/dict/index',
    'pages/scene/index',
    'pages/train/index',
    'pages/search/index',
    'pages/review/index',
    'pages/mine/index',
    'pages/form/index',
    'pages/scene-form/index',
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#12b886',
    navigationBarTitleText: 'PronFlow · 开口说英语',
    navigationBarTextStyle: 'white',
  },
  tabBar: {
    color: '#7a828a',
    selectedColor: '#0e9e73',
    backgroundColor: '#ffffff',
    borderStyle: 'white',
    list: [
      { pagePath: 'pages/home/index', text: '场景' },
      { pagePath: 'pages/dict/index', text: '词库' },
      { pagePath: 'pages/search/index', text: '搜索' },
      { pagePath: 'pages/review/index', text: '复习' },
      { pagePath: 'pages/mine/index', text: '我的' },
    ],
  },
})
