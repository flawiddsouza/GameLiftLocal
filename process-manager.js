import { spawn } from 'child_process';
import { readFileSync } from 'fs';

let processManager = readFileSync('./process-manager.json', 'utf8');
processManager = JSON.parse(processManager);

const numProcesses = processManager.processCount;

const workingDir = processManager.workingDir;
const command = processManager.command;
const commandArgs = processManager.commandArgs;

let processes = [];

// Capture termination signals to cleanup processes
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

function cleanup() {
  processes.forEach(proc => {
    if (proc) proc.kill();
  });
  process.exit();
}

function spawnProcess(i) {
  const cmd = spawn(command, commandArgs, {
    cwd: workingDir,
    env: { ...process.env, GAMELIFT_SDK_PROCESS_ID: i + 1 },
  });

  cmd.stdout.on('data', data => {
    process.stdout.write(`[PID ${cmd.pid} - STDOUT] ${data}`);
  });

  cmd.stderr.on('data', data => {
    process.stderr.write(`[PID ${cmd.pid} - STDERR] ${data}`);
  });

  cmd.on('error', error => {
    console.error('An error occurred:', error);
  });

  cmd.on('exit', code => {
    console.log(`child process exited with code ${code}`);
    // Spawn new process when the previous one ends
    spawnProcess(i);
  });

  processes[i] = cmd;
}

async function main() {
  for (let i = 0; i < numProcesses; i++) {
    spawnProcess(i);
    await new Promise(resolve => setTimeout(resolve, 100)); // delay to avoid spawning all processes at once
  }
}

main();
