import wss from 'uWebSockets.js';

export function createWebSocketServer({ port, onopen, onmessage, onclose }) {
  const app = wss.App();

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
    open: (ws) => {
      onopen(ws);
    },
    message: (ws, message) => {
      onmessage(ws, message);
    },
    close: (ws, code) => {
      onclose(ws, code);
    }
  });

  app.get('/*', (res, req) => {
    res.end('Nothing to see here!');
  });

  app.listen(port, (listenSocket) => {
    if (listenSocket) {
      console.log(`WebSocket Server listening on ws://localhost:${port}`);
    } else {
      console.log(`WebSocket Server failed to listen to port ${port}`);
    }
  });
}

export function send(ws, response) {
  const responseString = JSON.stringify(response);
  ws.send(responseString, false);
}
