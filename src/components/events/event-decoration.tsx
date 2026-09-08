'use client';

import { useEffect, useRef } from 'react';

import type { DecorationScene } from '@/lib/events/cake-scene';
import type { DecorationKey } from '@/lib/events/event-decoration';

import { cn } from '@/lib/utils';

type EventDecorationProps = {
	className?: string;
	decoration: DecorationKey;
};

// which file each ornament draws. three is a heavy import for a page that mostly asks yes or no, so
// the scene and its model arrive on demand — and only the one that was actually chosen.
const MODEL_URLS = {
	'birthday-cake': '/models/cake_birthday_cut.fbx',
	'birthday-cake-slice': '/models/cake_birthday_slice.fbx',
} satisfies Record<DecorationKey, string>;

const PRESS_POKE = 1;

export function EventDecoration({ className, decoration }: EventDecorationProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const sceneRef = useRef<DecorationScene | null>(null);

	// webgl is an external system with its own lifecycle: it has to be created against a real
	// canvas, driven by a frame loop, and torn down by hand. that is what an effect is for.
	useEffect(() => {
		const canvas = canvasRef.current;

		if (!canvas) {
			return;
		}

		const parent = canvas.parentElement;
		const reducedMotion = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

		let frame = 0;
		let cancelled = false;
		let observer: null | ResizeObserver = null;

		const measure = () => ({
			height: parent?.clientHeight || canvas.clientHeight || 1,
			width: parent?.clientWidth || canvas.clientWidth || 1,
		});

		const start = async () => {
			const { createCakeScene } = await import('@/lib/events/cake-scene');

			if (cancelled) {
				return;
			}

			const size = measure();
			const scene = createCakeScene(MODEL_URLS[decoration], canvas, size.width, size.height);

			sceneRef.current = scene;

			// the model arrives over the network, so for a reader who does not want motion the still
			// frame has to be drawn a few beats in a row to catch it once the mesh is actually there
			const drawStill = (attempt: number) => {
				scene.render(0);

				if (attempt < 12 && !cancelled) {
					frame = requestAnimationFrame(() => drawStill(attempt + 1));
				}
			};

			if (reducedMotion) {
				drawStill(0);

				return;
			}

			const startedAt = performance.now();
			const loop = () => {
				scene.render((performance.now() - startedAt) / 1000);
				frame = requestAnimationFrame(loop);
			};

			frame = requestAnimationFrame(loop);
		};

		if (parent && 'ResizeObserver' in globalThis) {
			observer = new ResizeObserver(() => {
				const size = measure();

				sceneRef.current?.resize(size.width, size.height);
			});
			observer.observe(parent);
		}

		void start();

		return () => {
			cancelled = true;
			cancelAnimationFrame(frame);
			observer?.disconnect();
			sceneRef.current?.dispose();
			sceneRef.current = null;
		};
	}, [decoration]);

	return (
		// decorative by definition: the invitation says everything this ornament says, so screen
		// readers are spared a canvas they cannot read anyway. the poke is play, never a control.
		<div
			aria-hidden='true'
			className={cn('relative h-44 w-full cursor-pointer touch-manipulation select-none sm:h-52', className)}
			data-testid={`event-decoration-${decoration}`}
			onPointerDown={() => sceneRef.current?.poke(PRESS_POKE)}
		>
			{/* a soft lime pool under the ornament, so it sits on the page instead of floating on it */}
			<div className='absolute inset-x-1/4 bottom-4 h-10 rounded-[50%] bg-lime-glow/25 blur-2xl' />
			<canvas className='relative size-full' ref={canvasRef} />
		</div>
	);
}
