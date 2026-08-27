'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { AtSign, UserRound } from 'lucide-react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { useAccountActions } from '@/lib/auth/use-account-actions';
import {
	nameFormSchema,
	usernameFormSchema,
	type NameFormValues,
	type UsernameFormValues,
} from '@/lib/profile/profile-schema';

type ProfileSettingsProps = {
	currentFirstName: string | null;
	currentLastName: string | null;
	currentUsername: string | null;
};

export function ProfileSettings({ currentFirstName, currentLastName, currentUsername }: ProfileSettingsProps) {
	// one hook for both forms: the two writes hit the same user record, so they never run at once
	const { actions, isBusy, isRunning } = useAccountActions();
	const usernameForm = useForm<UsernameFormValues>({
		defaultValues: {
			username: currentUsername ?? '',
		},
		resolver: zodResolver(usernameFormSchema),
	});
	const nameForm = useForm<NameFormValues>({
		defaultValues: {
			firstName: currentFirstName ?? '',
			lastName: currentLastName ?? '',
		},
		resolver: zodResolver(nameFormSchema),
	});

	async function handleSaveUsername(values: UsernameFormValues): Promise<void> {
		await actions.updateUsername(values.username);
	}

	async function handleSaveName(values: NameFormValues): Promise<void> {
		await actions.updateName(values);
	}

	return (
		<div className='grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.8fr)]' data-testid='profile-settings'>
			<section
				className='design-panel grid content-start gap-5 p-5 sm:p-6'
				data-testid='profile-username-section'
			>
				<div className='grid gap-2'>
					<p className='design-section-label w-fit px-3 py-1.5'>Benutzername</p>
					<h2 className='text-xl font-bold text-foreground'>Öffentlicher Name</h2>
					<p className='design-page-description max-w-2xl'>
						Unter diesem Namen bist du in der App sichtbar. Du kannst ihn jederzeit ändern, unabhängig von
						deinem Vor- und Nachnamen.
					</p>
				</div>

				<form className='grid gap-4' onSubmit={usernameForm.handleSubmit(handleSaveUsername)}>
					<FormField
						id='profile-username'
						label='Benutzername'
						type='text'
						autoComplete='username'
						error={usernameForm.formState.errors.username?.message}
						disabled={isBusy}
						{...usernameForm.register('username')}
					/>

					<Button
						type='submit'
						variant='strong'
						size='xl'
						disabled={isBusy}
						data-testid='save-username-button'
					>
						<AtSign data-icon='inline-start' aria-hidden='true' />
						{isRunning('update-username') ? 'Speichere...' : 'Benutzername speichern'}
					</Button>
				</form>
			</section>

			<section className='design-panel grid content-start gap-5 p-5 sm:p-6' data-testid='profile-name-section'>
				<div className='grid gap-2'>
					<p className='design-section-label w-fit px-3 py-1.5'>Profil</p>
					<h2 className='text-xl font-bold text-foreground'>Persönliche Angaben</h2>
					<p className='design-page-description'>Hinterlege deinen Vor- und Nachnamen.</p>
				</div>

				<form className='grid gap-4' onSubmit={nameForm.handleSubmit(handleSaveName)}>
					<FormField
						id='profile-first-name'
						label='Vorname'
						type='text'
						autoComplete='given-name'
						error={nameForm.formState.errors.firstName?.message}
						disabled={isBusy}
						{...nameForm.register('firstName')}
					/>

					<FormField
						id='profile-last-name'
						label='Nachname'
						type='text'
						autoComplete='family-name'
						error={nameForm.formState.errors.lastName?.message}
						disabled={isBusy}
						{...nameForm.register('lastName')}
					/>

					<Button type='submit' variant='strong' size='xl' disabled={isBusy} data-testid='save-name-button'>
						<UserRound data-icon='inline-start' aria-hidden='true' />
						{isRunning('update-name') ? 'Speichere...' : 'Name speichern'}
					</Button>
				</form>
			</section>
		</div>
	);
}
