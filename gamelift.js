import { number, string, object, array, parse as validate, boolean, any } from 'valibot';
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
      Data: {
        AssumedRoleUserArn: 'dummy',
        AssumedRoleId: 'dummy',
        AccessKeyId: 'dummy',
        SecretAccessKey: 'dummy',
        SessionToken: 'dummy',
        Expiration: 0,
      }
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
 */
export function handleCreateGameSession(receivedMessage, gameProcess, gameProcesses) {
  const messageSchema = object({
    ...baseMessageSchema,
    GameProperties: any(),
  });

  try {
    const validatedMessage = validate(messageSchema, receivedMessage);

    let freeGameProcessFound = null;

    for(const process of Object.values(gameProcesses)) {
      if (process.processActivated && process.gameSessionId === null) {
        const createGameSession = {
          Action: 'CreateGameSession',
          MaximumPlayerSessionCount: 4,
          Port: process.port,
          IpAddress: 'localhost',
          GameSessionId: randomUUID(),
          GameSessionName: 'game_session_name',
          GameSessionData: 'game_session_data',
          MatchmakerData: '{}',
          GameProperties: validatedMessage.GameProperties,
        };
        process.gameSessionId = createGameSession.GameSessionId;
        process.send(createGameSession);
        console.log(JSON.stringify(gameProcesses, null, 2));
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
        Data: freeGameProcessFound,
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
  } catch (error) {
    handleValidationError('handleActivateGameSession', error);
  }
}
