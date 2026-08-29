'use client';

import type { AnswerValue, FormFieldDefinition } from '@/lib/events/form-schema';

import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';

type InvitationFieldProps = {
	disabled?: boolean;
	error?: string;
	field: FormFieldDefinition;
	onChange: (value: AnswerValue) => void;
	value: AnswerValue;
};

function toText(value: AnswerValue): string {
	return Array.isArray(value) ? (value[0] ?? '') : value;
}

function toList(value: AnswerValue): string[] {
	return Array.isArray(value) ? value : value ? [value] : [];
}

// one field, rendered the same way on the guest page and in the design preview, so what the host
// sees while styling is literally what the guest gets
export function InvitationField({ disabled, error, field, onChange, value }: InvitationFieldProps) {
	const fieldId = `field-${field.id}`;

	return (
		<div className='grid gap-2' data-testid={`invitation-field-${field.id}`}>
			<label className='design-label' htmlFor={fieldId}>
				{field.label}
				{field.required ? <span aria-hidden='true'> *</span> : null}
			</label>
			{field.helpText ? <p className='text-xs text-ink-soft'>{field.helpText}</p> : null}

			{field.type === 'text' ? (
				<Input
					className='design-input'
					disabled={disabled}
					id={fieldId}
					onChange={(nativeEvent) => onChange(nativeEvent.target.value)}
					value={toText(value)}
				/>
			) : null}

			{field.type === 'textarea' ? (
				<Textarea
					disabled={disabled}
					id={fieldId}
					onChange={(nativeEvent) => onChange(nativeEvent.target.value)}
					rows={3}
					value={toText(value)}
				/>
			) : null}

			{field.type === 'select' ? (
				<select
					className='design-input'
					disabled={disabled}
					id={fieldId}
					onChange={(nativeEvent) => onChange(nativeEvent.target.value)}
					value={toText(value)}
				>
					<option value=''>Bitte wählen</option>
					{field.options.map((option) => (
						<option key={option.id} value={option.id}>
							{option.label}
						</option>
					))}
				</select>
			) : null}

			{field.type === 'radio' ? (
				<RadioGroup
					disabled={disabled}
					id={fieldId}
					onValueChange={(next) => onChange(String(next ?? ''))}
					value={toText(value)}
				>
					{field.options.map((option) => (
						<label className='flex items-center gap-2 text-sm' key={option.id}>
							<RadioGroupItem value={option.id} />
							{option.label}
						</label>
					))}
				</RadioGroup>
			) : null}

			{field.type === 'checkbox' ? (
				<div className='grid gap-2' id={fieldId}>
					{field.options.map((option) => {
						const chosen = toList(value);

						return (
							<label className='flex items-center gap-2 text-sm' key={option.id}>
								<Checkbox
									checked={chosen.includes(option.id)}
									disabled={disabled}
									onCheckedChange={(checked) =>
										onChange(
											checked
												? [...chosen, option.id]
												: chosen.filter((entry) => entry !== option.id)
										)
									}
								/>
								{option.label}
							</label>
						);
					})}
				</div>
			) : null}

			{error ? <p className='design-field-error'>{error}</p> : null}
		</div>
	);
}
