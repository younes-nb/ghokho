export const port = 3000;
export const address = `tcp://127.0.0.1:${port}`;
export const directory = './transaction_files/';
export const workerPath = './src/worker.ts';
export const workerProcessesCount = 5;
export const fileCheckerThreadsCount = 5;
export const corruptionChance: number = 1 / 3;

export function logToConsole(message: string, from?: string): void {
  if (from) {
    console.log(
      `[${new Date().toLocaleTimeString()}] From ${from}: ${message}.`
    );
  } else {
    console.log(`[${new Date().toLocaleTimeString()}] ${message}.`);
  }
}
