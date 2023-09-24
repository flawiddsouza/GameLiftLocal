interface GameProcess {
  send: Function;
  pID: string;
  sdkVersion: string;
  sdkLanguage: string;
  authorization: string;
  computeId: string;
  fleetId: string;
  port: number | null;
  logPaths: string[] | null;
  processActivated: boolean;
  gameSessionId: string | null;
  gameSessionActivated: boolean;
}

type uWebSocket = import('uWebSockets.js').WebSocket<any>;

interface CustomWebSocket extends uWebSocket {
  id: number;
}
