import { Profanity, profaneWords } from '@2toad/profanity';

const LANGUAGES = ['de', 'en'];

// below this length a dictionary entry sits inside too many ordinary names to be matched partially
const PARTIAL_MATCH_MIN_LENGTH = 5;

// terms the package's german dictionary does not carry, but that must not appear in a profile
const MISSING_GERMAN_WORDS: readonly string[] = [
	'ficken',
	'hackfresse',
	'hitler',
	'hurensohn',
	'kanake',
	'missgeburt',
	'neger',
	'spast',
	'spasti',
	'untermensch',
	'verpiss',
];

// the german dictionary is machine-translated and marks these ordinary words as profane, which
// would reject real surnames such as Kummer, Lustig or Kümmel
const MISTRANSLATED_WORDS: readonly string[] = [
	'balle',
	'bälle',
	'blasen',
	'eier',
	'fehler',
	'felgen',
	'glocke',
	'hunde',
	'kokos',
	'kummel',
	'kümmel',
	'kummer',
	'lustig',
	'nusse',
	'nüsse',
	'pfoten',
	'samen',
	'stiche',
	'ziegen',
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

const SHARP_S_PATTERN = /ß/g;
const COMBINING_MARK_PATTERN = /[\u0300-\u036f]/g;
const NON_LETTER_PATTERN = /[^a-z]/g;

function foldToAscii(value: string): string {
	const withoutSharpS = value.replace(SHARP_S_PATTERN, 'ss');

	return withoutSharpS.normalize('NFD').replace(COMBINING_MARK_PATTERN, '').toLowerCase();
}

// folds case, diacritics, leetspeak and separators away, so obfuscated variants still match
function normalize(value: string): string {
	const leetDecoded = [...foldToAscii(value)].map((char) => LEET_SUBSTITUTIONS[char] ?? char).join('');

	return leetDecoded.replace(NON_LETTER_PATTERN, '');
}

function dictionaryWords(): string[] {
	return LANGUAGES.flatMap((language) => profaneWords.get(language) ?? []);
}

// the german dictionary spells entries with eszett and umlauts, which the folded pass could never
// match — so every folded spelling is registered next to the original
function foldedDictionaryWords(): string[] {
	const words = dictionaryWords();

	return words.map(foldToAscii).filter((folded, index) => folded !== words[index]);
}

type MatcherSpec = {
	// dictionary entries this matcher must not use
	drop?: readonly string[];
	wholeWord: boolean;
	words: readonly string[];
};

// removals have to be applied last: adding a word that is currently removed would re-enable it
function createMatcher({ drop = [], wholeWord, words }: MatcherSpec): Profanity {
	const removals = [...MISTRANSLATED_WORDS, ...drop];
	const removed = new Set(removals);
	const matcher = new Profanity({
		languages: LANGUAGES,
		wholeWord,
		// german input is full of diacritics, so word boundaries have to be unicode-aware
		unicodeWordBoundaries: true,
	});

	matcher.addWords(words.filter((word) => !removed.has(word)));
	matcher.removeWords([...removals]);

	return matcher;
}

function isLongEnoughForPartialMatch(word: string): boolean {
	return word.length >= PARTIAL_MATCH_MIN_LENGTH;
}

export class ProfanityFilter {
	private readonly wholeWordMatcher: Profanity;
	private readonly partialMatcher: Profanity;

	// additional words extend the shipped dictionaries rather than replacing them
	public constructor(additionalWords: readonly string[] = []) {
		const extraWords = [...foldedDictionaryWords(), ...MISSING_GERMAN_WORDS, ...additionalWords];

		this.wholeWordMatcher = createMatcher({ wholeWord: true, words: extraWords });
		// only long entries are unambiguous enough to be caught inside a longer handle like 'xXfuckerXx'
		this.partialMatcher = createMatcher({
			drop: dictionaryWords().filter((word) => !isLongEnoughForPartialMatch(word)),
			wholeWord: false,
			words: extraWords.filter(isLongEnoughForPartialMatch),
		});
	}

	public containsBlockedWord(value: string): boolean {
		// the raw pass keeps word boundaries and original spellings intact, the folded one defeats obfuscation
		if (this.wholeWordMatcher.exists(value)) {
			return true;
		}

		const normalized = normalize(value);

		return this.wholeWordMatcher.exists(normalized) || this.partialMatcher.exists(normalized);
	}
}

export const profanityFilter = new ProfanityFilter();
