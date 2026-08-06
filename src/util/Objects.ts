export class Objects {
	static exists(obj: unknown): boolean {
		return obj !== null && obj !== undefined;
	}

	static isNullOrUndefined(obj: unknown): boolean {
		return obj === null || obj === undefined;
	}
}
