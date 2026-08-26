'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { UserRound } from 'lucide-react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { useAccountActions } from '@/lib/auth/use-account-actions';
import { profileFormSchema, type ProfileFormValues } from '@/lib/profile/profile-schema';

type ProfileSettingsProps = {
	currentFirstName: string | null;
	currentLastName: string | null;
	currentUsername: string | null;
};

export function ProfileSettings({ currentFirstName, currentLastName, currentUsername }: ProfileSettingsProps) {
	const accountActions = useAccountActions();
	const isBusy = accountActions.isBusy;
	const form = useForm<ProfileFormValues>({
		defaultValues: {
			username: currentUsername ?? '',
			firstName: currentFirstName ?? '',
			lastName: currentLastName ?? '',
		},
		resolver: zodResolver(profileFormSchema),
	});

	async function handleSubmit(values: ProfileFormValues): Promise<void> {
		await accountActions.updateProfile(values);
	}

	return (
		<section className='design-panel grid max-w-2xl content-start gap-5 p-5 sm:p-6' data-testid='profile-settings'>
			<div className='grid gap-2'>
				<p className='design-section-label w-fit px-3 py-1.5'>Profil</p>
				<h2 className='text-xl font-bold text-foreground'>Persönliche Angaben</h2>
				<p className='design-page-description max-w-2xl'>
					Hinterlege deinen Benutzernamen sowie deinen Vor- und Nachnamen.
				</p>
			</div>

			<form className='grid gap-4' onSubmit={form.handleSubmit(handleSubmit)}>
				<label
					className='grid gap-2'
					htmlFor='profile-username'
					data-invalid={!!form.formState.errors.username}
				>
					<span className='design-label'>Benutzername</span>
					<input
						id='profile-username'
						type='text'
						autoComplete='username'
						className='design-input w-full'
						aria-invalid={!!form.formState.errors.username}
						aria-describedby={form.formState.errors.username ? 'profile-username-error' : undefined}
						disabled={isBusy}
						data-testid='profile-username-input'
						{...form.register('username')}
					/>
					{form.formState.errors.username?.message ? (
						<span id='profile-username-error' className='design-field-error px-1'>
							{form.formState.errors.username.message}
						</span>
					) : null}
				</label>

				<div className='grid gap-4 sm:grid-cols-2'>
					<label
						className='grid gap-2'
						htmlFor='profile-first-name'
						data-invalid={!!form.formState.errors.firstName}
					>
						<span className='design-label'>Vorname</span>
						{/* eslint-disable jsx-a11y/autocomplete-valid -- oxlint doesn't recognise this valid html autocomplete token */}
						<input
							id='profile-first-name'
							type='text'
							autoComplete='given-name'
							className='design-input w-full'
							aria-invalid={!!form.formState.errors.firstName}
							aria-describedby={form.formState.errors.firstName ? 'profile-first-name-error' : undefined}
							disabled={isBusy}
							data-testid='profile-first-name-input'
							{...form.register('firstName')}
						/>
						{/* eslint-enable jsx-a11y/autocomplete-valid */}
						{form.formState.errors.firstName?.message ? (
							<span id='profile-first-name-error' className='design-field-error px-1'>
								{form.formState.errors.firstName.message}
							</span>
						) : null}
					</label>

					<label
						className='grid gap-2'
						htmlFor='profile-last-name'
						data-invalid={!!form.formState.errors.lastName}
					>
						<span className='design-label'>Nachname</span>
						{/* eslint-disable jsx-a11y/autocomplete-valid -- oxlint doesn't recognise this valid html autocomplete token */}
						<input
							id='profile-last-name'
							type='text'
							autoComplete='family-name'
							className='design-input w-full'
							aria-invalid={!!form.formState.errors.lastName}
							aria-describedby={form.formState.errors.lastName ? 'profile-last-name-error' : undefined}
							disabled={isBusy}
							data-testid='profile-last-name-input'
							{...form.register('lastName')}
						/>
						{/* eslint-enable jsx-a11y/autocomplete-valid */}
						{form.formState.errors.lastName?.message ? (
							<span id='profile-last-name-error' className='design-field-error px-1'>
								{form.formState.errors.lastName.message}
							</span>
						) : null}
					</label>
				</div>

				<Button type='submit' variant='strong' size='xl' disabled={isBusy} data-testid='save-profile-button'>
					<UserRound data-icon='inline-start' aria-hidden='true' />
					{accountActions.isRunning('update-profile') ? 'Speichere...' : 'Profil speichern'}
				</Button>
			</form>
		</section>
	);
}
