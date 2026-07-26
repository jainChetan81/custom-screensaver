export interface Scene {
	id: string;
	name: string;
	/** Build DOM/canvas inside `host` and start the animation loop. */
	mount(host: HTMLElement): void;
	/** Stop loops, remove DOM, release resources (object URLs, listeners). */
	unmount(): void;
	/** When false, auto-rotation skips this scene (still reachable manually). */
	autoEligible?(): boolean;
}
