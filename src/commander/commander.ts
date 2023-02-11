import {
  address,
  directory,
  fileCheckerThreadsCount,
  logToConsole,
} from '../utils';
import {opendirSync} from 'fs';
import * as path from 'path';
import {Message} from '../types';
import {socket, Socket} from 'zeromq';

const WorkerThreadPool = require('./worker_thread_pool');

const commanderSocket: Socket = socket('req');
commanderSocket.connect(address);
const pool = new WorkerThreadPool(
  fileCheckerThreadsCount,
  './src/commander/file_checker.js'
);

run().catch(err => console.error(err));

async function run() {
  commanderSocket.on('message', message => {
    const reply: Message = JSON.parse(message);
    logToConsole(`Check MD5 of ${reply.body}`, 'Server');
    checkFile(reply.body);
  });
  await checkDirFiles();
}

async function checkDirFiles() {
  try {
    const dir = opendirSync(directory);
    for await (const entry of dir) {
      if (path.extname(entry.name) === '.json') {
        await checkFile(`${directory}${entry.name}`);
      }
    }
  } catch (error: any) {
    console.log(error.message);
    process.exit();
  }
}

async function checkFile(filePath: string) {
  const result: Message = await sendFileToFileChecker(filePath);
  switch (result.code) {
    case 1:
      logToConsole(
        `MD5 of ${result.body} is missing`,
        `File checker #${result.from}`
      );
      sendFileToServer(result.body);
      break;
    case 2:
      logToConsole(
        `MD5 of ${result.body} is wrong`,
        `File checker #${result.from}`
      );
      sendFileToServer(result.body);
      break;
    case 3:
      logToConsole(
        `${result.body} is all good`,
        `File checker #${result.from}`
      );
      break;
  }
}

async function sendFileToFileChecker(filePath: string): Promise<Message> {
  return new Promise((resolve, reject) => {
    pool.runTask({filePath: filePath}, (err: any, result: any) => {
      if (err) return reject(err);
      return resolve(result);
    });
  });
}

function sendFileToServer(filePath: string) {
  const message: Message = {
    body: filePath,
  };
  commanderSocket.send(JSON.stringify(message));
}
