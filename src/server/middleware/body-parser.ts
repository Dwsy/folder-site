/**
 * 请求体解析中间件
 */

import type { Context, Next } from 'hono';

/**
 * Body 解析配置选项
 */
export interface BodyParserOptions {
  /** 最大请求体大小（字节） */
  maxSize?: number;
  /** 是否解析 JSON */
  json?: boolean;
  /** 是否解析 URL 编码数据 */
  urlencoded?: boolean;
  /** 是否解析文本 */
  text?: boolean;
  /** JSON 解析限制 */
  jsonLimit?: string;
}

/**
 * 默认配置
 */
const defaultOptions: BodyParserOptions = {
  maxSize: 10 * 1024 * 1024, // 10MB
  json: true,
  urlencoded: true,
  text: true,
  jsonLimit: '10mb',
};

/**
 * 检查内容类型
 */
function getContentType(c: Context): string | null {
  const contentType = c.req.header('content-type');
  if (!contentType) return null;
  return contentType.split(';')[0]?.trim().toLowerCase() || null;
}

/**
 * 检查请求体大小
 */
function checkSize(c: Context, maxSize: number): boolean {
  const contentLength = c.req.header('content-length');
  if (!contentLength) return true;

  const size = parseInt(contentLength, 10);
  if (isNaN(size)) return true;

  return size <= maxSize;
}

/**
 * Body 解析中间件
 */
export function bodyParser(options: BodyParserOptions = {}) {
  const opts = { ...defaultOptions, ...options };

  return async (c: Context, next: Next): Promise<void | Response> => {
    // 检查请求体大小
    if (!checkSize(c, opts.maxSize!)) {
      return c.json(
        {
          success: false,
          error: {
            code: 'PAYLOAD_TOO_LARGE',
            message: `Request body too large. Maximum size is ${opts.maxSize} bytes`,
          },
          timestamp: Date.now(),
        },
        413
      );
    }

    const contentType = getContentType(c);

    // 解析 JSON
    if (contentType === 'application/json' && opts.json) {
      try {
        const body = await c.req.json();
        c.set('parsedBody', body);
      } catch (error) {
        return c.json(
          {
            success: false,
            error: {
              code: 'INVALID_JSON',
              message: 'Invalid JSON in request body',
            },
            timestamp: Date.now(),
          },
          400
        );
      }
    }

    // 解析 URL 编码数据
    else if (
      (contentType === 'application/x-www-form-urlencoded' ||
       contentType === 'multipart/form-data') &&
      opts.urlencoded
    ) {
      try {
        const formData = await c.req.formData();
        const body: Record<string, any> = {};

        formData.forEach((value, key) => {
          body[key] = value;
        });

        c.set('parsedBody', body);
      } catch (error) {
        return c.json(
          {
            success: false,
            error: {
              code: 'INVALID_FORM_DATA',
              message: 'Invalid form data in request body',
            },
            timestamp: Date.now(),
          },
          400
        );
      }
    }

    // 解析纯文本
    else if (contentType === 'text/plain' && opts.text) {
      try {
        const body = await c.req.text();
        c.set('parsedBody', body);
      } catch (error) {
        return c.json(
          {
            success: false,
            error: {
              code: 'INVALID_TEXT',
              message: 'Invalid text in request body',
            },
            timestamp: Date.now(),
          },
          400
        );
      }
    }

    // 继续处理请求
    await next();
  };
}