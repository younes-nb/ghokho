import {parentPort, threadId} from 'worker_threads';
import {Message} from '../types';
import {existsSync, readFileSync} from 'fs';
import md5 = require('md5');

parentPort?.on('message', message => {
  parentPort?.postMessage(checkFile(message.filePath));
});

function checkFile(filePath: string): Message {
  if (existsSync(`${filePath}.md5`)) {
    const md5OfFile: string = md5(readFileSync(filePath, 'utf8'));
    const md5ByWorker: string = readFileSync(`${filePath}.md5`, 'utf8');
    if (md5OfFile !== md5ByWorker) {
      return {
        code: 2,
        body: filePath,
        from: threadId,
      };
    }
  } else {
    return {
      code: 1,
      body: filePath,
      from: threadId,
    };
  }
  return {
    code: 3,
    body: filePath,
    from: threadId,
  };
}
