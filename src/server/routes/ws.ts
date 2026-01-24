/**
 * WebSocket 路由
 *
 * 处理 WebSocket 升级请求
 */

import { Hono } from 'hono';
import { getWebSocketService } from '../services/websocket.js';

const wsRoutes = new Hono();

wsRoutes.get('/', async (c) => {
  const upgradeHeader = c.req.header('Upgrade');

  if (upgradeHeader !== 'websocket') {
    return c.json({ error: 'Expected WebSocket' }, 426);
  }

  const userAgent = c.req.header('User-Agent');

  try {
    // Hono/Bun WebSocket 升级
    return new Response(null, {
      status: 101,
      headers: {
        'Upgrade': 'websocket',
        'Connection': 'Upgrade',
        'Sec-WebSocket-Accept': c.req.header('Sec-WebSocket-Key') || '',
      },
      webSocket: {
        open: (ws) => {
          console.log('[WebSocket] Connection opened');
          const wsService = getWebSocketService();
          wsService.connect(ws, userAgent);
        },
        message: (ws, message) => {
          // 消息由 WebSocketService 处理
        },
        close: (ws, code, reason) => {
          console.log('[WebSocket] Connection closed');
        },
      },
    });
  } catch (error) {
    console.error('[WebSocket] Upgrade error:', error);
    return c.json({ error: 'WebSocket upgrade failed' }, 500);
  }
});

export default wsRoutes;