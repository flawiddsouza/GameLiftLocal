import { number, string, object, array, parse as validate, boolean, any, nullable } from 'valibot';
import { randomUUID } from 'crypto';

const baseMessageSchema = {
  Action: string(),
  RequestId: string(),
};

/**
 * @param {string} functionName
 * @param {import('valibot').ValiError} error
 * @returns {void}
 */
function handleValidationError(functionName, error) {
  console.log(`${functionName} validation error:`, JSON.stringify(error.issues, null, 2));
}

/**
 * @param {object} receivedMessage
 * @param {GameProcess} gameProcess
 */
export function handleActivateServerProcess(receivedMessage, gameProcess) {
  const messageSchema = object({
    ...baseMessageSchema,
    SdkVersion: string(),
    SdkLanguage: string(),
    Port: number(),
    LogPaths: array(string()),
  });

  try {
    const validatedMessage = validate(messageSchema, receivedMessage);
    gameProcess.port = validatedMessage.Port;
    gameProcess.logPaths = validatedMessage.LogPaths;
    gameProcess.processActivated = true;
  } catch (error) {
    handleValidationError('handleActivateServerProcess', error);
  }
}

/**
 * @param {object} receivedMessage
 * @param {GameProcess} gameProcess
 */
export function handleGetFleetRoleCredentials(receivedMessage, gameProcess) {
  const messageSchema = object({
    ...baseMessageSchema,
    RoleArn: string(),
    RoleSessionName: string(),
  });

  try {
    const validatedMessage = validate(messageSchema, receivedMessage);

    const activateServerProcess = {
      Action: 'GetFleetRoleCredentials',
      RequestId: validatedMessage.RequestId,
      StatusCode: 200,
      AssumedRoleUserArn: 'dummy',
      AssumedRoleId: 'dummy',
      AccessKeyId: 'dummy',
      SecretAccessKey: 'dummy',
      SessionToken: 'dummy',
      Expiration: 0,
    };

    gameProcess.send(activateServerProcess);
  } catch (error) {
    handleValidationError('handleGetFleetRoleCredentials', error);
  }
}

/**
 * @param {object} receivedMessage
 * @param {GameProcess} gameProcess
 */
export function handleHeartbeatServerProcess(receivedMessage, gameProcess) {
  const messageSchema = object({
    ...baseMessageSchema,
    HealthStatus: boolean(),
  });

  try {
    const validatedMessage = validate(messageSchema, receivedMessage);

    const heartbeatServerProcess = {
      Action: 'HeartbeatServerProcess',
      RequestId: validatedMessage.RequestId,
      StatusCode: 200,
    };

    gameProcess.send(heartbeatServerProcess);
  } catch (error) {
    handleValidationError('handleHeartbeatServerProcess', error);
  }
}

/**
 * @param {object} receivedMessage
 * @param {GameProcess} gameProcess
 * @param {Object.<string, GameProcess>} gameProcesses
 * @param {Object.<string, GameSession>} gameSessions
 */
