/**
 * 文件访问历史 Hook
 *
 * 用于追踪和记录文件访问次数，实现"最近访问"功能
 */

import { useCallback } from 'react';

/**
 * 访问记录
 */
export interface FileAccessRecord {
  /** 文件路径 */
  path: string;
  /** 访问次数 */
  accessCount: number;
  /** 最后访问时间 */
  lastAccessedAt: number;
}

/**
 * 访问历史配置
 */
export interface FileAccessHistoryOptions {
  /** 最大记录数量 */
  maxRecords?: number;
  /** 存储键名 */
  storageKey?: string;
}

const DEFAULT_OPTIONS: Required<FileAccessHistoryOptions> = {
  maxRecords: 100,
  storageKey: 'folder-site-file-access-history',
};

/**
 * 文件访问历史 Hook
 */
export function useFileAccessHistory(options: FileAccessHistoryOptions = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // 从 localStorage 加载访问历史
  const loadHistory = useCallback((): Map<string, FileAccessRecord> => {
    if (typeof window === 'undefined') return new Map();
    try {
      const saved = localStorage.getItem(opts.storageKey);
      if (!saved) return new Map();
      const data = JSON.parse(saved) as Record<string, FileAccessRecord>;
      return new Map(Object.entries(data));
    } catch {
      return new Map();
    }
  }, [opts.storageKey]);

  // 保存访问历史到 localStorage
  const saveHistory = useCallback((history: Map<string, FileAccessRecord>) => {
    if (typeof window === 'undefined') return;
    try {
      const data = Object.fromEntries(history);
      localStorage.setItem(opts.storageKey, JSON.stringify(data));
    } catch {
      // Ignore storage errors
    }
  }, [opts.storageKey]);

  // 记录文件访问
  const recordAccess = useCallback((path: string, name?: string) => {
    const history = loadHistory();
    const now = Date.now();
    const existing = history.get(path);

    if (existing) {
      existing.accessCount += 1;
      existing.lastAccessedAt = now;
    } else {
      history.set(path, {
        path,
        accessCount: 1,
        lastAccessedAt: now,
      });
    }

    // 限制记录数量
    const sorted = Array.from(history.entries())
      .sort(([, a], [, b]) => b.lastAccessedAt - a.lastAccessedAt)
      .slice(0, opts.maxRecords);

    const trimmed = new Map(sorted);
    saveHistory(trimmed);
  }, [loadHistory, saveHistory, opts.maxRecords]);

  // 获取访问历史（按访问次数排序）
  const getAccessHistory = useCallback((): FileAccessRecord[] => {
    const history = loadHistory();
    return Array.from(history.values())
      .sort((a, b) => {
        // 先按访问次数降序，然后按最后访问时间降序
        if (b.accessCount !== a.accessCount) {
          return b.accessCount - a.accessCount;
        }
        return b.lastAccessedAt - a.lastAccessedAt;
      });
  }, [loadHistory]);

  // 获取指定路径的访问记录
  const getAccessRecord = useCallback((path: string): FileAccessRecord | null => {
    const history = loadHistory();
    return history.get(path) || null;
  }, [loadHistory]);

  // 清除访问历史
  const clearHistory = useCallback(() => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(opts.storageKey);
  }, [opts.storageKey]);

  // 清除单个文件的访问记录
  const clearRecord = useCallback((path: string) => {
    const history = loadHistory();
    history.delete(path);
    saveHistory(history);
  }, [loadHistory, saveHistory]);

  // 获取访问统计
  const getStats = useCallback(() => {
    const history = loadHistory();
    const records = Array.from(history.values());
    const totalAccesses = records.reduce((sum, r) => sum + r.accessCount, 0);
    const uniqueFiles = records.length;

    return {
      totalAccesses,
      uniqueFiles,
      avgAccessesPerFile: uniqueFiles > 0 ? totalAccesses / uniqueFiles : 0,
    };
  }, [loadHistory]);

  // 获取最近访问的文件（带名称）
  const getRecentFiles = useCallback((limit: number = 10): Array<{ path: string; name: string; visitCount: number; lastAccessed: number }> => {
    const history = loadHistory();
    return Array.from(history.entries())
      .map(([path, record]) => ({
        path,
        name: path.split('/').pop() || path,
        visitCount: record.accessCount,
        lastAccessed: record.lastAccessedAt,
      }))
      .sort((a, b) => {
        // 先按访问次数降序，然后按最后访问时间降序
        if (b.visitCount !== a.visitCount) {
          return b.visitCount - a.visitCount;
        }
        return b.lastAccessed - a.lastAccessed;
      })
      .slice(0, limit);
  }, [loadHistory]);

  return {
    recordAccess,
    getAccessHistory,
    getAccessRecord,
    clearHistory,
    clearRecord,
    getStats,
    getRecentFiles,
  };
}

