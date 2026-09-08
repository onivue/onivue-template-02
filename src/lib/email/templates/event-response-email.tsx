import { Column, Hr, Row, Section, Text } from '@react-email/components';

import type { EventResponseEmail } from '@/lib/email/email-gateway';

import { EmailButton } from '@/lib/email/templates/email-button';
import { EmailLayout } from '@/lib/email/templates/email-layout';

const STATUS_LABELS = {
	accepted: 'Zugesagt',
	declined: 'Abgesagt',
	open: 'Noch offen',
} as const;

const STATUS_CLASS = {
	accepted: 'bg-lime-soft text-accent-strong',
	declined: 'bg-background text-ink-soft',
	open: 'bg-background text-ink-soft',
} as const;

type EventResponseEmailProps = Omit<EventResponseEmail, 'kind' | 'to'>;

function AnswerLines({ lines }: { lines: EventResponseEmail['answers'] }) {
	return (
		<>
			{lines.map((line) => (
				<Row className='mt-1' key={line.label}>
					<Column className='w-2/5 align-top'>
						<Text className='m-0 text-[13px] leading-5 text-ink-soft'>{line.label}</Text>
					</Column>
					<Column className='align-top'>
						<Text className='m-0 text-[13px] leading-5 text-ink'>{line.value}</Text>
					</Column>
				</Row>
			))}
		</>
	);
}

// what the host gets when someone answers: who they are, what they chose, and what they wrote —
// enough to act on without opening the app, with a way in when they want the full list
export function EventResponseEmail({
	answers,
	eventTitle,
	eventUrl,
	guests,
	invitationLabel,
}: EventResponseEmailProps) {
	return (
		<EmailLayout previewText={`${invitationLabel} hat auf „${eventTitle}“ geantwortet.`}>
			<Text className='m-0 inline-block rounded-full bg-lime-soft px-3 py-1 text-[11px] font-bold tracking-wide text-accent-strong uppercase'>
				Neue Antwort
			</Text>
			<Text className='mt-4 mb-2 text-[24px] leading-tight font-bold text-ink'>{invitationLabel}</Text>
			<Text className='m-0 text-[14px] leading-6 text-ink-soft'>
				hat die Einladung zu „{eventTitle}“ ausgefüllt.
			</Text>

			{guests.map((guest) => (
				<Section className='mt-6' key={guest.name}>
					<Row>
						<Column className='align-middle'>
							<Text className='m-0 text-[15px] leading-6 font-bold text-ink'>{guest.name}</Text>
						</Column>
						<Column className='text-right align-middle'>
							<Text
								className={`m-0 inline-block rounded-full px-3 py-1 text-[11px] font-bold ${STATUS_CLASS[guest.status]}`}
							>
								{STATUS_LABELS[guest.status]}
							</Text>
						</Column>
					</Row>
					{guest.answers.length > 0 ? <AnswerLines lines={guest.answers} /> : null}
				</Section>
			))}

			{answers.length > 0 ? (
				<Section className='mt-6'>
					<Hr className='mb-4 border-border' />
					<Text className='m-0 mb-1 text-[11px] font-bold tracking-wide text-ink-soft uppercase'>
						Zur ganzen Einladung
					</Text>
					<AnswerLines lines={answers} />
				</Section>
			) : null}

			<Section className='mt-7 mb-1'>
				<EmailButton href={eventUrl}>Gästeliste öffnen</EmailButton>
			</Section>
		</EmailLayout>
	);
}
