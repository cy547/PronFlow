import { defineConfig, type UserConfigExport } from '@tarojs/cli'
import path from 'node:path'
import devConfig from './dev'
import prodConfig from './prod'

export default defineConfig(async (merge) => {
  const baseConfig: UserConfigExport<'webpack5'> = {
    projectName: 'pronflow-mp',
    date: '2026-8-30',
    designWidth: 375,
    deviceRatio: { 640: 2.34 / 2, 750: 1, 375: 2, 828: 1.81 / 2 },
    sourceRoot: 'src',
    outputRoot: 'dist',
    plugins: [],
    defineConstants: {},
    copy: { patterns: [], options: {} },
    framework: 'react',
    compiler: { type: 'webpack5', prebundle: { enable: false } },
    cache: { enable: false },
    mini: {
      // 共享逻辑桥：用 taro babel 处理网页版工程的纯 TS 模块（单一数据源）
      webpackChain(chain) {
        const extSrc = path.resolve(__dirname, '..', 'src')
        chain.module
          .rule('shared-web-src')
          .test(/\.(ts|tsx)$/)
          .include.add(extSrc).end()
          .use('babel-shared')
          .loader('babel-loader')
          .options({ presets: [['taro', { framework: 'react', ts: true }]] })
      },
      postcss: {
        pxtransform: { enable: true, config: {} },
        cssModules: { enable: false },
      },
      optimizeMainPackage: { enable: true },
    },
    h5: {},
  }
  if (process.env.NODE_ENV === 'development') {
    return merge({}, baseConfig, devConfig)
  }
  return merge({}, baseConfig, prodConfig)
})
