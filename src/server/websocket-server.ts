/**
 * WebSocket 服务器
 *
 * 使用 Bun 原生 WebSocket API
 */

import { getWebSocketService } from './services/websocket.js';

export function createWebSocketServer(port: number = 3008) {
  const wsService = getWebSocketService();
  const clientMap = new Map<WebSocket, string>();

  const server = Bun.serve({
    port,
    fetch(req, server) {
      const url = new URL(req.url);

      if (url.pathname === '/ws') {
        const userAgent = req.headers.get('User-Agent');

        if (server.upgrade(req, {
          data: { userAgent },
        })) {
          return undefined;
        }

        return new Response('Upgrade failed', { status: 500 });
      }

      return new Response('Not Found', { status: 404 });
    },
    websocket: {
      open(ws) {
        console.log('[WebSocket] Connection opened');
        const userAgent = ws.data?.userAgent as string | undefined;
        const clientId = wsService.connect(ws, userAgent);
        clientMap.set(ws, clientId);
      },
      message(ws, message) {
        const clientId = clientMap.get(ws);
        if (clientId) {
          wsService['handleMessage'](clientId, message);
        }
      },
      close(ws, code, message) {
        console.log('[WebSocket] Connection closed');
        const clientId = clientMap.get(ws);
        if (clientId) {
          wsService.disconnect(clientId, 'close');
          clientMap.delete(ws);
        }
      },
      error(ws, error) {
        console.error('[WebSocket] Error:', error);
        const clientId = clientMap.get(ws);
        if (clientId) {
          wsService.disconnect(clientId, 'error');
          clientMap.delete(ws);
        }
      },
    },
  });

  console.log(`[WebSocket] Server listening on ws://localhost:${port}/ws`);

  return server;
}

export default createWebSocketServer;