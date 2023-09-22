import { createWebSocketServer, send } from './websocket-server.js';

let id = 0;
const wsMap = new Map();

createWebSocketServer({
  port: 9001,
  onopen: (ws) => {
    ws.id = ++id;
    wsMap.set(id, ws);

    console.log('client connected', ws.id);
    console.log('query', ws.query)

    setTimeout(() => {
      const createGameSession = {
        Action: "CreateGameSession",
        MaximumPlayerSessionCount: 4,
        Port: 1900,
        IpAddress: "localhost",
        GameSessionId: "game_session_id",
        GameSessionName: "game_session_name",
        GameSessionData: "game_session_data",
        MatchmakerData: "{}",
        GameProperties: {
          userId1: '1',
          userId2: '2',
          userId3: '3',
          userId4: '4',
          gameType: '1',
          challengeId: 'xyz',
          turnTime: '30',
          turnSkipCount: '3',
          gameMode: '1',
          botDifficulty: '1',
          timeGameModeTime: '0',
          roomId: '1',
          isJokerEnabled: '1',
        }
      }
      send(ws, createGameSession)
    }, 3000);
  },
  onmessage(ws, message) {
    const messageString = Buffer.from(message).toString();
    const parsedMessage = JSON.parse(messageString);
    console.log('message', parsedMessage);
    const { Action, RequestId } = parsedMessage;
    if (Action === 'GetFleetRoleCredentials') {
      const getFleetRoleCredentials = {
        Action: 'GetFleetRoleCredentials',
        RequestId,
        StatusCode: 200,
        Data: {
          AssumedRoleUserArn: '',
          AssumedRoleId: '',
          AccessKeyId: '',
          SecretAccessKey: '',
          SessionToken: '',
          Expiration: 0,
        }
      };
      send(ws, getFleetRoleCredentials);
    }
    if (Action === 'HeartbeatServerProcess') {
      const heartbeatServerProcess = {
        Action: 'HeartbeatServerProcess',
        RequestId,
        StatusCode: 200,
      }
      send(ws, heartbeatServerProcess);
    }
  },
  onclose(ws, code) {
    wsMap.delete(ws.id);
    console.log('client disconnected', ws.id, code);
  }
});
