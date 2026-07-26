import type { Scene } from "./scene";
import { savePref } from "./storage";

export interface PlayerOptions {
	intervalMs: number;
}

export class Player {
	private layers: [HTMLElement, HTMLElement];
	private front = 0;
	private index = -1;
	private mounted: (Scene | null)[] = [null, null];
	private timer = 0;
	locked = false;
	onChange: ((scene: Scene, locked: boolean) => void) | null = null;

	constructor(
		root: HTMLElement,
		private scenes: Scene[],
		private opts: PlayerOptions,
	) {
		this.layers = [document.createElement("div"), document.createElement("div")];
		this.layers.forEach((layer) => {
			layer.className = "scene-layer";
			root.appendChild(layer);
		});
	}

	get current(): Scene | null {
		return this.index >= 0 ? this.scenes[this.index] : null;
	}

	show(index: number): void {
		this.index = (index + this.scenes.length) % this.scenes.length;
		const scene = this.scenes[this.index];
		const back = 1 - this.front;
		const backLayer = this.layers[back];
		const frontLayer = this.layers[this.front];
		const old = this.mounted[back];
		old?.unmount();
		scene.mount(backLayer);
		this.mounted[back] = scene;
		backLayer.classList.add("scene-visible");
		frontLayer.classList.remove("scene-visible");
		const fading = this.mounted[this.front];
		// Unmount the outgoing scene only after the 1s crossfade finishes.
		window.setTimeout(() => {
			if (fading && this.mounted.indexOf(fading) === this.front && fading !== scene) {
				fading.unmount();
				this.mounted[this.front] = null;
			}
		}, 1100);
		this.front = back;
		savePref("last-scene", scene.id);
		this.onChange?.(scene, this.locked);
		this.schedule();
	}

	next(): void {
		this.show(this.index + 1);
	}

	prev(): void {
		this.show(this.index - 1);
	}

	toggleLock(): void {
		this.locked = !this.locked;
		this.schedule();
		const scene = this.current;
		if (scene) this.onChange?.(scene, this.locked);
	}

	private schedule(): void {
		clearTimeout(this.timer);
		if (this.locked) return;
		this.timer = window.setTimeout(() => this.rotate(), this.opts.intervalMs);
	}

	private rotate(): void {
		const eligible = this.scenes
			.map((scene, i) => ({ scene, i }))
			.filter(({ scene, i }) => i !== this.index && (scene.autoEligible?.() ?? true));
		if (eligible.length === 0) {
			this.schedule();
			return;
		}
		const pick = eligible[Math.floor(Math.random() * eligible.length)];
		this.show(pick.i);
	}
}
