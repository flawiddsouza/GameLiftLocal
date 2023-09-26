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
  id: string;
  query: { [key: string]: string };
}

interface Route {
  method: string;
  path: string;
  handler(res: any, req: any): void;
}

interface PlayerSession {
  PlayerId: string
  PlayerSessionId: string
  GameSessionId: string
  FleetId: string
  PlayerData: string
  IpAddress: string
  Port: number
  CreationTime: number
  TerminationTime: number
  DnsName: string
  Status: string
}

interface GameProperties {
  [key: string]: string;
}

interface GameSession {
  gameSessionId: string,
  gameSessionName: string,
  gameSessionData: string,
  maximumPlayerSessionCount: number,
  ipAddress?: string,
  port?: number,
  matchmakerData: '{}',
  gameProperties: GameProperties,
  playerSessions: PlayerSession[];
}
