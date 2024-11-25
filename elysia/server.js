import { fileURLToPath } from "node:url";
import { Elysia } from "elysia";
import { availableParallelism } from "os";

const NUM_WORKERS = availableParallelism();
const workers = [];

// Create a pool of workers
for (let i = 0; i < NUM_WORKERS; i++) {
	const worker = new Worker("./worker.js");
	workers.push(worker);
}

let currentWorker = 0;

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	new Elysia()
		.get("/", (c) => {
			c.set.headers['content-type'] = 'text/html; charset=utf-8'

			const task = Promise.withResolvers();
			const worker = workers[(currentWorker + 1) % NUM_WORKERS];

			worker.addEventListener(
				"message",
				(event) => {
					task.resolve(event.data);
				},
				{ once: true },
			);

			// Start the worker
			worker.postMessage("start");

			return task.promise;
		})
		.listen(3000);
}
