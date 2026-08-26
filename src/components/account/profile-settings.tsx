'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { AtSign, UserRound } from 'lucide-react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
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
	const accountActions = useAccountActions();
	const isBusy = accountActions.isBusy;
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
		await accountActions.updateUsername(values.username);
	}

	async function handleSaveName(values: NameFormValues): Promise<void> {
		await accountActions.updateName(values);
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
					<label
						className='grid gap-2'
						htmlFor='profile-username'
						data-invalid={!!usernameForm.formState.errors.username}
					>
						<span className='design-label'>Benutzername</span>
						<input
							id='profile-username'
							type='text'
							autoComplete='username'
							className='design-input w-full'
							aria-invalid={!!usernameForm.formState.errors.username}
							aria-describedby={
								usernameForm.formState.errors.username ? 'profile-username-error' : undefined
							}
							disabled={isBusy}
							data-testid='profile-username-input'
							{...usernameForm.register('username')}
						/>
						{usernameForm.formState.errors.username?.message ? (
							<span id='profile-username-error' className='design-field-error px-1'>
								{usernameForm.formState.errors.username.message}
							</span>
						) : null}
					</label>

					<Button
						type='submit'
						variant='strong'
						size='xl'
						disabled={isBusy}
						data-testid='save-username-button'
					>
						<AtSign data-icon='inline-start' aria-hidden='true' />
						{accountActions.isRunning('update-username') ? 'Speichere...' : 'Benutzername speichern'}
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
					<label
						className='grid gap-2'
						htmlFor='profile-first-name'
						data-invalid={!!nameForm.formState.errors.firstName}
					>
						<span className='design-label'>Vorname</span>
						{/* eslint-disable jsx-a11y/autocomplete-valid -- oxlint doesn't recognise this valid html autocomplete token */}
						<input
							id='profile-first-name'
							type='text'
							autoComplete='given-name'
							className='design-input w-full'
							aria-invalid={!!nameForm.formState.errors.firstName}
							aria-describedby={
								nameForm.formState.errors.firstName ? 'profile-first-name-error' : undefined
							}
							disabled={isBusy}
							data-testid='profile-first-name-input'
							{...nameForm.register('firstName')}
						/>
						{/* eslint-enable jsx-a11y/autocomplete-valid */}
						{nameForm.formState.errors.firstName?.message ? (
							<span id='profile-first-name-error' className='design-field-error px-1'>
								{nameForm.formState.errors.firstName.message}
							</span>
						) : null}
					</label>

					<label
						className='grid gap-2'
						htmlFor='profile-last-name'
						data-invalid={!!nameForm.formState.errors.lastName}
					>
						<span className='design-label'>Nachname</span>
						{/* eslint-disable jsx-a11y/autocomplete-valid -- oxlint doesn't recognise this valid html autocomplete token */}
						<input
							id='profile-last-name'
							type='text'
							autoComplete='family-name'
							className='design-input w-full'
							aria-invalid={!!nameForm.formState.errors.lastName}
							aria-describedby={
								nameForm.formState.errors.lastName ? 'profile-last-name-error' : undefined
							}
							disabled={isBusy}
							data-testid='profile-last-name-input'
							{...nameForm.register('lastName')}
						/>
						{/* eslint-enable jsx-a11y/autocomplete-valid */}
						{nameForm.formState.errors.lastName?.message ? (
							<span id='profile-last-name-error' className='design-field-error px-1'>
								{nameForm.formState.errors.lastName.message}
							</span>
						) : null}
					</label>

					<Button type='submit' variant='strong' size='xl' disabled={isBusy} data-testid='save-name-button'>
						<UserRound data-icon='inline-start' aria-hidden='true' />
						{accountActions.isRunning('update-name') ? 'Speichere...' : 'Name speichern'}
					</Button>
				</form>
			</section>
		</div>
	);
}
