import { relations, sql } from 'drizzle-orm';
import {
	pgTable,
	pgEnum,
	check,
	text,
	bigint,
	timestamp,
	boolean,
	integer,
	index,
	uniqueIndex,
	jsonb,
} from 'drizzle-orm/pg-core';

export const user = pgTable('user', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	email: text('email').notNull().unique(),
	emailVerified: boolean('email_verified').default(false).notNull(),
	image: text('image'),
	username: text('username').unique(),
	firstName: text('first_name'),
	lastName: text('last_name'),
	createdAt: timestamp('created_at').notNull(),
	updatedAt: timestamp('updated_at')
		.$onUpdate(() => new Date())
		.notNull(),
});

export const session = pgTable(
	'session',
	{
		id: text('id').primaryKey(),
		expiresAt: timestamp('expires_at').notNull(),
		token: text('token').notNull().unique(),
		createdAt: timestamp('created_at').notNull(),
		updatedAt: timestamp('updated_at')
			.$onUpdate(() => new Date())
			.notNull(),
		ipAddress: text('ip_address'),
		userAgent: text('user_agent'),
		// written by the organization plugin when an active organization is selected
		activeOrganizationId: text('active_organization_id'),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
	},
	(table) => [index('session_userId_idx').on(table.userId)]
);

export const account = pgTable(
	'account',
	{
		id: text('id').primaryKey(),
		// scopes account identity per better-auth 1.7+ (e.g. 'local:credential', 'local:oauth:<provider>')
		issuer: text('issuer').notNull(),
		accountId: text('account_id').notNull(),
		providerId: text('provider_id').notNull(),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		accessToken: text('access_token'),
		refreshToken: text('refresh_token'),
		idToken: text('id_token'),
		accessTokenExpiresAt: timestamp('access_token_expires_at'),
		refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
		scope: text('scope'),
		password: text('password'),
		createdAt: timestamp('created_at').notNull(),
		updatedAt: timestamp('updated_at')
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index('account_userId_idx').on(table.userId),
		uniqueIndex('account_issuer_accountId_idx').on(table.issuer, table.accountId),
	]
);

export const verification = pgTable(
	'verification',
	{
		id: text('id').primaryKey(),
		identifier: text('identifier').notNull(),
		value: text('value').notNull(),
		expiresAt: timestamp('expires_at').notNull(),
		createdAt: timestamp('created_at').notNull(),
		updatedAt: timestamp('updated_at')
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [index('verification_identifier_idx').on(table.identifier)]
);

export const passkey = pgTable(
	'passkey',
	{
		id: text('id').primaryKey(),
		name: text('name'),
		publicKey: text('public_key').notNull(),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		credentialID: text('credential_id').notNull(),
		counter: integer('counter').notNull(),
		deviceType: text('device_type').notNull(),
		backedUp: boolean('backed_up').notNull(),
		transports: text('transports'),
		createdAt: timestamp('created_at'),
		aaguid: text('aaguid'),
	},
	(table) => [index('passkey_userId_idx').on(table.userId), index('passkey_credentialID_idx').on(table.credentialID)]
);

// the three tables below back better-auth's organization plugin. their shape is dictated by the
// plugin, not by us. note the collision: this `invitation` is a membership invite, a different
// thing from the guest Invitation this app is about, which lives in `event_invitation`.
export const organization = pgTable('organization', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	slug: text('slug').notNull().unique(),
	logo: text('logo'),
	metadata: text('metadata'),
	createdAt: timestamp('created_at').notNull(),
});

export const member = pgTable(
	'member',
	{
		id: text('id').primaryKey(),
		organizationId: text('organization_id')
			.notNull()
			.references(() => organization.id, { onDelete: 'cascade' }),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		role: text('role').notNull().default('member'),
		createdAt: timestamp('created_at').notNull(),
	},
	(table) => [
		index('member_organizationId_idx').on(table.organizationId),
		index('member_userId_idx').on(table.userId),
	]
);

