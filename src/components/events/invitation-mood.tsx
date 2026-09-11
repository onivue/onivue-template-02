'use client';

import { create as createConfetti } from 'canvas-confetti';
import { useEffect, useRef } from 'react';

import type { ResponseMood } from '@/lib/events/response-mood';

type InvitationMoodProps = {
	mood: ResponseMood;
};

// canvas-confetti parses its own colour strings and knows nothing of the css custom properties, so
// this is the one place the lime, soft-ink and ink tokens appear as hex — keep them in step with
// globals.css. the app renders light only, so there is one palette. no green here on purpose — the
// background wash carries the green, the falling pieces stay lime/grey/near-black.
const CONFETTI_COLORS = ['#bbfa0d', '#545860', '#0a0d12'];
const SHOWER_INTERVAL_MS = 300;
const PARTICLES_PER_SHOWER = 10;

// a subtle, ongoing shower rather than a one-off burst: a handful of pieces drift down from a
// random point along the top every couple of seconds, for as long as the mood stays 'accepted'.
// canvas-confetti runs its own physics loop rather than a css animation, so a reader who asked for
// less motion gets no shower at all here, instead of a still frame — there is nothing sensible to
// freeze a physics simulation into. the ref is read inside the effect, never during render.
function useConfettiShower(canvasRef: React.RefObject<HTMLCanvasElement | null>, isActive: boolean) {
	useEffect(() => {
		const canvas = canvasRef.current;
		const reducedMotion = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

		if (!canvas || !isActive || reducedMotion) {
			return;
		}

		const fire = createConfetti(canvas, { resize: true, useWorker: true });

		const shower = () => {
			void fire({
				angle: 120,
				colors: CONFETTI_COLORS,
				decay: 0.9,
				drift: 0.5,
				origin: { x: Math.random(), y: -0.05 },
				particleCount: PARTICLES_PER_SHOWER,
				scalar: 1.5,
				spread: 80,
				startVelocity: 55,
				ticks: 300,
			});
		};

		shower();

		const interval = setInterval(shower, SHOWER_INTERVAL_MS);

		return () => {
			clearInterval(interval);
			fire.reset();
		};
	}, [canvasRef, isActive]);
}

// the ambient answer background. it is decoration only — the summary above it already says who is
// coming — so it never takes a pointer and never reaches a screen reader.
export function InvitationMood({ mood }: InvitationMoodProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);

	useConfettiShower(canvasRef, mood === 'accepted');

	return (
		<div
			aria-hidden='true'
			className='pointer-events-none fixed inset-0 z-0 overflow-hidden animate-in fade-in duration-1000'
			data-testid={`invitation-mood-${mood}`}
		>
			{mood === 'declined' ? <div className='invitation-regret-glow absolute inset-0' /> : null}

			{mood === 'accepted' ? (
				<>
					<div className='invitation-celebrate-glow absolute inset-0' />
					<canvas className='absolute inset-0 size-full' ref={canvasRef} />
				</>
			) : null}
		</div>
	);
}
