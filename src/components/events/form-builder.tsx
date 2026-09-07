'use client';

import { Archive, ArrowDown, ArrowUp, Plus, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import type { FormFieldRecord } from '@/lib/events/event-repository';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { addFormField, moveFormField, retireFormField, updateFormField } from '@/lib/events/form-actions';

type FormBuilderProps = {
	eventId: string;
	fields: FormFieldRecord[];
};

type Draft = {
	helpText: string;
	label: string;
	onlyWhenAttending: boolean;
	options: string;
	required: boolean;
	scope: 'guest' | 'invitation';
	type: 'checkbox' | 'radio' | 'select' | 'text' | 'textarea';
};

const TYPE_LABELS = {
	checkbox: 'Mehrfachauswahl',
	radio: 'Auswahl (Radio)',
	select: 'Auswahl (Liste)',
	text: 'Text',
	textarea: 'Text, mehrzeilig',
} as const;

const CHOICE_TYPES = new Set(['checkbox', 'radio', 'select']);

const EMPTY_DRAFT: Draft = {
	helpText: '',
	label: '',
	onlyWhenAttending: false,
	options: '',
	required: false,
	scope: 'guest',
	type: 'text',
};

function toDraft(field: FormFieldRecord): Draft {
	return {
		helpText: field.helpText ?? '',
		label: field.label,
		onlyWhenAttending: field.onlyWhenAttending,
		options: field.options.map((option) => option.label).join('\n'),
		required: field.required,
		scope: field.scope,
		type: field.type,
	};
}

async function report(action: Promise<{ message?: string; success: boolean }>, message: string): Promise<boolean> {
	const result = await action;

	if (result.success) {
		toast.success(message);

		return true;
	}

	toast.error(result.message ?? 'Das hat nicht geklappt.');

	return false;
}

function FieldEditor({
	draft,
	onCancel,
	onChange,
	onSave,
	submitLabel,
}: {
	draft: Draft;
	onCancel?: () => void;
	onChange: (draft: Draft) => void;
	onSave: () => void;
	submitLabel: string;
}) {
	return (
		<div className='grid gap-3' data-testid='field-editor'>
			<label className='grid gap-1'>
				<span className='design-label'>Frage</span>
				<Input
					className='design-input'
					data-testid='field-label'
					onChange={(nativeEvent) => onChange({ ...draft, label: nativeEvent.target.value })}
					placeholder='z. B. Menüwunsch'
					value={draft.label}
				/>
			</label>

			<label className='grid gap-1'>
				<span className='design-label'>Hinweis (optional)</span>
				<Input
					className='design-input'
					onChange={(nativeEvent) => onChange({ ...draft, helpText: nativeEvent.target.value })}
					value={draft.helpText}
				/>
			</label>

			<div className='grid gap-3 sm:grid-cols-2'>
				<label className='grid gap-1'>
					<span className='design-label'>Feldart</span>
					<select
						className='design-input'
						data-testid='field-type'
						onChange={(nativeEvent) =>
							onChange({ ...draft, type: nativeEvent.target.value as Draft['type'] })
						}
						value={draft.type}
					>
						{Object.entries(TYPE_LABELS).map(([value, label]) => (
							<option key={value} value={value}>
								{label}
							</option>
						))}
					</select>
				</label>

				<label className='grid gap-1'>
					<span className='design-label'>Wen fragt das Feld?</span>
					<select
						className='design-input'
						data-testid='field-scope'
						onChange={(nativeEvent) =>
							onChange({ ...draft, scope: nativeEvent.target.value as Draft['scope'] })
						}
						value={draft.scope}
					>
						<option value='guest'>Jede Person einzeln</option>
						<option value='invitation'>Einmal die ganze Einladung</option>
					</select>
				</label>
			</div>

			{CHOICE_TYPES.has(draft.type) ? (
				<label className='grid gap-1'>
					<span className='design-label'>Auswahlmöglichkeiten, eine pro Zeile</span>
					<Textarea
						data-testid='field-options'
						onChange={(nativeEvent) => onChange({ ...draft, options: nativeEvent.target.value })}
						rows={3}
						value={draft.options}
					/>
				</label>
			) : null}

			<div className='flex flex-wrap gap-4'>
				<label className='flex items-center gap-2 text-sm'>
					<Checkbox
						checked={draft.required}
						data-testid='field-required'
						onCheckedChange={(checked) => onChange({ ...draft, required: Boolean(checked) })}
					/>
					Pflichtfeld
				</label>

				{draft.scope === 'guest' ? (
					<label className='flex items-center gap-2 text-sm'>
						<Checkbox
							checked={draft.onlyWhenAttending}
							data-testid='field-only-attending'
							onCheckedChange={(checked) => onChange({ ...draft, onlyWhenAttending: Boolean(checked) })}
						/>
						Nur zeigen, wenn zugesagt
					</label>
				) : null}
			</div>

			<div className='flex gap-2'>
				<Button
					data-testid='field-save'
					disabled={!draft.label.trim()}
					onClick={onSave}
					size='xl'
					variant='strong'
				>
					{submitLabel}
				</Button>
				{onCancel ? (
					<Button onClick={onCancel} size='xl' variant='outline'>
						Abbrechen
					</Button>
				) : null}
			</div>
		</div>
	);
}

export function FormBuilder({ eventId, fields }: FormBuilderProps) {
	const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
	const [isAdding, setIsAdding] = useState(false);
	const [editing, setEditing] = useState<null | string>(null);
	const [editDraft, setEditDraft] = useState<Draft>(EMPTY_DRAFT);

	return (
		<div className='grid gap-4' data-testid='form-builder'>
			<div className='flex flex-wrap items-center justify-between gap-2'>
				<p className='text-sm text-ink-soft'>
					Zu- und Absage fragt das Formular immer. Alles Weitere legst du hier fest.
				</p>
				<Button
					data-testid='add-question'
					onClick={() => {
						setDraft(EMPTY_DRAFT);
						setIsAdding(!isAdding);
					}}
					size='sm'
					variant={isAdding ? 'ghost' : 'outline'}
				>
					{isAdding ? <X /> : <Plus />} {isAdding ? 'Abbrechen' : 'Frage hinzufügen'}
				</Button>
			</div>

			{isAdding ? (
				<section className='design-panel grid gap-3 p-5 sm:p-6'>
					<h2 className='design-label'>Neue Frage</h2>
					<FieldEditor
						draft={draft}
						onCancel={() => setIsAdding(false)}
						onChange={setDraft}
						onSave={async () => {
							if (await report(addFormField(eventId, draft), 'Frage hinzugefügt.')) {
								setDraft(EMPTY_DRAFT);
								setIsAdding(false);
							}
						}}
						submitLabel='Frage hinzufügen'
					/>
				</section>
			) : null}

			{fields.length === 0 ? (
				<p className='design-panel px-6 py-8 text-sm text-ink-soft' data-testid='form-empty'>
					Noch keine Fragen. Zu- und Absage funktionieren auch ohne — alles weitere ist optional.
				</p>
			) : (
				<ul className='grid gap-3' data-testid='form-field-list'>
					{fields.map((field, index) => (
						<li
							className='design-panel grid gap-3 p-5 sm:p-6'
							data-testid={`form-field-${field.id}`}
							key={field.id}
						>
							{editing === field.id ? (
								<FieldEditor
									draft={editDraft}
									onCancel={() => setEditing(null)}
									onChange={setEditDraft}
									onSave={async () => {
										if (
											await report(
												updateFormField(eventId, field.id, editDraft),
												'Frage gespeichert.'
											)
										) {
											setEditing(null);
										}
									}}
									submitLabel='Änderung speichern'
								/>
							) : (
								<>
									<div className='flex flex-wrap items-center justify-between gap-2'>
										<div className='grid gap-1'>
											<h3 className='font-bold'>{field.label}</h3>
											<div className='flex flex-wrap gap-1.5'>
												<Badge variant='outline'>{TYPE_LABELS[field.type]}</Badge>
												<Badge variant='outline'>
													{field.scope === 'guest' ? 'pro Person' : 'pro Einladung'}
												</Badge>
												{field.required ? <Badge variant='secondary'>Pflicht</Badge> : null}
												{field.onlyWhenAttending ? (
													<Badge variant='secondary'>nur bei Zusage</Badge>
												) : null}
											</div>
										</div>
										<div className='flex gap-1'>
											<Button
												aria-label='Nach oben'
												disabled={index === 0}
												onClick={() =>
													void report(
														moveFormField(eventId, field.id, fields[index - 1]!.id),
														'Reihenfolge geändert.'
													)
												}
												size='icon-sm'
												variant='ghost'
											>
												<ArrowUp />
											</Button>
											<Button
												aria-label='Nach unten'
												disabled={index === fields.length - 1}
												onClick={() =>
													void report(
														moveFormField(eventId, field.id, fields[index + 1]!.id),
														'Reihenfolge geändert.'
													)
												}
												size='icon-sm'
												variant='ghost'
											>
												<ArrowDown />
											</Button>
											<Button
												data-testid={`edit-field-${field.id}`}
												onClick={() => {
													setEditing(field.id);
													setEditDraft(toDraft(field));
												}}
												size='sm'
												variant='outline'
											>
												Bearbeiten
											</Button>
											<Button
												data-testid={`retire-field-${field.id}`}
												onClick={() =>
													void report(
														retireFormField(eventId, field.id),
														'Frage zurückgezogen.'
													)
												}
												size='sm'
												variant='ghost'
											>
												<Archive /> Zurückziehen
											</Button>
										</div>
									</div>
									{field.options.length > 0 ? (
										<p className='text-sm text-ink-soft'>
											{field.options.map((option) => option.label).join(' · ')}
										</p>
									) : null}
								</>
							)}
						</li>
					))}
				</ul>
			)}

			<p className='text-xs text-ink-soft'>
				Zurückgezogene Fragen verschwinden aus dem Formular. Bereits gegebene Antworten bleiben im Export
				erhalten.
			</p>
		</div>
	);
}