export const invitation = pgTable(
	'invitation',
	{
		id: text('id').primaryKey(),
		organizationId: text('organization_id')
			.notNull()
			.references(() => organization.id, { onDelete: 'cascade' }),
		email: text('email').notNull(),
		role: text('role'),
		status: text('status').notNull().default('pending'),
		expiresAt: timestamp('expires_at').notNull(),
		createdAt: timestamp('created_at').notNull(),
		inviterId: text('inviter_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
	},
	(table) => [
		index('invitation_organizationId_idx').on(table.organizationId),
		index('invitation_email_idx').on(table.email),
	]
);

export const rateLimit = pgTable('rate_limit', {
	id: text('id').primaryKey(),
	key: text('key').notNull().unique(),
	count: integer('count').notNull(),
	lastRequest: bigint('last_request', { mode: 'number' }).notNull(),
});

// signing keys for the access tokens the oauth provider issues (better-auth `jwt` plugin)
export const jwks = pgTable('jwks', {
	id: text('id').primaryKey(),
	publicKey: text('public_key').notNull(),
	privateKey: text('private_key').notNull(),
	createdAt: timestamp('created_at').notNull(),
	expiresAt: timestamp('expires_at'),
	alg: text('alg'),
	crv: text('crv'),
});

// the tables below back @better-auth/oauth-provider (and therefore @better-auth/mcp). their shape
// is dictated by the plugin, not by us: generated from the plugin's own schema definition rather
// than hand-written, so a plugin upgrade can be re-generated the same way.
export const oauthClient = pgTable(
	'oauth_client',
	{
		id: text('id').primaryKey(),
		clientId: text('client_id').notNull().unique(),
		clientSecret: text('client_secret'),
		clientDiscoveryId: text('client_discovery_id'),
		disabled: boolean('disabled'),
		skipConsent: boolean('skip_consent'),
		enableEndSession: boolean('enable_end_session'),
		subjectType: text('subject_type'),
		scopes: text('scopes').array(),
		clientCredentialsScopes: text('client_credentials_scopes').array(),
		userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
		createdAt: timestamp('created_at'),
		updatedAt: timestamp('updated_at'),
		name: text('name'),
		uri: text('uri'),
		icon: text('icon'),
		contacts: text('contacts').array(),
		tos: text('tos'),
		policy: text('policy'),
		softwareId: text('software_id'),
		softwareVersion: text('software_version'),
		softwareStatement: text('software_statement'),
		redirectUris: text('redirect_uris').array().notNull(),
		postLogoutRedirectUris: text('post_logout_redirect_uris').array(),
		backchannelLogoutUri: text('backchannel_logout_uri'),
		backchannelLogoutSessionRequired: boolean('backchannel_logout_session_required'),
		tokenEndpointAuthMethod: text('token_endpoint_auth_method'),
		applicationType: text('application_type'),
		jwks: text('jwks'),
		jwksUri: text('jwks_uri'),
		grantTypes: text('grant_types').array(),
		responseTypes: text('response_types').array(),
		requirePKCE: boolean('require_pkce'),
		dpopBoundAccessTokens: boolean('dpop_bound_access_tokens'),
		referenceId: text('reference_id'),
		metadata: jsonb('metadata'),
	},
	(table) => [index('oauth_client_user_id_idx').on(table.userId)]
);

export const oauthResource = pgTable('oauth_resource', {
	id: text('id').primaryKey(),
	identifier: text('identifier').notNull().unique(),
	name: text('name').notNull(),
	accessTokenTtl: integer('access_token_ttl'),
	refreshTokenTtl: integer('refresh_token_ttl'),
	signingAlgorithm: text('signing_algorithm'),
	signingKeyId: text('signing_key_id'),
	allowedScopes: text('allowed_scopes').array(),
	customClaims: jsonb('custom_claims'),
	dpopBoundAccessTokensRequired: boolean('dpop_bound_access_tokens_required'),
	disabled: boolean('disabled'),
	createdAt: timestamp('created_at'),
	updatedAt: timestamp('updated_at'),
	policyVersion: integer('policy_version'),
	metadata: jsonb('metadata'),
});

export const oauthClientResource = pgTable(
	'oauth_client_resource',
	{
		id: text('id').primaryKey(),
		clientId: text('client_id')
			.notNull()
			.references(() => oauthClient.clientId, { onDelete: 'cascade' }),
		resourceId: text('resource_id')
			.notNull()
			.references(() => oauthResource.identifier, { onDelete: 'cascade' }),
		metadata: jsonb('metadata'),
		createdAt: timestamp('created_at'),
	},
	(table) => [
		index('oauth_client_resource_client_id_idx').on(table.clientId),
		index('oauth_client_resource_resource_id_idx').on(table.resourceId),
	]
);

export const oauthRefreshToken = pgTable(
	'oauth_refresh_token',
	{
		id: text('id').primaryKey(),
		token: text('token').notNull().unique(),
		clientId: text('client_id')
			.notNull()
			.references(() => oauthClient.clientId, { onDelete: 'cascade' }),
		sessionId: text('session_id').references(() => session.id, { onDelete: 'cascade' }),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		referenceId: text('reference_id'),
		authorizationCodeId: text('authorization_code_id'),
		resources: text('resources').array(),
		requestedUserInfoClaims: text('requested_user_info_claims').array(),
		expiresAt: timestamp('expires_at'),
		createdAt: timestamp('created_at'),
		revoked: timestamp('revoked'),
		rotatedAt: timestamp('rotated_at'),
		rotationReplayResponse: text('rotation_replay_response'),
		rotationReplayExpiresAt: timestamp('rotation_replay_expires_at'),
		authTime: timestamp('auth_time'),
		confirmation: jsonb('confirmation'),
		scopes: text('scopes').array().notNull(),
	},
	(table) => [
		index('oauth_refresh_token_client_id_idx').on(table.clientId),
		index('oauth_refresh_token_session_id_idx').on(table.sessionId),
		index('oauth_refresh_token_user_id_idx').on(table.userId),
		index('oauth_refresh_token_authorization_code_id_idx').on(table.authorizationCodeId),
	]
);

export const oauthAccessToken = pgTable(
	'oauth_access_token',
	{
		id: text('id').primaryKey(),
		token: text('token').unique(),
		clientId: text('client_id')
			.notNull()
			.references(() => oauthClient.clientId, { onDelete: 'cascade' }),
		sessionId: text('session_id').references(() => session.id, { onDelete: 'cascade' }),
		userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
		referenceId: text('reference_id'),
		authorizationCodeId: text('authorization_code_id'),
		resources: text('resources').array(),
		requestedUserInfoClaims: text('requested_user_info_claims').array(),
		refreshId: text('refresh_id').references(() => oauthRefreshToken.id, { onDelete: 'cascade' }),
		expiresAt: timestamp('expires_at'),
		createdAt: timestamp('created_at'),
		revoked: timestamp('revoked'),
		confirmation: jsonb('confirmation'),
		scopes: text('scopes').array().notNull(),
	},
	(table) => [
		index('oauth_access_token_client_id_idx').on(table.clientId),
		index('oauth_access_token_session_id_idx').on(table.sessionId),
		index('oauth_access_token_user_id_idx').on(table.userId),
		index('oauth_access_token_authorization_code_id_idx').on(table.authorizationCodeId),
		index('oauth_access_token_refresh_id_idx').on(table.refreshId),
	]
);

// one row per client the user has approved; this is what the account page lists
export const oauthConsent = pgTable(
	'oauth_consent',
	{
		id: text('id').primaryKey(),
		clientId: text('client_id')
			.notNull()
			.references(() => oauthClient.clientId, { onDelete: 'cascade' }),
		userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
		referenceId: text('reference_id'),
		resources: text('resources').array(),
		requestedUserInfoClaims: text('requested_user_info_claims').array(),
		scopes: text('scopes').array().notNull(),
		createdAt: timestamp('created_at'),
		updatedAt: timestamp('updated_at'),
	},
	(table) => [
		index('oauth_consent_client_id_idx').on(table.clientId),
		index('oauth_consent_user_id_idx').on(table.userId),
	]
);

export const oauthClientAssertion = pgTable('oauth_client_assertion', {
	id: text('id').primaryKey(),
	expiresAt: timestamp('expires_at').notNull(),
});

export const userRelations = relations(user, ({ many }) => ({
	sessions: many(session),
	accounts: many(account),
	passkeys: many(passkey),
	memberships: many(member),
}));

export const organizationRelations = relations(organization, ({ many }) => ({
	members: many(member),
	invitations: many(invitation),
}));

export const memberRelations = relations(member, ({ one }) => ({
	organization: one(organization, {
		fields: [member.organizationId],
		references: [organization.id],
	}),
	user: one(user, {
		fields: [member.userId],
		references: [user.id],
	}),
}));

export const invitationRelations = relations(invitation, ({ one }) => ({
	organization: one(organization, {
		fields: [invitation.organizationId],
		references: [organization.id],
	}),
	inviter: one(user, {
		fields: [invitation.inviterId],
		references: [user.id],
	}),
}));

export const sessionRelations = relations(session, ({ one }) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id],
	}),
}));

