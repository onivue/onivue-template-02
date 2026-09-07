'use client';

import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { CalendarIcon, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

type DateTimePickerProps = {
	className?: string;
	'data-testid'?: string;
	// two controls, no single input to point a <label htmlFor> at — this names them for screen readers
	label: string;
	onChange: (value: string) => void;
	placeholder?: string;
	value: string;
};

const DEFAULT_TIME = '12:00';

// value stays the datetime-local string berlin-time.ts already speaks (yyyy-MM-dd'T'HH:mm), so the
// picker is a drop-in for the native input and every existing parse/format helper keeps working
function splitValue(value: string): { date: Date | null; time: string } {
	if (!value) {
		return { date: null, time: DEFAULT_TIME };
	}

	const [datePart, timePart] = value.split('T');
	const [year, month, day] = (datePart ?? '').split('-').map(Number);

	if (!year || !month || !day) {
		return { date: null, time: DEFAULT_TIME };
	}

	return { date: new Date(year, month - 1, day), time: timePart || DEFAULT_TIME };
}

function toValue(date: Date, time: string): string {
	return `${format(date, 'yyyy-MM-dd')}T${time}`;
}

export function DateTimePicker({
	className,
	label,
	onChange,
	placeholder = 'Datum wählen',
	value,
	...props
}: DateTimePickerProps) {
	const { date, time } = splitValue(value);
	const testId = props['data-testid'];

	return (
		<div className={cn('flex items-center gap-2', className)}>
			<Popover>
				<PopoverTrigger
					aria-label={`${label}, Datum`}
					className='design-input flex h-(--control-height) flex-1 items-center gap-2 text-left'
					data-testid={testId ? `${testId}-date` : undefined}
					type='button'
				>
					<CalendarIcon aria-hidden='true' className='size-4 shrink-0 text-ink-soft' />
					<span className={date ? undefined : 'text-ink-soft'}>
						{date ? format(date, 'd. MMMM yyyy', { locale: de }) : placeholder}
					</span>
				</PopoverTrigger>
				<PopoverContent align='start' className='w-auto p-0'>
					<Calendar
						locale={de}
						mode='single'
						onSelect={(selected) => {
							if (selected) {
								onChange(toValue(selected, time));
							}
						}}
						selected={date ?? undefined}
					/>
				</PopoverContent>
			</Popover>

			<input
				aria-label={`${label}, Uhrzeit`}
				className='design-input w-28 shrink-0'
				data-testid={testId ? `${testId}-time` : undefined}
				onChange={(nativeEvent) => onChange(toValue(date ?? new Date(), nativeEvent.target.value))}
				type='time'
				value={time}
			/>

			{date ? (
				<Button
					aria-label='Datum entfernen'
					data-testid={testId ? `${testId}-clear` : undefined}
					onClick={() => onChange('')}
					size='icon-sm'
					type='button'
					variant='ghost'
				>
					<X />
				</Button>
			) : null}
		</div>
	);
}
