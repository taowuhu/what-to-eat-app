import { defineConfig } from '@tarojs/cli';
import path from 'path';

export default defineConfig(async (merge) => {
  const baseConfig = {
    projectName: 'weapp',
    date: '2026-9-29',
    designWidth: 750,
    deviceRatio: {
      640: 2.34 / 2,
      750: 1,
      375: 2,
      828: 1.81 / 2,
    },
    sourceRoot: 'src',
    outputRoot: 'dist',
    plugins: ['@tarojs/plugin-framework-react'],
    defineConstants: {},
    copy: {
      patterns: [],
      options: {},
    },
    framework: 'react',
    compiler: 'vite',
    alias: {
      '@': path.resolve(__dirname, '..', 'src'),
      '@shared-core': path.resolve(__dirname, '..', '..', '..', 'src'),
    },
    mini: {
      postcss: {
        pxtransform: {
          enable: true,
          config: {},
        },
        url: {
          enable: true,
          config: {
            limit: 1024,
          },
        },
      },
    },
  };

  const devFn = require('./dev');
  const prodFn = require('./prod');

  if (process.env.NODE_ENV === 'development') {
    const devConfig = typeof devFn === 'function' ? devFn(merge) : devFn;
    return merge({}, baseConfig, devConfig);
  }
  const prodConfig = typeof prodFn === 'function' ? prodFn(merge) : prodFn;
  return merge({}, baseConfig, prodConfig);
});
