'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Fingerprint, Plus, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { authClient } from '@/lib/auth/auth-client';
import { useAccountActions } from '@/lib/auth/use-account-actions';

const DEFAULT_PASSKEY_NAME = 'Mein Passkey';

const passkeySchema = z.object({
	name: z.string().trim().min(2, 'Bitte gib mindestens 2 Zeichen ein.').max(48, 'Der Name ist zu lang.'),
});

type PasskeyFormValues = z.infer<typeof passkeySchema>;

export function AccountSettings() {
	const passkeyQuery = authClient.useListPasskeys();
	const { actions, isBusy, isRunning } = useAccountActions({
		onDataChanged: async () => {
			await passkeyQuery.refetch();
		},
	});
	const passkeys = passkeyQuery.data ?? [];
	const passkeyForm = useForm<PasskeyFormValues>({
		defaultValues: {
			name: DEFAULT_PASSKEY_NAME,
		},
		resolver: zodResolver(passkeySchema),
	});

	async function handleAddPasskey(values: PasskeyFormValues): Promise<void> {
		const outcome = await actions.addPasskey(values.name);

		if (outcome.ok) {
			passkeyForm.reset({ name: DEFAULT_PASSKEY_NAME });
		}
	}

	return (
		<div className='grid gap-6' data-testid='account-settings'>
			<section
				className='design-panel grid content-start gap-5 p-5 sm:p-6'
				data-testid='account-passkeys-section'
			>
				<div className='grid gap-2'>
					<p className='design-section-label w-fit px-3 py-1.5'>Passkeys</p>
					<h2 className='text-xl font-bold text-foreground'>Anmeldung ohne Passwort</h2>
					<p className='design-page-description max-w-2xl'>
						Erstelle nach deinem ersten Login einen Passkey für dieses Gerät und melde dich künftig direkt
						damit an.
					</p>
				</div>

				<form
					className='grid items-end gap-3 sm:grid-cols-[minmax(0,1fr)_auto]'
					onSubmit={passkeyForm.handleSubmit(handleAddPasskey)}
				>
					<FormField
						id='passkey-name'
						label='Name'
						type='text'
						autoComplete='webauthn'
						error={passkeyForm.formState.errors.name?.message}
						disabled={isBusy}
						{...passkeyForm.register('name')}
					/>
					<Button type='submit' variant='strong' size='xl' disabled={isBusy} data-testid='add-passkey-button'>
						<Plus data-icon='inline-start' aria-hidden='true' />
						{isRunning('add-passkey') ? 'Erstelle...' : 'Passkey erstellen'}
					</Button>
				</form>

				<div className='grid gap-3' data-testid='passkey-list'>
					{passkeyQuery.isPending ? (
						<div
							className='grid gap-3 rounded-2xl border border-border bg-muted/50 p-4'
							data-testid='passkey-list-loading'
						>
							<div className='flex items-center gap-3'>
								<div className='size-10 shrink-0 animate-pulse rounded-full bg-foreground/10' />
								<div className='grid w-full gap-2'>
									<div className='h-3.5 w-2/5 animate-pulse rounded-full bg-foreground/10' />
									<div className='h-3 w-1/4 animate-pulse rounded-full bg-foreground/10' />
								</div>
							</div>
							<span className='sr-only'>Passkeys werden geladen...</span>
						</div>
					) : null}
					{!passkeyQuery.isPending && passkeys.length === 0 ? (
						<p
							className='rounded-2xl border border-dashed border-border bg-muted/40 p-4 text-sm font-medium text-muted-foreground'
							data-testid='passkey-list-empty'
						>
							Noch kein Passkey hinterlegt.
						</p>
					) : null}
					{passkeys.map((passkey) => (
						<div
							key={passkey.id}
							className='flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-background p-3 sm:p-4'
							data-testid='passkey-list-item'
						>
							<div className='flex min-w-0 flex-1 items-center gap-3'>
								<span className='flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground'>
									<Fingerprint className='size-5' aria-hidden='true' />
								</span>
								<span className='grid min-w-0'>
									<span className='truncate font-bold text-foreground'>
										{passkey.name ?? 'Passkey'}
									</span>
									<span className='truncate text-xs font-medium text-muted-foreground'>
										{passkey.deviceType}
									</span>
								</span>
							</div>
							<Button
								type='button'
								variant='destructive'
								size='lg'
								className='rounded-full'
								disabled={isBusy}
								onClick={() => void actions.deletePasskey(passkey.id)}
								data-testid='delete-passkey-button'
							>
								<Trash2 data-icon='inline-start' aria-hidden='true' />
								{isRunning('delete-passkey', passkey.id) ? 'Entferne...' : 'Entfernen'}
							</Button>
						</div>
					))}
				</div>
			</section>
		</div>
	);
}
