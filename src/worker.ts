import {Message} from './types';
import * as md5 from 'md5';
import {corruptionChance} from './utils';
import {readFileSync, writeFileSync} from 'fs';
import {randomBytes} from 'crypto';

process.on('message', message => {
  const {filePath} = message;
  if (process.send) {
    const result: Message = {
      body: generateMD5(filePath),
      from: process.pid,
    };
    process.send(result);
  }
});

function generateMD5(filePath: string): string {
  let encryptedContent: string;
  if (Math.random() > corruptionChance) {
    encryptedContent = md5(readFileSync(filePath, 'utf8'));
  } else {
    encryptedContent = md5(randomBytes(32).toString('hex'));
  }
  const md5Address = `${filePath}.md5`;
  writeFileSync(md5Address, encryptedContent);
  return filePath;
}
