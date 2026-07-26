import type { Player } from "./player";
import type { Scene } from "./scene";

const HIDE_AFTER_MS = 3000;

export function initControls(
	player: Player,
	opts: { startHidden?: boolean } = {},
): (scene: Scene, locked: boolean) => void {
	const bar = document.createElement("div");
	bar.className = "controls";

	const prev = button("‹", "Previous scene", () => player.prev());
	const label = document.createElement("span");
	label.className = "controls-label";
	const next = button("›", "Next scene", () => player.next());
	const lock = button("⏵", "Pause rotation", () => player.toggleLock());
	lock.classList.add("controls-lock");
	const fullscreen = button("⛶", "Fullscreen", () => {
		if (document.fullscreenElement) void document.exitFullscreen();
		else void document.documentElement.requestFullscreen();
	});

	bar.append(prev, label, next, lock, fullscreen);
	document.body.appendChild(bar);

	let hideTimer = 0;
	const show = () => {
		bar.classList.add("controls-visible");
		document.body.classList.remove("hide-cursor");
		clearTimeout(hideTimer);
		hideTimer = window.setTimeout(() => {
			bar.classList.remove("controls-visible");
			document.body.classList.add("hide-cursor");
		}, HIDE_AFTER_MS);
	};
	window.addEventListener("mousemove", show);
	if (opts.startHidden) document.body.classList.add("hide-cursor");
	else show();

	window.addEventListener("keydown", (e) => {
		if (e.key === "ArrowRight") player.next();
		else if (e.key === "ArrowLeft") player.prev();
		else if (e.key === " ") {
			e.preventDefault();
			player.toggleLock();
		} else if (e.key.toLowerCase() === "f") {
			if (document.fullscreenElement) void document.exitFullscreen();
			else void document.documentElement.requestFullscreen();
		} else {
			return;
		}
		show();
	});

	return (scene, locked) => {
		label.textContent = scene.name;
		lock.textContent = locked ? "⏸" : "⏵";
		lock.title = locked ? "Rotation paused — click to resume" : "Pause rotation";
		bar.classList.toggle("controls-locked", locked);
	};
}

function button(text: string, title: string, onClick: () => void): HTMLButtonElement {
	const el = document.createElement("button");
	el.textContent = text;
	el.title = title;
	el.onclick = onClick;
	return el;
}
