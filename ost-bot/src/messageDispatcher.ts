const cacheDuration = 60000;

export class MessageDispatcher<T> {
	users: Record<string, MessageQueue<T>>;

	constructor() {
		this.users = {};
		setInterval(() => {
			const currentDate = new Date().getTime();
			for (const user in this.users) {
				const { active, lastActivity } = this.users[user];
				if (!active && currentDate - lastActivity >= cacheDuration) delete this.users[user];
			}
		}, cacheDuration);
	}

	enqueue(
		dispatcher: (message: T, skipIds: number[]) => Promise<number | undefined>,
		message: T,
		username: string
	) {
		if (this.users[username] === undefined) this.users[username] = new MessageQueue(dispatcher);
		this.users[username].enqueue(message);
	}
}

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

	enqueue(message: T) {
		this.lastActivity = new Date().getTime();
		this.queue.push(message);
		if (!this.active) {
			this.active = true;
			this.dequeue();
		}
	}

	async dequeue() {
		let message = this.queue.shift();
		while (message !== undefined) {
			const request = await this.dispatcher(message, this.requests);
			message = this.queue.shift();
			if (request === undefined) return;
			this.requests.push(request);
		}
		this.active = false;
	}
}
