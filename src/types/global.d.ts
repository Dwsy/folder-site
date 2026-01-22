/**
 * 全局类型声明
 */

/**
 * Bun 运行时类型
 */
declare namespace Bun {
  /**
   * Bun 服务器类型
   */
  interface Server {
    port: number;
    fetch: (request: Request) => Promise<Response>;
    stop(): void;
    reload(): void;
  }
}

/**
 * Node.js 进环境扩展
 */
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      /** Node 环境 */
      NODE_ENV?: 'development' | 'production' | 'test';
      /** 端口号 */
      PORT?: string;
      /** 主机地址 */
      HOST?: string;
      /** 调试模式 */
      DEBUG?: string;
      /** 自定义环境变量 */
      [key: string]: any;
    }
  }
}

/**
 * Window 对象扩展（客户端）
 */
declare interface Window {
  /** WebSocket 实例 */
  __ws__?: WebSocket;
  /** 开发服务器配置 */
  __devServer__?: {
    port: number;
    host: string;
  };
  /** 自定义数据 */
  __data__?: Record<string, any>;
}

/**
 * Import Meta 扩展
 */
declare interface ImportMeta {
  /** 环境变量 */
  env: {
    MODE?: string;
    PROD?: boolean;
    DEV?: boolean;
    SSR?: boolean;
    BASE_URL?: string;
  };
  /** 热模块替换 */
  hot?: {
    accept(callback?: () => void): void;
    dispose(callback: (data: any) => void): void;
    decline(): void;
    invalidate(): void;
  };
}

/**
 * 模块声明
 */
declare module '*.md' {
  const content: string;
  export default content;
}

declare module '*.mdx' {
  const content: any;
  export default content;
}

declare module '*.css' {
  const styles: { [className: string]: string };
  export default styles;
}

declare module '*.scss' {
  const styles: { [className: string]: string };
  export default styles;
}

declare module '*.sass' {
  const styles: { [className: string]: string };
  export default styles;
}

declare module '*.less' {
  const styles: { [className: string]: string };
  export default styles;
}

declare module '*.svg' {
  const content: string;
  export default content;
}

declare module '*.png' {
  const src: string;
  export default src;
}

declare module '*.jpg' {
  const src: string;
  export default src;
}

declare module '*.jpeg' {
  const src: string;
  export default src;
}

declare module '*.gif' {
  const src: string;
  export default src;
}

declare module '*.webp' {
  const src: string;
  export default src;
}

declare module '*.ico' {
  const src: string;
  export default src;
}

declare module '*.bmp' {
  const src: string;
  export default src;
}

declare module '*.json' {
  const value: any;
  export default value;
}

declare module '*.txt' {
  const content: string;
  export default content;
}

/**
 * 工具类型
 */

/**
 * 深度 Partial
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * 深度 Readonly
 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

/**
 * 深度 Required
 */
export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P];
};

/**
 * 提取函数类型
 */
export type ExtractFunction<T> = T extends (...args: any) => any ? T : never;

/**
 * 提取 Promise 类型
 */
export type Awaited<T> = T extends Promise<infer U> ? U : T;

/**
 * 使某些属性可选
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * 使某些属性必需
 */
export type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

/**
 * 联合类型转交叉类型
 */
export type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void
  ? I
  : never;

/**
 * 获取函数参数类型
 */
export type Parameters<T extends (...args: any) => any> = T extends (...args: infer P) => any
  ? P
  : never;

/**
 * 获取函数返回值类型
 */
export type ReturnType<T extends (...args: any) => any> = T extends (...args: any) => infer R
  ? R
  : any;

/**
 * 获取 Promise 返回值类型
 */
export type PromiseReturnType<T extends (...args: any) => Promise<any>> = Awaited<
  ReturnType<T>
>;

export {};