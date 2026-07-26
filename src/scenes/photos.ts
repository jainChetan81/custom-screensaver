import type { Scene } from "../scene";
import { loadDirHandle, loadPref, saveDirHandle, savePref } from "../storage";

const IMAGE_RE = /\.(jpe?g|png|webp|gif|avif)$/i;
const SLIDE_MS = 8000;

async function listImages(dir: FileSystemDirectoryHandle): Promise<File[]> {
	const files: File[] = [];
	for await (const entry of dir.values()) {
		if (entry.kind === "file" && IMAGE_RE.test(entry.name)) {
			files.push(await entry.getFile());
		}
	}
	return files;
}

function shuffle<T>(items: T[]): T[] {
	for (let i = items.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[items[i], items[j]] = [items[j], items[i]];
	}
	return items;
}

export function photosScene(): Scene {
	let container: HTMLElement | null = null;
	let timer = 0;
	let urls: string[] = [];
	let disposed = false;

	function startSlideshow(host: HTMLElement, files: File[]) {
		if (disposed) return;
		host.textContent = "";
		urls = shuffle(files).map((f) => URL.createObjectURL(f));
		const layers = [document.createElement("img"), document.createElement("img")];
		layers.forEach((img) => {
			img.className = "photo-slide";
			host.appendChild(img);
		});
		let index = 0;
		let front = 0;
		const show = () => {
			const img = layers[front];
			img.src = urls[index % urls.length];
			img.classList.add("photo-visible");
			img.classList.toggle("photo-kenburns-alt", index % 2 === 1);
			layers[1 - front].classList.remove("photo-visible");
			front = 1 - front;
			index++;
		};
		show();
		timer = window.setInterval(show, SLIDE_MS);
	}

	function showPrompt(host: HTMLElement, label: string, onPick: () => Promise<void>) {
		host.textContent = "";
		const box = document.createElement("div");
		box.className = "photo-prompt";
		const button = document.createElement("button");
		button.textContent = label;
		button.onclick = () => onPick().catch(() => {});
		box.appendChild(button);
		if (!("showDirectoryPicker" in window)) {
			button.disabled = true;
			button.textContent = "Folder access needs Chrome or Edge";
		}
		host.appendChild(box);
	}

	async function init(host: HTMLElement) {
		const stored = await loadDirHandle();
		if (disposed) return;
		if (stored) {
			const perm = await stored.queryPermission({ mode: "read" });
			if (disposed) return;
			if (perm === "granted") {
				startSlideshow(host, await listImages(stored));
				return;
			}
			// Re-granting needs a user gesture, so it has to be a button.
			showPrompt(host, `Re-allow access to “${stored.name}”`, async () => {
				if ((await stored.requestPermission({ mode: "read" })) === "granted") {
					startSlideshow(host, await listImages(stored));
				}
			});
			return;
		}
		showPrompt(host, "Choose photo folder", async () => {
			const dir = await window.showDirectoryPicker();
			await saveDirHandle(dir);
			savePref("photos-folder-picked", "1");
			startSlideshow(host, await listImages(dir));
		});
	}

	return {
		id: "photos",
		name: "Photos",
		autoEligible: () => loadPref("photos-folder-picked") === "1",
		mount(host) {
			disposed = false;
			container = document.createElement("div");
			container.className = "photos";
			host.appendChild(container);
			void init(container);
		},
		unmount() {
			disposed = true;
			clearInterval(timer);
			urls.forEach((u) => URL.revokeObjectURL(u));
			urls = [];
			container?.remove();
			container = null;
		},
	};
}