// 添加静态 getState 方法用于在组件外部访问
useFileAccessHistory.getState = () => {
  const storageKey = DEFAULT_OPTIONS.storageKey;

  const loadHistory = (): Map<string, FileAccessRecord> => {
    if (typeof window === 'undefined') return new Map();
    try {
      const saved = localStorage.getItem(storageKey);
      if (!saved) return new Map();
      const data = JSON.parse(saved) as Record<string, FileAccessRecord>;
      return new Map(Object.entries(data));
    } catch {
      return new Map();
    }
  };

  const saveHistory = (history: Map<string, FileAccessRecord>) => {
    if (typeof window === 'undefined') return;
    try {
      const data = Object.fromEntries(history);
      localStorage.setItem(storageKey, JSON.stringify(data));
    } catch {
      // Ignore storage errors
    }
  };

  const recordAccess = (path: string, name?: string) => {
    const history = loadHistory();
    const now = Date.now();
    const existing = history.get(path);

    if (existing) {
      existing.accessCount += 1;
      existing.lastAccessedAt = now;
    } else {
      history.set(path, {
        path,
        accessCount: 1,
        lastAccessedAt: now,
      });
    }

    // 限制记录数量
    const sorted = Array.from(history.entries())
      .sort(([, a], [, b]) => b.lastAccessedAt - a.lastAccessedAt)
      .slice(0, DEFAULT_OPTIONS.maxRecords);

    saveHistory(new Map(sorted));
  };

  return {
    recordAccess,
  };
};

/**
 * 带访问计数的文件项
 */
export type FileWithAccessCount<T extends object> = T & {
  /** 访问次数 */
  accessCount?: number;
  /** 最后访问时间 */
  lastAccessedAt?: number;
};

/**
 * 按访问次数排序文件列表
 */
export function sortFilesByAccess<T extends { path: string }>(
  files: T[],
  accessHistory: FileAccessRecord[]
): FileWithAccessCount<T>[] {
  const historyMap = new Map(
    accessHistory.map((r) => [r.path, r])
  );

  return files
    .map((file) => {
      const record = historyMap.get(file.path);
      return {
        ...file,
        accessCount: record?.accessCount,
        lastAccessedAt: record?.lastAccessedAt,
      };
    })
    .sort((a, b) => {
      // 有访问记录的排前面
      const aHasAccess = a.accessCount !== undefined && a.accessCount > 0;
      const bHasAccess = b.accessCount !== undefined && b.accessCount > 0;

      if (aHasAccess && !bHasAccess) return -1;
      if (!aHasAccess && bHasAccess) return 1;

      if (aHasAccess && bHasAccess) {
        // 都有访问记录，按访问次数降序
        if ((b.accessCount || 0) !== (a.accessCount || 0)) {
          return (b.accessCount || 0) - (a.accessCount || 0);
        }
        // 访问次数相同，按最后访问时间降序
        return (b.lastAccessedAt || 0) - (a.lastAccessedAt || 0);
      }

      // 都没有访问记录，保持原顺序
      return 0;
    });
}