export function handleCreateGameSession(receivedMessage, gameProcess, gameProcesses, gameSessions) {
  const messageSchema = object({
    ...baseMessageSchema,
    GameProperties: any(),
    PlayerSessions: array(object({
      playerId: string(),
      playerData: string(),
    })),
  });

  try {
    const validatedMessage = validate(messageSchema, receivedMessage);

    const newGameSessionId = randomUUID();

    gameSessions[newGameSessionId] = {
      gameSessionId: newGameSessionId,
      gameSessionName: 'game_session_name',
      gameSessionData: 'game_session_data',
      maximumPlayerSessionCount: 4,
      matchmakerData: '{}',
      gameProperties: validatedMessage.GameProperties,
      playerSessions: validatedMessage.PlayerSessions.map(playerSession => ({
        PlayerId: playerSession.playerId,
        PlayerSessionId: playerSession.playerId,
        GameSessionId: newGameSessionId,
        FleetId: 'fleet_id',
        PlayerData: playerSession.playerData,
        IpAddress: 'localhost',
        Port: 0,
        CreationTime: Date.now(),
        TerminationTime: Date.now(),
        DnsName: 'localhost',
        Status: 'RESERVED',
      })),
    };

    const gameSession = gameSessions[newGameSessionId];

    let freeGameProcessFound = null;

    for(const process of Object.values(gameProcesses)) {
      if (process.processActivated && process.gameSessionId === null) {
        gameSession.ipAddress = 'localhost';
        gameSession.port = process.port;

        const createGameSession = {
          Action: 'CreateGameSession',
          MaximumPlayerSessionCount: gameSession.maximumPlayerSessionCount,
          Port: gameSession.port,
          IpAddress: gameSession.ipAddress,
          GameSessionId: gameSession.gameSessionId,
          GameSessionName: gameSession.gameSessionName,
          GameSessionData: gameSession.gameSessionData,
          MatchmakerData: gameSession.matchmakerData,
          GameProperties: gameSession.gameProperties,
        };
        process.gameSessionId = gameSession.gameSessionId;
        process.send(createGameSession);
        freeGameProcessFound = process;
        break;
      }
    }

    if (!freeGameProcessFound) {
      gameProcess.send({
        Action: 'CreateGameSession',
        StatusCode: 400,
        RequestId: validatedMessage.RequestId,
        Message: 'No free game process found',
      });
    } else {
      gameProcess.send({
        Action: 'CreateGameSession',
        StatusCode: 200,
        RequestId: validatedMessage.RequestId,
        Process: freeGameProcessFound,
        GameSession: gameSession,
      });
    }
  } catch (error) {
    handleValidationError('handleCreateGameSession', error);
  }
}

/**
 * @param {object} receivedMessage
 * @param {GameProcess} gameProcess
 */
export function handleActivateGameSession(receivedMessage, gameProcess) {
  const messageSchema = object({
    ...baseMessageSchema,
    GameSessionId: string(),
  });

  try {
    const validatedMessage = validate(messageSchema, receivedMessage);

    gameProcess.gameSessionActivated = true;

    // we don't send a response because gamelift sdk seems to not expect one
  } catch (error) {
    handleValidationError('handleActivateGameSession', error);
  }
}

/**
 * @param {object} receivedMessage
 * @param {GameProcess} gameProcess
 */
export function handleAcceptPlayerSession(receivedMessage, gameProcess) {
  const messageSchema = object({
    ...baseMessageSchema,
    GameSessionId: string(),
    PlayerSessionId: string(),
  });

  try {
    const validatedMessage = validate(messageSchema, receivedMessage);

    // we don't send a response because gamelift sdk seems to not expect one
  } catch (error) {
    handleValidationError('handleAcceptPlayerSession', error);
  }
}

/**
 * @param {object} receivedMessage
 * @param {GameProcess} gameProcess
 * @param {Object.<string, GameSession>} gameSessions
 */
export function handleDescribePlayerSessions(receivedMessage, gameProcess, gameSessions) {
  const messageSchema = object({
    ...baseMessageSchema,
    GameSessionId: nullable(string()),
    PlayerSessionId: nullable(string()),
    PlayerId: nullable(string()),
    PlayerSessionStatusFilter: nullable(string()),
    NextToken: nullable(string()),
    Limit: number(),
  });

  try {
    const validatedMessage = validate(messageSchema, receivedMessage);

    const playerSessions = [];

    // when game session id is provided and player session id isn't
    if (validatedMessage.GameSessionId && validatedMessage.PlayerSessionId === null) {
      const gameSession = gameSessions[validatedMessage.GameSessionId];
      playerSessions.push(...gameSession.playerSessions);
    }

    // when player session id is provided and game session id isn't
    if (validatedMessage.GameSessionId === null && validatedMessage.PlayerSessionId) {
      let foundPlayerSession = null;

      for (const gameSession of Object.values(gameSessions)) {
        foundPlayerSession = gameSession.playerSessions.find(playerSession => playerSession.PlayerSessionId === validatedMessage.PlayerSessionId);
        if (foundPlayerSession) {
          break;
        }
      }

      playerSessions.push(foundPlayerSession);
    }

    const describePlayerSessions = {
      Action: 'DescribePlayerSessions',
      StatusCode: 200,
      RequestId: validatedMessage.RequestId,
      PlayerSessions: playerSessions,
      NextToken: null,
    };

    gameProcess.send(describePlayerSessions);
  } catch (error) {
    handleValidationError('handleDescribePlayerSessions', error);
  }
}
