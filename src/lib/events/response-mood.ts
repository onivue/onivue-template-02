// what the invitation background says once an answer is in: somebody is coming, or nobody is.
export type ResponseMood = 'accepted' | 'declined';

// the answer is only a mood once it has actually been saved — an open form gets a plain page
export function resolveResponseMood(answer: { isAnswered: boolean; isAttending: boolean }): null | ResponseMood {
	if (!answer.isAnswered) {
		return null;
	}

	return answer.isAttending ? 'accepted' : 'declined';
}
