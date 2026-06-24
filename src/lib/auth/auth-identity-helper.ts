const EMAIL_NAME_SEPARATOR = '@';

export class AuthIdentityHelper {
	public getDefaultName(email: string): string {
		const [name] = email.split(EMAIL_NAME_SEPARATOR);
		const trimmedName = name?.trim();

		if (!trimmedName) {
			return email;
		}

		return trimmedName;
	}
}

export const authIdentityHelper = new AuthIdentityHelper();
