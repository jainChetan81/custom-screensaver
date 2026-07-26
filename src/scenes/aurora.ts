import type { Scene } from "../scene";

// Pure CSS after setup: blurred blobs on slow keyframe paths (see style.css).
const BLOB_COLORS = ["#0f766e", "#7c3aed", "#1d4ed8", "#be185d"];

export function auroraScene(): Scene {
	let container: HTMLElement | null = null;

	return {
		id: "aurora",
		name: "Aurora",
		mount(host) {
			container = document.createElement("div");
			container.className = "aurora";
			BLOB_COLORS.forEach((color, i) => {
				const blob = document.createElement("div");
				blob.className = `aurora-blob aurora-blob-${i + 1}`;
				blob.style.background = color;
				container!.appendChild(blob);
			});
			host.appendChild(container);
		},
		unmount() {
			container?.remove();
			container = null;
		},
	};
}
