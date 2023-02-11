const {AsyncResource} = require('async_hooks');
const {EventEmitter} = require('events');
const path = require('path');
const {fork} = require('child_process');
const {logToConsole} = require('./utils');
const kTaskInfo = Symbol('kTaskInfo');
const kWorkerFreedEvent = Symbol('kWorkerFreedEvent');

class WorkerPoolTaskInfo extends AsyncResource {
  constructor(callback) {
    super('WorkerPoolTaskInfo');
    this.callback = callback;
  }

  done(err, result) {
    this.runInAsyncScope(this.callback, null, err, result);
    this.emitDestroy();
  }
}

class WorkerPool extends EventEmitter {
  constructor(count, workerFile) {
    super();
    this.workerFile = workerFile;
    this.workers = [];
    this.freeWorkers = [];
    for (let i = 0; i < count; i++) this.addNewWorker();
  }

  addNewWorker() {
    const worker = fork(path.resolve(this.workerFile));
    this.workers.push(worker);
    this.freeWorkers.unshift(worker);
    logToConsole('Started', `Worker #${worker.pid}`);
    this.emit(kWorkerFreedEvent);

    worker.on('message', result => {
      worker[kTaskInfo].done(null, result);
      worker[kTaskInfo] = null;
      this.freeWorkers.unshift(worker);
      this.emit(kWorkerFreedEvent);
    });
    worker.on('error', err => {
      if (worker[kTaskInfo]) worker[kTaskInfo].done(err, null);
      else this.emit('error', err);
      this.workers.splice(this.workers.indexOf(worker), 1);
      this.freeWorkers.splice(this.workers.indexOf(worker), 1);
      logToConsole(err.message, `Worker #${worker.pid}`);
      this.addNewWorker();
    });
    worker.on('exit', code => {
      this.workers.splice(this.workers.indexOf(worker), 1);
      this.freeWorkers.splice(this.workers.indexOf(worker), 1);
      logToConsole(`exiting with code ${code}`, `Worker #${worker.pid}`);
      this.addNewWorker();
    });
  }

  runTask(task, callback) {
    if (this.freeWorkers.length === 0) {
      this.once(kWorkerFreedEvent, () => this.runTask(task, callback));
      return;
    }
    while (true) {
      const worker = this.freeWorkers.pop();
      if (worker.channel) {
        worker[kTaskInfo] = new WorkerPoolTaskInfo(callback);
        worker.send(task);
        break;
      }
    }
  }
}

module.exports = WorkerPool;
