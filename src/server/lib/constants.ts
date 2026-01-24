/**
 * 服务器共享常量
 */

/**
 * 基础文件扩展名（不依赖插件）
 */
export const BASE_EXTENSIONS: string[] = [
  // 文本和配置
  '.md', '.mmd', '.txt', '.json', '.yml', '.yaml',
  // 代码文件
  '.ts', '.tsx', '.js', '.jsx',
  // 图表和图形
  '.svg', '.png', '.jpg', '.jpeg', '.gif', '.webp',
  '.dot', '.gv',
];

/**
 * 默认排除的目录名称
 */
export const DEFAULT_EXCLUDE_DIRS: string[] = [
  'node_modules',
  '.git',
  'dist',
  'build',
  'coverage',
  '.next',
  '.nuxt',
  'target',
  '__pycache__',
  'venv',
  'env',
  '.env',
];