export const accountRelations = relations(account, ({ one }) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id],
	}),
}));

export const passkeyRelations = relations(passkey, ({ one }) => ({
	user: one(user, {
		fields: [passkey.userId],
		references: [user.id],
	}),
}));

// ---------------------------------------------------------------------------
// event invitations
//
// the app's own domain. `event_invitation` carries the prefix because the table name `invitation`
// is already taken by the organization plugin above, where it means a membership invite.
// every timestamp below is stored with a time zone; the ui reads and writes them in Europe/Berlin.
// ---------------------------------------------------------------------------

export const eventStatus = pgEnum('event_status', ['active', 'archived']);
export const guestResponse = pgEnum('guest_response', ['open', 'accepted', 'declined']);
export const guestAgeGroup = pgEnum('guest_age_group', ['adult', 'child']);
export const formFieldType = pgEnum('form_field_type', ['text', 'textarea', 'select', 'radio', 'checkbox']);
// a field is either asked of every guest or once of the whole invitation
export const formFieldScope = pgEnum('form_field_scope', ['guest', 'invitation']);
export const responseLogKind = pgEnum('response_log_kind', ['response', 'answer']);
export const responseLogActor = pgEnum('response_log_actor', ['guest', 'admin']);

export const event = pgTable(
	'event',
	{
		id: text('id').primaryKey(),
		organizationId: text('organization_id')
			.notNull()
			.references(() => organization.id, { onDelete: 'cascade' }),
		// events outlive the person who created them; the organization owns them
		createdByUserId: text('created_by_user_id').references(() => user.id, { onDelete: 'set null' }),
		title: text('title').notNull(),
		greeting: text('greeting'),
		location: text('location'),
		// two separate deep links, since a guest on ios reaches for apple maps and one on android for
		// google maps — either, both, or neither may be set
		locationAppleMapsUrl: text('location_apple_maps_url'),
		locationGoogleMapsUrl: text('location_google_maps_url'),
		startsAt: timestamp('starts_at', { withTimezone: true }),
		endsAt: timestamp('ends_at', { withTimezone: true }),
		// the deadline for every invitation of this event; a single invitation may be granted a later one
		responseDeadline: timestamp('response_deadline', { withTimezone: true }),
		// the 3d ornament on the guest page; null means none. text, not an enum, so the curated set in
		// event-decoration.ts can grow without a migration
		decoration: text('decoration'),
		status: eventStatus('status').notNull().default('active'),
		// where a response notification goes. it is the host's own address and belongs to the admin
		// surface only — the guest page must never carry it.
		notificationEmail: text('notification_email'),
		notifyOnResponse: boolean('notify_on_response').notNull().default(false),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [index('event_organizationId_idx').on(table.organizationId)]
);

export const eventInvitation = pgTable(
	'event_invitation',
	{
		id: text('id').primaryKey(),
		eventId: text('event_id')
			.notNull()
			.references(() => event.id, { onDelete: 'cascade' }),
		// possession of this token is the whole authorization (ADR-0004); replacing it kills the old link
		token: text('token').notNull().unique(),
		// the host's own bookkeeping: the app never sends anything itself
		sentAt: timestamp('sent_at', { withTimezone: true }),
		// overrides the event deadline, which is how a straggler is let back in
		responseDeadline: timestamp('response_deadline', { withTimezone: true }),
		// counted from the browser, so a messenger's link preview is not an opened invitation
		viewCount: integer('view_count').notNull().default(0),
		lastViewedAt: timestamp('last_viewed_at', { withTimezone: true }),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [index('event_invitation_eventId_idx').on(table.eventId)]
);

export const eventGuest = pgTable(
	'event_guest',
	{
		id: text('id').primaryKey(),
		invitationId: text('invitation_id')
			.notNull()
			.references(() => eventInvitation.id, { onDelete: 'cascade' }),
		firstName: text('first_name').notNull(),
		// a guest list holds 'Oma' as readily as 'Anna Meier'
		lastName: text('last_name'),
		email: text('email'),
		// visible to the host only, never on the guest page
		note: text('note'),
		ageGroup: guestAgeGroup('age_group').notNull().default('adult'),
		isMainGuest: boolean('is_main_guest').notNull().default(false),
		position: integer('position').notNull(),
		response: guestResponse('response').notNull().default('open'),
		respondedAt: timestamp('responded_at', { withTimezone: true }),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		index('event_guest_invitationId_idx').on(table.invitationId),
		// an invitation is addressed to exactly one main guest
		uniqueIndex('event_guest_main_idx')
			.on(table.invitationId)
			.where(sql`${table.isMainGuest}`),
	]
);

export const eventFormField = pgTable(
	'event_form_field',
	{
		id: text('id').primaryKey(),
		eventId: text('event_id')
			.notNull()
			.references(() => event.id, { onDelete: 'cascade' }),
		type: formFieldType('type').notNull(),
		label: text('label').notNull(),
		helpText: text('help_text'),
		scope: formFieldScope('scope').notNull().default('guest'),
		// only meaningful for guest-scoped fields: an invitation has no response of its own
		onlyWhenAttending: boolean('only_when_attending').notNull().default(false),
		required: boolean('required').notNull().default(false),
		// [{ id, label }] for select, radio and checkbox; empty for the text types
		options: jsonb('options').$type<{ id: string; label: string }[]>().notNull().default([]),
		position: integer('position').notNull(),
		// fields are retired, never deleted, so answers already given stay readable
		retiredAt: timestamp('retired_at', { withTimezone: true }),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [index('event_form_field_eventId_idx').on(table.eventId)]
);

export const eventAnswer = pgTable(
	'event_answer',
	{
		id: text('id').primaryKey(),
		fieldId: text('field_id')
			.notNull()
			.references(() => eventFormField.id, { onDelete: 'cascade' }),
		// exactly one of these is set, matching the field's scope
		guestId: text('guest_id').references(() => eventGuest.id, { onDelete: 'cascade' }),
		invitationId: text('invitation_id').references(() => eventInvitation.id, { onDelete: 'cascade' }),
		// jsonb because a checkbox field holds several values
		value: jsonb('value').$type<string | string[]>().notNull(),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		check('event_answer_single_target', sql`(${table.guestId} IS NULL) <> (${table.invitationId} IS NULL)`),
		uniqueIndex('event_answer_field_guest_idx').on(table.fieldId, table.guestId),
		uniqueIndex('event_answer_field_invitation_idx').on(table.fieldId, table.invitationId),
	]
);

// how the current state came about. it follows the guest: deleting one deletes their answers and
// their history together, because a record naming someone is what a deletion request is about.
export const eventResponseLog = pgTable(
	'event_response_log',
	{
		id: text('id').primaryKey(),
		invitationId: text('invitation_id')
			.notNull()
			.references(() => eventInvitation.id, { onDelete: 'cascade' }),
		guestId: text('guest_id').references(() => eventGuest.id, { onDelete: 'cascade' }),
		fieldId: text('field_id').references(() => eventFormField.id, { onDelete: 'set null' }),
		kind: responseLogKind('kind').notNull(),
		previousValue: jsonb('previous_value').$type<null | string | string[]>(),
		nextValue: jsonb('next_value').$type<null | string | string[]>(),
		actor: responseLogActor('actor').notNull(),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [
		index('event_response_log_invitationId_idx').on(table.invitationId),
		index('event_response_log_guestId_idx').on(table.guestId),
	]
);

// the public guest route is unauthenticated and writes, so it carries its own fixed-window limit.
// better-auth's rate_limit table belongs to its own endpoints and is not borrowed here.
export const guestRateLimit = pgTable('guest_rate_limit', {
	key: text('key').primaryKey(),
	count: integer('count').notNull(),
	expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
});

export const eventRelations = relations(event, ({ one, many }) => ({
	organization: one(organization, {
		fields: [event.organizationId],
		references: [organization.id],
	}),
	invitations: many(eventInvitation),
	formFields: many(eventFormField),
}));

export const eventInvitationRelations = relations(eventInvitation, ({ one, many }) => ({
	event: one(event, {
		fields: [eventInvitation.eventId],
		references: [event.id],
	}),
	guests: many(eventGuest),
	answers: many(eventAnswer),
	logEntries: many(eventResponseLog),
}));

export const eventGuestRelations = relations(eventGuest, ({ one, many }) => ({
	invitation: one(eventInvitation, {
		fields: [eventGuest.invitationId],
		references: [eventInvitation.id],
	}),
	answers: many(eventAnswer),
}));

export const eventFormFieldRelations = relations(eventFormField, ({ one, many }) => ({
	event: one(event, {
		fields: [eventFormField.eventId],
		references: [event.id],
	}),
	answers: many(eventAnswer),
}));

export const eventAnswerRelations = relations(eventAnswer, ({ one }) => ({
	field: one(eventFormField, {
		fields: [eventAnswer.fieldId],
		references: [eventFormField.id],
	}),
	guest: one(eventGuest, {
		fields: [eventAnswer.guestId],
		references: [eventGuest.id],
	}),
	invitation: one(eventInvitation, {
		fields: [eventAnswer.invitationId],
		references: [eventInvitation.id],
	}),
}));

export const eventResponseLogRelations = relations(eventResponseLog, ({ one }) => ({
	invitation: one(eventInvitation, {
		fields: [eventResponseLog.invitationId],
		references: [eventInvitation.id],
	}),
	guest: one(eventGuest, {
		fields: [eventResponseLog.guestId],
		references: [eventGuest.id],
	}),
}));
