export function evaluate(options) {
  if (!window.Worker)
    throw new Error("Cannot use MFCE engine: browser doesn't support WebWorkers");
  return new Promise((resolve, reject) => {
    const worker = new Worker('dist/mfce_worker.js');
    worker.onerror = (e) => { reject(e.message || 'unknown error'); };
    worker.postMessage(options);
    worker.onmessage = (e) => {
      const msg = e.data;
      if (msg.status === 'ok')
        resolve(msg.data);
      else
        reject(msg.message);
      worker.terminate();
    }
  });
}
