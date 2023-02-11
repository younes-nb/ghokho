const {AsyncResource} = require('async_hooks');
const {EventEmitter} = require('events');
const path = require('path');
const {Worker} = require('worker_threads');
const {logToConsole} = require('../utils');

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

class WorkerThreadPool extends EventEmitter {
  constructor(count, workerFile) {
    super();
    this.workerFile = workerFile;
    this.workers = [];
    this.freeWorkers = [];

    for (let i = 0; i < count; i++) this.addNewWorker();
  }

  addNewWorker() {
    const worker = new Worker(path.resolve(this.workerFile));
    this.workers.push(worker);
    this.freeWorkers.unshift(worker);
    logToConsole('Started', `File checker #${worker.threadId}`);
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
      logToConsole(err.message, `File checker #${worker.threadId}`);
      this.addNewWorker();
    });
    worker.on('exit', exitCode => {
      this.workers.splice(this.workers.indexOf(worker), 1);
      logToConsole(`exiting with code ${exitCode}`, 'Unknown File checker');
      this.addNewWorker();
    });
  }

  runTask(task, callback) {
    if (this.freeWorkers.length === 0) {
      this.once(kWorkerFreedEvent, () => this.runTask(task, callback));
      return;
    }

    const worker = this.freeWorkers.pop();
    worker[kTaskInfo] = new WorkerPoolTaskInfo(callback);
    worker.postMessage(task);
  }
}

module.exports = WorkerThreadPool;
