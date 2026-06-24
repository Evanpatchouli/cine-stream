// rollup.config.js
import typescript from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import postcss from 'rollup-plugin-postcss';

const cssPlugin = postcss({
  modules: true,
  inject: true,
  minimize: true,
});

export default [
  // 1. 主入口 - JS
  {
    input: 'src/index.ts',
    output: [
      { file: 'dist/index.cjs', format: 'cjs', sourcemap: true },
      { file: 'dist/index.esm.js', format: 'esm', sourcemap: true },
    ],
    plugins: [
      cssPlugin,
      typescript({
        tsconfig: './tsconfig.json',
        declaration: true,
        declarationDir: './dist',
      }),
    ],
    external: ['react', 'react-dom'],
  },

  // 2. 子路径导出 - 常量
  {
    input: 'src/constants/index.ts',
    output: [
      { file: 'dist/constants/index.cjs', format: 'cjs', sourcemap: true },
      { file: 'dist/constants/index.js', format: 'esm', sourcemap: true },
    ],
    plugins: [
      typescript({
        tsconfig: './tsconfig.json',
        declaration: true,
        declarationDir: './dist',
      }),
    ],
  },

  // 3. 子路径导出 - 工具函数
  {
    input: 'src/utils/index.ts',
    output: [
      { file: 'dist/utils/index.cjs', format: 'cjs', sourcemap: true },
      { file: 'dist/utils/index.js', format: 'esm', sourcemap: true },
    ],
    plugins: [
      typescript({
        tsconfig: './tsconfig.json',
        declaration: true,
        declarationDir: './dist',
      }),
    ],
  },

  // 4. 组件入口 - JS（单文件）
  {
    input: 'src/components/index.ts',
    output: { file: 'dist/components.js', format: 'esm', sourcemap: true },
    plugins: [
      peerDepsExternal(),
      cssPlugin,
      typescript({
        tsconfig: './tsconfig.json',
        declaration: true,
        declarationDir: './dist', // 输出到 dist/components.d.ts
      }),
    ],
    external: ['react', 'react-dom'],
  },

  // 5. 类型合并 - 主入口
  {
    input: 'dist/index.d.ts',
    output: { file: 'dist/index.d.ts', format: 'esm' },
    plugins: [dts()],
  },
];
