# Ghokho Project

## Install Dependencies

```sh
npm i
```

## Run the program
### Start the server
```sh
npm start server
```
### Start the commander
```sh
npm start commander
```

## Customize
You can change properties in [utils.ts](src/utils.ts) to customize the program.
```typescript
export const port = 3000;
export const address = `tcp://127.0.0.1:${port}`;
export const directory = './transaction_files/';
export const workerPath = './src/worker.ts';
export const workerProcessesCount = 5;
export const fileCheckerThreadsCount = 5;
export const corruptionChance: number = 1 / 3;
```
