import { describe, expect, test } from 'bun:test';

import { effectiveDeadline, resolveResponseWindow } from '@/lib/events/response-window';

const NOW = new Date('2026-03-01T12:00:00Z');
const EARLIER = new Date('2026-02-01T12:00:00Z');
const LATER = new Date('2026-04-01T12:00:00Z');

describe('the response window', () => {
	test('an event without a deadline never closes', () => {
		expect(
			resolveResponseWindow({ eventDeadline: null, eventStatus: 'active', invitationDeadline: null }, NOW)
		).toEqual({ closesAt: null, open: true });
	});

	test('a deadline in the future keeps it open and says when it closes', () => {
		expect(
			resolveResponseWindow({ eventDeadline: LATER, eventStatus: 'active', invitationDeadline: null }, NOW)
		).toEqual({ closesAt: LATER, open: true });
	});

	test('a deadline in the past closes it', () => {
		expect(
			resolveResponseWindow({ eventDeadline: EARLIER, eventStatus: 'active', invitationDeadline: null }, NOW)
		).toEqual({ open: false, reason: 'deadline-passed' });
	});

	test('the deadline itself is still open', () => {
		expect(
			resolveResponseWindow({ eventDeadline: NOW, eventStatus: 'active', invitationDeadline: null }, NOW)
		).toEqual({ closesAt: NOW, open: true });
	});

	test('an invitation deadline overrides the event, later or earlier', () => {
		expect(
			resolveResponseWindow({ eventDeadline: EARLIER, eventStatus: 'active', invitationDeadline: LATER }, NOW)
		).toEqual({ closesAt: LATER, open: true });

		expect(
			resolveResponseWindow({ eventDeadline: LATER, eventStatus: 'active', invitationDeadline: EARLIER }, NOW)
		).toEqual({ open: false, reason: 'deadline-passed' });
	});

	test('archiving closes it regardless of any deadline', () => {
		expect(
			resolveResponseWindow({ eventDeadline: LATER, eventStatus: 'archived', invitationDeadline: LATER }, NOW)
		).toEqual({ open: false, reason: 'archived' });
	});

	test('the effective deadline is the invitation one when present', () => {
		expect(effectiveDeadline({ eventDeadline: EARLIER, eventStatus: 'active', invitationDeadline: LATER })).toBe(
			LATER
		);
		expect(effectiveDeadline({ eventDeadline: EARLIER, eventStatus: 'active', invitationDeadline: null })).toBe(
			EARLIER
		);
	});
});
