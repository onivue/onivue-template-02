'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Fingerprint, LogOut, Mail, Plus, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { APP_ROUTES } from '@/components/layout/navigation.config';
import { Button } from '@/components/ui/button';
import { authClient } from '@/lib/auth/auth-client';
import { authErrorHelper } from '@/lib/auth/auth-error-helper';

const passkeySchema = z.object({
	name: z.string().trim().min(2, 'Bitte gib mindestens 2 Zeichen ein.').max(48, 'Der Name ist zu lang.'),
});

const emailChangeSchema = z.object({
	email: z.string().trim().email('Bitte gib eine gültige E-Mail-Adresse ein.'),
});

type AccountSettingsProps = {
	currentEmail: string;
};

type PasskeyFormValues = z.infer<typeof passkeySchema>;
type EmailChangeFormValues = z.infer<typeof emailChangeSchema>;

type AccountActionState =
	| { status: 'idle' }
	| { status: 'adding-passkey' }
	| { status: 'changing-email' }
	| { status: 'deleting-passkey'; id: string }
	| { status: 'signing-out' };

export function AccountSettings({ currentEmail }: AccountSettingsProps) {
	const router = useRouter();
	const passkeyQuery = authClient.useListPasskeys();
	const session = authClient.useSession();
	const [actionState, setActionState] = useState<AccountActionState>({ status: 'idle' });
	const activeEmail = session.data?.user.email ?? currentEmail;
	const passkeys = passkeyQuery.data ?? [];
	const isBusy = actionState.status !== 'idle';
	const passkeyForm = useForm<PasskeyFormValues>({
		defaultValues: {
			name: 'Mein Passkey',
		},
		resolver: zodResolver(passkeySchema),
	});
	const emailForm = useForm<EmailChangeFormValues>({
		defaultValues: {
			email: activeEmail,
		},
		resolver: zodResolver(emailChangeSchema),
	});

	async function handleAddPasskey(values: PasskeyFormValues): Promise<void> {
		setActionState({ status: 'adding-passkey' });

		try {
			const { error } = await authClient.passkey.addPasskey({
				name: values.name,
			});

			if (error) {
				toast.error(authErrorHelper.getUserMessage(error, 'Der Passkey konnte nicht erstellt werden.'));
				return;
			}

			passkeyForm.reset({ name: 'Mein Passkey' });
			toast.success('Passkey wurde erstellt.');
			await passkeyQuery.refetch();
		} catch (error) {
			toast.error(
				authErrorHelper.getUserMessage(
					error instanceof Error ? { message: error.message } : null,
					'Der Passkey konnte nicht erstellt werden.'
				)
			);
		} finally {
			setActionState({ status: 'idle' });
		}
	}

	async function handleDeletePasskey(id: string): Promise<void> {
		setActionState({ status: 'deleting-passkey', id });

		try {
			const { error } = await authClient.passkey.deletePasskey({
				id,
			});

			if (error) {
				toast.error(authErrorHelper.getUserMessage(error, 'Der Passkey konnte nicht entfernt werden.'));
				return;
			}

			toast.success('Passkey wurde entfernt.');
			await passkeyQuery.refetch();
		} catch (error) {
			toast.error(
				authErrorHelper.getUserMessage(
					error instanceof Error ? { message: error.message } : null,
					'Der Passkey konnte nicht entfernt werden.'
				)
			);
		} finally {
			setActionState({ status: 'idle' });
		}
	}

	async function handleChangeEmail(values: EmailChangeFormValues): Promise<void> {
		setActionState({ status: 'changing-email' });

		try {
			const { error } = await authClient.changeEmail({
				callbackURL: APP_ROUTES.ACCOUNT,
				newEmail: values.email,
			});

			if (error) {
				toast.error(
					authErrorHelper.getUserMessage(error, 'Die E-Mail-Änderung konnte nicht gestartet werden.')
				);
				return;
			}

			toast.success('Bestätigungslink gesendet. Bitte prüfe deine aktuelle E-Mail-Adresse.');
		} catch (error) {
			toast.error(
				authErrorHelper.getUserMessage(
					error instanceof Error ? { message: error.message } : null,
					'Die E-Mail-Änderung konnte nicht gestartet werden.'
				)
			);
		} finally {
			setActionState({ status: 'idle' });
		}
	}

	async function handleSignOut(): Promise<void> {
		setActionState({ status: 'signing-out' });

		try {
			await authClient.signOut();
			toast.success('Du bist abgemeldet.');
			router.push(APP_ROUTES.LOGIN);
			router.refresh();
		} catch (error) {
			toast.error(
				authErrorHelper.getUserMessage(
					error instanceof Error ? { message: error.message } : null,
					'Abmelden ist fehlgeschlagen.'
				)
			);
			setActionState({ status: 'idle' });
		}
	}

	return (
		<div className='grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.8fr)]' data-testid='account-settings'>
			<section className='design-panel grid gap-5 p-5 sm:p-6' data-testid='account-passkeys-section'>
				<div className='grid gap-2'>
					<p className='design-section-label w-fit px-3 py-1'>Passkeys</p>
					<h2 className='text-xl font-bold text-foreground'>Anmeldung ohne Passwort</h2>
					<p className='design-page-description max-w-2xl'>
						Erstelle nach deinem ersten Login einen Passkey für dieses Gerät und melde dich künftig direkt
						damit an.
					</p>
				</div>

				<form
					className='grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]'
					onSubmit={passkeyForm.handleSubmit(handleAddPasskey)}
				>
					<label
						className='grid gap-2'
						htmlFor='passkey-name'
						data-invalid={!!passkeyForm.formState.errors.name}
					>
						<span className='design-auth-label'>Name</span>
						<input
							id='passkey-name'
							type='text'
							autoComplete='webauthn'
							className='design-auth-input w-full'
							aria-invalid={!!passkeyForm.formState.errors.name}
							disabled={isBusy}
							data-testid='passkey-name-input'
							{...passkeyForm.register('name')}
						/>
						{passkeyForm.formState.errors.name?.message ? (
							<span className='text-xs font-semibold text-destructive'>
								{passkeyForm.formState.errors.name.message}
							</span>
						) : null}
					</label>
					<Button
						type='submit'
						size='lg'
						className='justify-self-center rounded-full bg-foreground px-4 text-primary hover:bg-foreground/90 sm:mt-[1.36rem] sm:self-start'
						disabled={isBusy}
						data-testid='add-passkey-button'
					>
						<Plus data-icon='inline-start' aria-hidden='true' />
						{actionState.status === 'adding-passkey' ? 'Erstelle...' : 'Passkey erstellen'}
					</Button>
				</form>

				<div className='grid gap-3' data-testid='passkey-list'>
					{passkeyQuery.isPending ? (
						<div className='rounded-2xl border border-border bg-muted/40 p-4 text-sm font-medium text-muted-foreground'>
							Passkeys werden geladen...
						</div>
					) : null}
					{!passkeyQuery.isPending && passkeys.length === 0 ? (
						<div className='rounded-2xl border border-border bg-muted/40 p-4 text-sm font-medium text-muted-foreground'>
							Noch kein Passkey hinterlegt.
						</div>
					) : null}
					{passkeys.map((passkey) => (
						<div
							key={passkey.id}
							className='grid gap-3 rounded-2xl border border-border bg-background p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center'
							data-testid='passkey-list-item'
						>
							<div className='flex min-w-0 items-center gap-3'>
								<div className='flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground'>
									<Fingerprint aria-hidden='true' />
								</div>
								<div className='min-w-0'>
									<p className='truncate font-bold text-foreground'>{passkey.name ?? 'Passkey'}</p>
									<p className='text-xs font-semibold text-muted-foreground'>{passkey.deviceType}</p>
								</div>
							</div>
							<Button
								type='button'
								variant='destructive'
								size='sm'
								disabled={isBusy}
								onClick={() => void handleDeletePasskey(passkey.id)}
								data-testid='delete-passkey-button'
							>
								<Trash2 data-icon='inline-start' aria-hidden='true' />
								{actionState.status === 'deleting-passkey' && actionState.id === passkey.id
									? 'Entferne...'
									: 'Entfernen'}
							</Button>
						</div>
					))}
				</div>
			</section>

			<section className='design-panel grid content-start gap-5 p-5 sm:p-6' data-testid='account-email-section'>
				<div className='grid gap-2'>
					<p className='design-section-label w-fit px-3 py-1'>E-Mail</p>
					<h2 className='text-xl font-bold text-foreground'>Adresse ändern</h2>
					<p className='design-page-description'>Aktuelle E-Mail: {activeEmail}</p>
				</div>

				<form className='grid gap-3' onSubmit={emailForm.handleSubmit(handleChangeEmail)}>
					<label
						className='grid gap-2'
						htmlFor='account-email'
						data-invalid={!!emailForm.formState.errors.email}
					>
						<span className='design-auth-label'>Neue E-Mail</span>
						<input
							id='account-email'
							type='email'
							autoComplete='email'
							className='design-auth-input w-full'
							aria-invalid={!!emailForm.formState.errors.email}
							disabled={isBusy}
							data-testid='account-email-input'
							{...emailForm.register('email')}
						/>
						{emailForm.formState.errors.email?.message ? (
							<span className='text-xs font-semibold text-destructive'>
								{emailForm.formState.errors.email.message}
							</span>
						) : null}
					</label>
					<Button
						type='submit'
						size='lg'
						className='rounded-full bg-foreground text-primary hover:bg-foreground/90'
						disabled={isBusy}
						data-testid='change-email-button'
					>
						<Mail data-icon='inline-start' aria-hidden='true' />
						{actionState.status === 'changing-email' ? 'Sende...' : 'Änderung bestätigen'}
					</Button>
				</form>

				<Button
					type='button'
					variant='outline'
					size='lg'
					className='rounded-full'
					disabled={isBusy}
					onClick={() => void handleSignOut()}
					data-testid='sign-out-button'
				>
					<LogOut data-icon='inline-start' aria-hidden='true' />
					{actionState.status === 'signing-out' ? 'Melde ab...' : 'Abmelden'}
				</Button>
			</section>
		</div>
	);
}
