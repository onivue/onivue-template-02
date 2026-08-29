'use client';

import { useRef, useState } from 'react';
import { toast } from 'sonner';

import type { EventTheme, ThemeFont, ThemeMode } from '@/lib/events/event-theme';
import type { FormFieldDefinition } from '@/lib/events/form-schema';

import { InvitationPage } from '@/components/events/invitation-page';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { updateEventTheme } from '@/lib/events/event-actions';
import { readableForeground, THEME_FONTS } from '@/lib/events/event-theme';
import { removeHeaderImage, uploadHeaderImage } from '@/lib/events/image-actions';

type ThemeEditorProps = {
	// resolved on the server: the bucket is private, so this is a short-lived signed url
	headerImageUrl: null | string;
	// without storage credentials the upload stays visible but explains itself
	isStorageConfigured: boolean;
	event: {
		endsAt: Date | null;
		greeting: null | string;
		location: null | string;
		startsAt: Date | null;
		title: string;
	};
	eventId: string;
	fields: FormFieldDefinition[];
	theme: EventTheme;
};

const MODES = [
	{ label: 'Hell', value: 'light' },
	{ label: 'Dunkel', value: 'dark' },
] as const satisfies readonly { label: string; value: ThemeMode }[];

// two sample guests, so the preview shows what the form does rather than an empty frame
const PREVIEW_GUESTS = [
	{ firstName: 'Anna', id: 'preview-1', lastName: 'Meier', respondedAt: null, response: 'accepted' as const },
	{ firstName: 'Ben', id: 'preview-2', lastName: 'Meier', respondedAt: null, response: 'open' as const },
];

export function ThemeEditor({ event, eventId, fields, headerImageUrl, isStorageConfigured, theme }: ThemeEditorProps) {
	const [draft, setDraft] = useState<EventTheme>(theme);
	const [isSaving, setIsSaving] = useState(false);
	const [imageUrl, setImageUrl] = useState<null | string>(headerImageUrl);
	const [isUploading, setIsUploading] = useState(false);
	const fileInput = useRef<HTMLInputElement>(null);

	// uploading writes immediately: a file is not a draft value that waits for a save button
	const upload = async (file: File) => {
		setIsUploading(true);

		const formData = new FormData();

		formData.append('file', file);

		const result = await uploadHeaderImage(eventId, formData);

		setIsUploading(false);

		if (!result.success) {
			toast.error(result.message);

			return;
		}

		setImageUrl(result.data.url);
		toast.success('Kopfbild gespeichert.');
	};

	const removeImage = async () => {
		const result = await removeHeaderImage(eventId);

		if (!result.success) {
			toast.error(result.message);

			return;
		}

		setImageUrl(null);

		if (fileInput.current) {
			fileInput.current.value = '';
		}

		toast.success('Kopfbild entfernt.');
	};

	const save = async () => {
		setIsSaving(true);

		const result = await updateEventTheme(eventId, {
			themeAccent: draft.themeAccent,
			themeFont: draft.themeFont as ThemeFont,
			themeMode: draft.themeMode,
		});

		setIsSaving(false);

		if (result.success) {
			toast.success('Design gespeichert.');

			return;
		}

		toast.error(result.message);
	};

	return (
		<div className='grid gap-5 lg:grid-cols-[20rem_minmax(0,1fr)]' data-testid='theme-editor'>
			<section className='design-panel grid h-fit gap-4 px-4 py-4'>
				<h2 className='design-label'>Gestaltung</h2>

				<label className='grid gap-1'>
					<span className='design-label'>Akzentfarbe</span>
					<span className='flex items-center gap-2'>
						<Input
							className='h-10 w-16 p-1'
							data-testid='theme-accent'
							onChange={(nativeEvent) => setDraft({ ...draft, themeAccent: nativeEvent.target.value })}
							type='color'
							value={draft.themeAccent}
						/>
						<code className='text-xs text-ink-soft'>{draft.themeAccent}</code>
					</span>
					<span className='text-xs text-ink-soft'>
						Die Schriftfarbe darauf wird automatisch gewählt (
						{readableForeground(draft.themeAccent) === '#101010' ? 'dunkel' : 'hell'}
						), damit Text lesbar bleibt.
					</span>
				</label>

				<fieldset className='grid gap-1'>
					<legend className='design-label'>Flächen</legend>
					<div className='flex gap-2'>
						{MODES.map((mode) => (
							<Button
								data-testid={`theme-mode-${mode.value}`}
								key={mode.value}
								onClick={() => setDraft({ ...draft, themeMode: mode.value })}
								size='sm'
								variant={draft.themeMode === mode.value ? 'strong' : 'outline'}
							>
								{mode.label}
							</Button>
						))}
					</div>
				</fieldset>

				<label className='grid gap-1'>
					<span className='design-label'>Schrift</span>
					<select
						className='design-input'
						data-testid='theme-font'
						onChange={(nativeEvent) => setDraft({ ...draft, themeFont: nativeEvent.target.value })}
						value={draft.themeFont}
					>
						{Object.entries(THEME_FONTS).map(([value, font]) => (
							<option key={value} value={value}>
								{font.label}
							</option>
						))}
					</select>
				</label>

				<div className='grid gap-2'>
					<span className='design-label'>Kopfbild (optional)</span>

					{imageUrl ? (
						// eslint-disable-next-line @next/next/no-img-element
						<img
							alt=''
							className='h-28 w-full rounded-xl object-cover'
							data-testid='header-image-preview'
							src={imageUrl}
						/>
					) : null}

					<Input
						accept='image/png,image/jpeg,image/webp,image/avif,image/gif'
						className='design-input h-auto py-1.5 text-xs'
						data-testid='theme-header-image'
						disabled={!isStorageConfigured || isUploading}
						onChange={(nativeEvent) => {
							const file = nativeEvent.target.files?.[0];

							if (file) {
								void upload(file);
							}
						}}
						ref={fileInput}
						type='file'
					/>

					<span className='text-xs text-ink-soft'>
						{isStorageConfigured
							? 'JPEG, PNG, WebP, AVIF oder GIF, bis 5 MB. Das Bild wird sofort gespeichert.'
							: 'Der Bildspeicher ist noch nicht eingerichtet — trage die Zugangsdaten des Buckets in die Umgebung ein.'}
					</span>

					{imageUrl ? (
						<Button
							className='w-fit'
							data-testid='remove-header-image'
							onClick={removeImage}
							size='sm'
							variant='ghost'
						>
							Bild entfernen
						</Button>
					) : null}
				</div>

				<Button data-testid='theme-save' disabled={isSaving} onClick={save} size='xl' variant='strong'>
					{isSaving ? 'Wird gespeichert …' : 'Design speichern'}
				</Button>
			</section>

			<section className='grid gap-2'>
				<div className='flex items-baseline justify-between gap-2'>
					<h2 className='design-label'>Vorschau</h2>
					<p className='text-xs text-ink-soft'>So sieht die Seite für deine Gäste aus.</p>
				</div>
				<div
					className='max-h-[70dvh] overflow-y-auto rounded-3xl border border-border'
					data-testid='theme-preview'
				>
					<InvitationPage
						answers={[]}
						closesAt={null}
						event={event}
						fields={fields}
						guests={PREVIEW_GUESTS}
						headerImageUrl={imageUrl}
						theme={draft}
					/>
				</div>
			</section>
		</div>
	);
}
