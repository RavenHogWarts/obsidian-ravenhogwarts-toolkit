export type EventCallback = (data?: any) => void;
export type EventListener = EventCallback;

export class EventBus {
	private listeners: Map<string, EventListener[]> = new Map();

	on(event: string, callback: EventCallback): () => void {
		if (!this.listeners.has(event)) {
			this.listeners.set(event, []);
		}
		this.listeners.get(event)!.push(callback);
		return () => {
			this.off(event, callback);
		};
	}

	emit(event: string, data?: any): void {
		const listeners = this.listeners.get(event);
		if (listeners) {
			const listenersCopy = [...listeners];
			listenersCopy.forEach((callback) => {
				try {
					callback(data);
				} catch (error) {
					console.error(
						`Error in event listener for ${event}:`,
						error
					);
					throw error;
				}
			});
		}
	}

	off(event: string, callback: EventCallback): void {
		const listeners = this.listeners.get(event);
		if (listeners) {
			const index = listeners.indexOf(callback);
			if (index > -1) {
				listeners.splice(index, 1);
			}
			if (listeners.length === 0) {
				this.listeners.delete(event);
			}
		}
	}

	clear(event?: string): void {
		if (event) {
			this.listeners.delete(event);
		} else {
			this.listeners.clear();
		}
	}

	getListenerCount(event?: string): number {
		if (event) {
			return this.listeners.get(event)?.length || 0;
		}
		let total = 0;
		for (const listeners of this.listeners.values()) {
			total += listeners.length;
		}
		return total;
	}
}
