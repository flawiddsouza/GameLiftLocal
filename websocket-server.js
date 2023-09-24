import * as wss from 'uWebSockets.js';

export function createWebSocketServer({ port, onopen, onmessage, onclose, routes }) {
  const app = wss.App();
  let id = 0;
  const clients = new Map();

  app.ws('/*', {
    upgrade: (res, req, context) => {
      return res.upgrade(
        { query: Object.fromEntries(new URLSearchParams(req.getQuery()).entries()) },
        req.getHeader('sec-websocket-key'),
        req.getHeader('sec-websocket-protocol'),
        req.getHeader('sec-websocket-extensions'),
        context
      );
    },
    /** @param {CustomWebSocket} ws */
    open: (ws) => {
      ws.id = ++id;
      clients.set(id, ws);
      onopen(ws);
    },
    message: (ws, message) => {
      onmessage(ws, message);
    },
    /** @param {CustomWebSocket} ws */
    close: (ws, code) => {
      clients.delete(ws.id);
      onclose(ws, code);
    }
  });

  app.get('/*', (res, req) => {
    res.end('Nothing to see here!');
  });

  routes.forEach(({ path, method, handler }) => {
    app[method.toLowerCase()](path, handler);
  });

  app.listen(port, (listenSocket) => {
    if (listenSocket) {
      console.log(`HTTP Server listening on http://localhost:${port}`);
      console.log(`WebSocket Server listening on ws://localhost:${port}`);
    } else {
      console.log(`Failed to listen to port ${port}`);
    }
  });

  return {
    clients
  };
}

export function send(ws, response) {
  const responseString = JSON.stringify(response);
  ws.send(responseString, false);
}
