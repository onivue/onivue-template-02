import type { ResponseMood } from '@/lib/events/response-mood';

type InvitationMoodProps = {
	mood: ResponseMood;
};

// the ambient answer background. it is decoration only — the summary above it already says who is
// coming — so it never takes a pointer and never reaches a screen reader.
export function InvitationMood({ mood }: InvitationMoodProps) {
	return (
		<div
			aria-hidden='true'
			className='pointer-events-none fixed inset-0 z-0 overflow-hidden animate-in fade-in duration-1000'
			data-testid={`invitation-mood-${mood}`}
		>
			<div
				className={
					mood === 'accepted'
						? 'invitation-celebrate-glow absolute inset-0'
						: 'invitation-regret-glow absolute inset-0'
				}
			/>
		</div>
	);
}
