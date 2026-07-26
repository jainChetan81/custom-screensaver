const PREFIX = "screensaver:";

export function loadPref(key: string): string | null {
	try {
		return localStorage.getItem(PREFIX + key);
	} catch {
		return null;
	}
}

export function savePref(key: string, value: string): void {
	try {
		localStorage.setItem(PREFIX + key, value);
	} catch {
		/* private mode etc. — prefs are optional */
	}
}

// FileSystemDirectoryHandle can only be persisted in IndexedDB.
const DB_NAME = "screensaver";
const STORE = "handles";

function openDb(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		const req = indexedDB.open(DB_NAME, 1);
		req.onupgradeneeded = () => req.result.createObjectStore(STORE);
		req.onsuccess = () => resolve(req.result);
		req.onerror = () => reject(req.error);
	});
}

export async function saveDirHandle(handle: FileSystemDirectoryHandle): Promise<void> {
	const db = await openDb();
	await new Promise<void>((resolve, reject) => {
		const tx = db.transaction(STORE, "readwrite");
		tx.objectStore(STORE).put(handle, "photos");
		tx.oncomplete = () => resolve();
		tx.onerror = () => reject(tx.error);
	});
	db.close();
}

export async function loadDirHandle(): Promise<FileSystemDirectoryHandle | null> {
	try {
		const db = await openDb();
		const handle = await new Promise<FileSystemDirectoryHandle | null>((resolve, reject) => {
			const req = db.transaction(STORE).objectStore(STORE).get("photos");
			req.onsuccess = () => resolve(req.result ?? null);
			req.onerror = () => reject(req.error);
		});
		db.close();
		return handle;
	} catch {
		return null;
	}
}
