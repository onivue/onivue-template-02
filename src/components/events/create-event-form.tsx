'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { eventPath } from '@/config/routes';
import { createEvent } from '@/lib/events/event-actions';

// creating an event asks for one thing. everything else lives in the event's own settings, so the
// first step is never a form to fill in.
export function CreateEventForm() {
	const router = useRouter();
	const [title, setTitle] = useState('');
	const [isSaving, setIsSaving] = useState(false);

	const submit = async (formEvent: React.FormEvent) => {
		formEvent.preventDefault();
		setIsSaving(true);

		const result = await createEvent({ title });

		setIsSaving(false);

		if (!result.success) {
			toast.error(result.message);

			return;
		}

		setTitle('');
		router.push(eventPath(result.data.eventId, 'settings'));
	};

	return (
		<form className='flex flex-col gap-3 sm:flex-row' data-testid='create-event-form' onSubmit={submit}>
			<Input
				aria-label='Titel des Events'

				data-testid='create-event-title'
				onChange={(nativeEvent) => setTitle(nativeEvent.target.value)}
				placeholder='z. B. Hochzeit von Anna und Ben'
				value={title}
			/>
			<Button
				data-testid='create-event-submit'
				disabled={isSaving || !title.trim()}
				size='xl'
				type='submit'
				variant='strong'
			>
				{isSaving ? 'Wird angelegt …' : 'Event anlegen'}
			</Button>
		</form>
	);
}
