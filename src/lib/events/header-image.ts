import 'server-only';
import { cache } from 'react';

import { isStoredKey } from '@/lib/storage/object-storage';
import { objectStorage } from '@/lib/storage/s3-object-storage';

// the bucket stays private, so a header image reaches the browser as a signed url with a short
// life. an hour is long enough for a guest to read the page and short enough that a copied image
// url is not a permanent handout.
const READ_URL_TTL_SECONDS = 3600;

// deduped per request: the guest page and its preview ask for the same image
export const resolveHeaderImageUrl = cache(async (value: null | string): Promise<null | string> => {
	if (!value) {
		return null;
	}

	// a plain url was pasted in before uploads existed, and still works
	if (!isStoredKey(value)) {
		return value;
	}

	if (!objectStorage) {
		return null;
	}

	try {
		return await objectStorage.readUrl(value, READ_URL_TTL_SECONDS);
	} catch {
		// a missing object or a revoked credential costs the picture, never the page
		return null;
	}
});
