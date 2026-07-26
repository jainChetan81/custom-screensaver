// File System Access API bits missing from lib.dom.d.ts (Chrome/Edge only).
interface FileSystemDirectoryHandle {
	values(): AsyncIterableIterator<FileSystemDirectoryHandle | FileSystemFileHandle>;
	queryPermission(descriptor: { mode: "read" | "readwrite" }): Promise<PermissionState>;
	requestPermission(descriptor: { mode: "read" | "readwrite" }): Promise<PermissionState>;
}

interface Window {
	showDirectoryPicker(options?: { mode?: "read" | "readwrite" }): Promise<FileSystemDirectoryHandle>;
}
