import { describe, expect, test } from 'bun:test';

import { resolveViewer, type SessionGateway } from '@/lib/auth/viewer';

const REQUEST_HEADERS = new Headers({ cookie: 'session=token' });

type SessionUserFixture = {
	email: string;
	firstName?: string | null;
	id: string;
	image?: string | null;
	lastName?: string | null;
	name: string;
	username?: string | null;
};

const SESSION_USER: SessionUserFixture = {
	email: 'du@example.com',
	id: 'user-1',
	image: 'https://example.com/avatar.png',
	name: 'Albin',
};

function createGateway(behaviour: () => Promise<{ user: SessionUserFixture } | null>): SessionGateway {
	return {
		getSession: behaviour,
	};
}

describe('viewer resolution', () => {
	test('a session becomes a viewer', async () => {
		const gateway = createGateway(async () => ({ user: SESSION_USER }));

		const viewer = await resolveViewer(gateway, REQUEST_HEADERS);

		expect(viewer).toEqual({
			email: 'du@example.com',
			firstName: null,
			id: 'user-1',
			image: 'https://example.com/avatar.png',
			lastName: null,
			name: 'Albin',
			username: null,
		});
	});

	test('a missing image is normalised to null', async () => {
		const gateway = createGateway(async () => ({ user: { ...SESSION_USER, image: undefined } }));

		const viewer = await resolveViewer(gateway, REQUEST_HEADERS);

		expect(viewer?.image).toBeNull();
	});

	test('profile fields are normalised to null when absent', async () => {
		const gateway = createGateway(async () => ({ user: SESSION_USER }));

		const viewer = await resolveViewer(gateway, REQUEST_HEADERS);

		expect(viewer?.username).toBeNull();
		expect(viewer?.firstName).toBeNull();
		expect(viewer?.lastName).toBeNull();
	});

	test('profile fields are carried through when present', async () => {
		const gateway = createGateway(async () => ({
			user: { ...SESSION_USER, firstName: 'Albin', lastName: 'Hoti', username: 'albinh' },
		}));

		const viewer = await resolveViewer(gateway, REQUEST_HEADERS);

		expect(viewer?.username).toBe('albinh');
		expect(viewer?.firstName).toBe('Albin');
		expect(viewer?.lastName).toBe('Hoti');
	});

	test('no session means no viewer', async () => {
		const gateway = createGateway(async () => null);

		expect(await resolveViewer(gateway, REQUEST_HEADERS)).toBeNull();
	});

	test('a failing lookup means no viewer rather than a crash', async () => {
		const gateway = createGateway(async () => {
			throw new Error('database unreachable');
		});

		expect(await resolveViewer(gateway, REQUEST_HEADERS)).toBeNull();
	});

	test('the request headers reach the gateway unchanged', async () => {
		let received: Headers | undefined;
		const gateway = createGateway(async () => null) as SessionGateway;
		gateway.getSession = async ({ headers }) => {
			received = headers;
			return null;
		};

		await resolveViewer(gateway, REQUEST_HEADERS);

		expect(received?.get('cookie')).toBe('session=token');
	});
});
