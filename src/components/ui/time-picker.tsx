'use client';

import { Clock, X } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { buildTimeOptions, normalizeTimeInput } from '@/lib/time-input';
import { cn } from '@/lib/utils';

type TimePickerProps = {
	'aria-label': string;
	className?: string;
	'data-testid'?: string;
	disabled?: boolean;
	onChange: (time: string) => void;
	// 'HH:mm', or empty when the day carries no time
	value: string;
};

const OPTION_STEP_MINUTES = 30;
const TIME_OPTIONS = buildTimeOptions(OPTION_STEP_MINUTES);

export function TimePicker({ className, disabled = false, onChange, value, ...props }: TimePickerProps) {
	// while typing, what stands in the field is the draft; null means the value speaks for itself
	const [draft, setDraft] = useState<null | string>(null);
	const [isOpen, setIsOpen] = useState(false);

	const commit = () => {
		const normalized = normalizeTimeInput(draft ?? value);

		setDraft(null);
		onChange(normalized);
	};

	return (
		<div className={cn('relative w-36 shrink-0', className)}>
			<input
				aria-label={props['aria-label']}
				className='design-input w-full pr-16 tabular-nums'
				data-testid={props['data-testid']}
				disabled={disabled}
				inputMode='numeric'
				onBlur={commit}
				onChange={(nativeEvent) => setDraft(nativeEvent.target.value)}
				onKeyDown={(nativeEvent) => {
					if (nativeEvent.key === 'Enter') {
						nativeEvent.preventDefault();
						commit();
					}
				}}
				placeholder='--:--'
				value={draft ?? value}
			/>

			{/* both controls sit inside the field they act on, so neither can be read as belonging to
			    the field next door */}
			<div className='absolute inset-y-0 right-1.5 flex items-center gap-0.5'>
				{value && !disabled ? (
					<Button
						aria-label='Uhrzeit entfernen'
						data-testid={props['data-testid'] ? `${props['data-testid']}-clear` : undefined}
						onClick={() => {
							setDraft(null);
							onChange('');
						}}
						size='icon-sm'
						type='button'
						variant='ghost'
					>
						<X />
					</Button>
				) : null}

				<Popover onOpenChange={setIsOpen} open={isOpen}>
					<PopoverTrigger
						aria-label={`${props['aria-label']} auswählen`}
						className='flex size-7 shrink-0 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-muted hover:text-ink disabled:pointer-events-none disabled:opacity-55'
						data-testid={props['data-testid'] ? `${props['data-testid']}-options` : undefined}
						disabled={disabled}
						type='button'
					>
						<Clock aria-hidden='true' className='size-4' />
					</PopoverTrigger>
					<PopoverContent align='end' className='max-h-64 w-32 overflow-y-auto p-1'>
						<ul className='grid gap-0.5'>
							{TIME_OPTIONS.map((option) => (
								<li key={option}>
									<Button
										className={cn(
											'h-8 w-full justify-center tabular-nums',
											option === value && 'bg-ink font-bold text-background hover:bg-ink/90'
										)}
										data-testid={`time-option-${option}`}
										onClick={() => {
											setDraft(null);
											onChange(option);
											setIsOpen(false);
										}}
										size='sm'
										variant='ghost'
									>
										{option}
									</Button>
								</li>
							))}
						</ul>
					</PopoverContent>
				</Popover>
			</div>
		</div>
	);
}
