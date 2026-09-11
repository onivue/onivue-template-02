// the bulk entry path: one line is one invitation, names separated by commas, the first person is
// the main guest. this is how guest lists actually arrive — pasted out of a chat or a note.

const GUEST_SEPARATOR = ',';
const MAX_INVITATIONS = 500;
const MAX_GUESTS_PER_INVITATION = 20;
const MAX_NAME_LENGTH = 80;

export type ParsedGuest = {
	firstName: string;
	lastName: null | string;
};

export type ParsedInvitation = {
	guests: ParsedGuest[];
	line: number;
};

export type GuestListIssue = {
	line: number;
	message: string;
	text: string;
};

export type ParsedGuestList = {
	invitations: ParsedInvitation[];
	issues: GuestListIssue[];
};

// 'Anna Meier' → Anna / Meier; 'Anna von der Heide' → Anna / von der Heide; 'Oma' → Oma / null
export function toGuest(name: string): null | ParsedGuest {
	const parts = name.split(/\s+/).filter(Boolean);
	const [firstName, ...rest] = parts;

	if (!firstName) {
		return null;
	}

	return {
		firstName,
		lastName: rest.length > 0 ? rest.join(' ') : null,
	};
}

function tooLong(guest: ParsedGuest): boolean {
	return guest.firstName.length > MAX_NAME_LENGTH || (guest.lastName?.length ?? 0) > MAX_NAME_LENGTH;
}

export function parseGuestList(input: string): ParsedGuestList {
	const invitations: ParsedInvitation[] = [];
	const issues: GuestListIssue[] = [];

	const lines = input.split('\n');

	for (const [index, rawLine] of lines.entries()) {
		const line = index + 1;
		const text = rawLine.trim();

		if (!text) {
			continue;
		}

		if (invitations.length >= MAX_INVITATIONS) {
			issues.push({ line, message: `Mehr als ${MAX_INVITATIONS} Einladungen auf einmal sind zu viel.`, text });
			break;
		}

		const names = text.split(GUEST_SEPARATOR).map((name) => name.trim());
		const guests = names.map(toGuest).filter((guest) => guest !== null);

		if (guests.length === 0) {
			issues.push({ line, message: 'Hier steht kein Name.', text });
			continue;
		}

		if (guests.length !== names.length) {
			issues.push({ line, message: 'Zwischen zwei Kommas fehlt ein Name.', text });
			continue;
		}

		if (guests.length > MAX_GUESTS_PER_INVITATION) {
			issues.push({
				line,
				message: `Mehr als ${MAX_GUESTS_PER_INVITATION} Personen auf einer Einladung sind zu viel.`,
				text,
			});
			continue;
		}

		if (guests.some(tooLong)) {
			issues.push({ line, message: 'Ein Name ist zu lang.', text });
			continue;
		}

		invitations.push({ guests, line });
	}

	return { invitations, issues };
}
