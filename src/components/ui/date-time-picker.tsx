'use client';

import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { CalendarIcon, X } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { TimePicker } from '@/components/ui/time-picker';
import { cn } from '@/lib/utils';

type DateTimePickerProps = {
	className?: string;
	'data-testid'?: string;
	// two controls, no single input to point a <label htmlFor> at — this names them for screen readers
	label: string;
	onChange: (value: string) => void;
	placeholder?: string;
	// 'yyyy-MM-dd' for a day on its own, 'yyyy-MM-ddTHH:mm' once a time is given, '' for nothing
	value: string;
};

const DATE_PATTERN = 'yyyy-MM-dd';

function splitValue(value: string): { date: Date | null; time: string } {
	const [datePart, timePart] = value.split('T');
	const [year, month, day] = (datePart ?? '').split('-').map(Number);

	if (!year || !month || !day) {
		return { date: null, time: '' };
	}

	return { date: new Date(year, month - 1, day), time: timePart ?? '' };
}

function toValue(date: Date, time: string): string {
	const day = format(date, DATE_PATTERN);

	return time ? `${day}T${time}` : day;
}

export function DateTimePicker({
	className,
	label,
	onChange,
	placeholder = 'Datum wählen',
	value,
	...props
}: DateTimePickerProps) {
	const [isOpen, setIsOpen] = useState(false);
	const { date, time } = splitValue(value);
	const testId = props['data-testid'];

	return (
		<div className={cn('flex flex-wrap items-center gap-2', className)}>
			<div className='relative min-w-48 flex-1'>
				<Popover onOpenChange={setIsOpen} open={isOpen}>
					<PopoverTrigger
						aria-label={`${label}, Datum`}
						className='design-input flex h-(--control-height) w-full items-center gap-2 pr-10 text-left'
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
							// without this the calendar opens on the current month even when a day is already
							// chosen, and the reader has to page back to what they picked last time
							defaultMonth={date ?? undefined}
							locale={de}
							mode='single'
							onSelect={(selected) => {
								if (selected) {
									onChange(toValue(selected, time));
									setIsOpen(false);
								}
							}}
							selected={date ?? undefined}
						/>
					</PopoverContent>
				</Popover>

				{/* inside the date field, so it clearly clears the date rather than the field beside it */}
				{date ? (
					<Button
						aria-label='Datum entfernen'
						className='absolute top-1/2 right-1.5 -translate-y-1/2'
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

			{/* a time without a day would have nothing to belong to */}
			<TimePicker
				aria-label={`${label}, Uhrzeit`}
				data-testid={testId ? `${testId}-time` : undefined}
				disabled={!date}
				onChange={(next) => {
					if (date) {
						onChange(toValue(date, next));
					}
				}}
				value={time}
			/>
		</div>
	);
}
