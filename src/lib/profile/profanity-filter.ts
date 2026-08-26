// common german and english profanity, slurs and offensive terms blocked from profile fields
const DEFAULT_BLOCKED_WORDS: readonly string[] = [
	'arsch',
	'arschloch',
	'wichser',
	'wichsen',
	'fotze',
	'hurensohn',
	'hure',
	'schlampe',
	'scheisse',
	'scheiss',
	'ficken',
	'fick',
	'verpiss',
	'missgeburt',
	'spast',
	'spasti',
	'mongo',
	'hackfresse',
	'nazi',
	'hitler',
	'neger',
	'kanake',
	'untermensch',
	'fuck',
	'shit',
	'bitch',
	'asshole',
	'bastard',
	'cunt',
	'pussy',
	'whore',
	'slut',
	'nigger',
	'nigga',
	'faggot',
	'retard',
];

const LEET_SUBSTITUTIONS: Record<string, string> = {
	'0': 'o',
	'1': 'i',
	'3': 'e',
	'4': 'a',
	'5': 's',
	'7': 't',
	$: 's',
	'@': 'a',
};

// folds case, diacritics, leetspeak and separators away, so obfuscated variants still match
function normalize(value: string): string {
	const withoutSharpS = value.replace(/ß/g, 'ss');
	const withoutDiacritics = withoutSharpS.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
	const leetDecoded = [...withoutDiacritics.toLowerCase()].map((char) => LEET_SUBSTITUTIONS[char] ?? char).join('');

	return leetDecoded.replace(/[^a-z]/g, '');
}

export class ProfanityFilter {
	private readonly blockedWords: readonly string[];

	public constructor(blockedWords: readonly string[] = DEFAULT_BLOCKED_WORDS) {
		this.blockedWords = blockedWords.map((word) => normalize(word));
	}

	public containsBlockedWord(value: string): boolean {
		const normalized = normalize(value);

		if (!normalized) {
			return false;
		}

		return this.blockedWords.some((word) => normalized.includes(word));
	}
}

export const profanityFilter = new ProfanityFilter();
