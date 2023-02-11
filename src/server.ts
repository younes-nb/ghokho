import {Socket, socket} from 'zeromq';
import {Message} from './types';
import {
  address,
  logToConsole,
  port,
  workerPath,
  workerProcessesCount,
} from './utils';

const WorkerProcessPool = require('./worker_process_pool');

const serverSocket: Socket = socket('rep');
serverSocket.bindSync(address);
logToConsole(`Server is listening on port ${port}`);
const pool = new WorkerProcessPool(workerProcessesCount, workerPath);
run().catch(err => console.error(err));

async function run() {
  serverSocket.on('message', async message => {
    const request: Message = JSON.parse(message.toString());
    logToConsole(`Request MD5 of ${request.body}`, 'Commander');
    const result: Message = await sendFileToWorker(request.body);
    logToConsole(`MD5 of ${result.body} saved`, `Worker #${result.from}`);
    const reply: Message = {body: result.body};
    serverSocket.send(JSON.stringify(reply));
    logToConsole(`${reply.body} sent to Commander`);
  });
}

async function sendFileToWorker(filePath: string): Promise<Message> {
  return new Promise((resolve, reject) => {
    pool.runTask({filePath: filePath}, (err: any, result: any) => {
      if (err) return reject(err);
      return resolve(result);
    });
  });
}
