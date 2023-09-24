import { createWebSocketServer, send } from './websocket-server.js';
import * as gamelift from './gamelift.js';
import { readFileSync } from 'fs';

/** @type {Object.<string, GameProcess>} */
const gameProcesses = {};

/** @type {Object<string, GameSession>} */
const gameSessions = {};

createWebSocketServer({
  port: 9001,
  onopen: (ws) => {
    console.log('client connected', ws.id);
    console.log('query', ws.query)

    const sendHelper = (message) => {
      console.log(`sending message to ${ws.id}:`, message);
      send(ws, message);
    };

    gameProcesses[ws.id] = {
      send: sendHelper,
      pID: ws.query.pID,
      sdkVersion: ws.query.sdkVersion,
      sdkLanguage: ws.query.sdkLanguage,
      authorization: ws.query.Authorization,
      computeId: ws.query.ComputeId,
      fleetId: ws.query.FleetId,
      port: null,
      logPaths: null,
      processActivated: false,
      gameSessionId: null,
      gameSessionActivated: false,
    };
  },
  onmessage(ws, message) {
    const messageString = Buffer.from(message).toString();
    const parsedMessage = JSON.parse(messageString);
    console.log(`received message from ${ws.id}:`, parsedMessage);

    const gameProcess = gameProcesses[ws.id];

    const { Action: action } = parsedMessage;

    if (action === 'ActivateServerProcess') {
      gamelift.handleActivateServerProcess(parsedMessage, gameProcess);
    }

    if (action === 'GetFleetRoleCredentials') {
      gamelift.handleGetFleetRoleCredentials(parsedMessage, gameProcess);
    }

    if (action === 'HeartbeatServerProcess') {
      gamelift.handleHeartbeatServerProcess(parsedMessage, gameProcess);
    }

    if (action === 'CreateGameSession') {
      gamelift.handleCreateGameSession(parsedMessage, gameProcess, gameProcesses, gameSessions);
    }

    if (action === 'ActivateGameSession') {
      gamelift.handleActivateGameSession(parsedMessage, gameProcess);
    }
  },
  onclose(ws, code) {
    console.log('client disconnected', ws.id, code);
  },
  routes: [
    {
      method: 'GET',
      path: '/',
      handler(res, req) {
        const html = readFileSync('./public/index.html');
        res.end(html);
      }
    },
    {
      method: 'GET',
      path: '/public/main.js',
      handler(res, req) {
        const html = readFileSync('./public/main.js');
        res.writeHeader('Content-Type', 'application/javascript');
        res.end(html);
      }
    },
    {
      method: 'GET',
      path: '/public/vue@3.3.4-esm-browser.js',
      handler(res, req) {
        const html = readFileSync('./public/vue@3.3.4-esm-browser.js');
        res.writeHeader('Content-Type', 'application/javascript');
        res.end(html);
      }
    },
    {
      method: 'GET',
      path: '/public/main.css',
      handler(res, req) {
        const html = readFileSync('./public/main.css');
        res.writeHeader('Content-Type', 'text/css');
        res.end(html);
      }
    }
  ]
});
