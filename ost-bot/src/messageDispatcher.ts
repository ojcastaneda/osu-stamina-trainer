const cacheDuration = 900000;

/**
 * Message dispatcher for incoming messages from users.
 */
export class MessageDispatcher<T> {
	dispatcher: (message: T, skipIds: number[]) => Promise<number | undefined>;
	users: Record<string, MessageQueue<T>>;

	constructor(dispatcher: (message: T, skipIds: number[]) => Promise<number | undefined>) {
		this.dispatcher = dispatcher;
		this.users = {};
		setInterval(() => {
			const currentDate = new Date().getTime();
			for (const user in this.users) {
				const { active, lastActivity } = this.users[user];
				if (!active && currentDate - lastActivity >= cacheDuration) delete this.users[user];
			}
		}, cacheDuration);
	}

	/**
	 * Adds a message to the processing queue for an specific user.
	 *
	 * @param message - The message to be processed by the dispatcher.
	 * @param id - The identifier of the user.
	 */
	enqueue(message: T, id: string) {
		if (this.users[id] === undefined) this.users[id] = new MessageQueue(this.dispatcher);
		this.users[id].enqueue(message);
	}
}

/**
 * Queue for processing messages for a specific user.
 */
class MessageQueue<T> {
	active: boolean;
	dispatcher: (message: T, skipIds: number[]) => Promise<number | undefined>;
	lastActivity: number;
	queue: T[];
	requests: number[];

	constructor(dispatcher: (message: T, skipIds: number[]) => Promise<number | undefined>) {
		this.active = false;
		this.dispatcher = dispatcher;
		this.lastActivity = new Date().getTime();
		this.queue = [];
		this.requests = [];
	}

	/**
	 * Adds a message to the processing queue of the user,
	 * and begins processing the queue if it is not already processing messages.
	 *
	 * @param message - The message to be processed by the dispatcher.
	 */
	enqueue(message: T) {
		this.lastActivity = new Date().getTime();
		this.queue.push(message);
		if (!this.active) {
			this.active = true;
			this.dequeue();
		}
	}

	/**
	 * Process all the messages of the queue.
	 * If the dispatcher function returns a number, add it to the list of temporarily blacklisted requests.
	 */
	async dequeue() {
		let message = this.queue.shift();
		while (message !== undefined) {
			const request = await this.dispatcher(message, this.requests);
			message = this.queue.shift();
			if (request === undefined) continue;
			this.requests.push(request);
		}
		this.active = false;
	}
}
