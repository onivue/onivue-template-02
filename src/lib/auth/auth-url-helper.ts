export class AuthUrlHelper {
	public getOrigin(baseUrl: string): string {
		return new URL(baseUrl).origin;
	}

	public getPasskeyRpId(baseUrl: string): string {
		const hostname = new URL(baseUrl).hostname;

		if (hostname === '127.0.0.1') {
			return 'localhost';
		}

		return hostname;
	}
}
