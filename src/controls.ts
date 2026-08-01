import type { Player } from "./player";
import type { Scene } from "./scene";
import { savePref } from "./storage";

const HIDE_AFTER_MS = 3000;

const INTERVAL_CHOICES: [label: string, seconds: number][] = [
	["30 sec", 30],
	["1 min", 60],
	["2 min", 120],
	["5 min", 300],
	["15 min", 900],
	["30 min", 1800],
];

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
	const fullscreen = button("⛶", "Fullscreen", toggleFullscreen);
	const gear = button("⚙", "Settings", () => togglePanel());

	bar.append(prev, label, next, lock, fullscreen, gear);
	document.body.appendChild(bar);

	// --- Settings panel ---
	const panel = document.createElement("div");
	panel.className = "settings";

	const intervalRow = document.createElement("label");
	intervalRow.className = "settings-row";
	intervalRow.append(span("Rotate every"));
	const intervalSelect = document.createElement("select");
	for (const [text, seconds] of INTERVAL_CHOICES) {
		const option = document.createElement("option");
		option.value = String(seconds);
		option.textContent = text;
		intervalSelect.appendChild(option);
	}
	intervalSelect.value = String(nearestChoice(player.intervalMs / 1000));
	intervalSelect.onchange = () => {
		const seconds = Number(intervalSelect.value);
		player.setIntervalMs(seconds * 1000);
		savePref("interval", String(seconds));
	};
	intervalRow.appendChild(intervalSelect);

	const shuffleRow = checkboxRow("Shuffle order", player.shuffle, (on) => {
		player.setShuffle(on);
		savePref("shuffle", on ? "1" : "0");
	});
	const rotateRow = checkboxRow("Auto-rotate", !player.locked, (on) => {
		player.setLocked(!on);
		savePref("autorotate", on ? "1" : "0");
	});
	const rotateCheckbox = rotateRow.querySelector("input")!;

	panel.append(intervalRow, shuffleRow, rotateRow);
	document.body.appendChild(panel);

	function togglePanel(force?: boolean) {
		panel.classList.toggle("settings-open", force);
		gear.classList.toggle("controls-active", panel.classList.contains("settings-open"));
	}

	// --- Show/hide on mouse activity ---
	let hideTimer = 0;
	const hide = () => {
		if (panel.classList.contains("settings-open")) return;
		bar.classList.remove("controls-visible");
		document.body.classList.add("hide-cursor");
	};
	const show = () => {
		bar.classList.add("controls-visible");
		document.body.classList.remove("hide-cursor");
		clearTimeout(hideTimer);
		hideTimer = window.setTimeout(hide, HIDE_AFTER_MS);
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
			toggleFullscreen();
		} else if (e.key === "Escape") {
			togglePanel(false);
		} else if (/^[1-9]$/.test(e.key)) {
			const index = Number(e.key) - 1;
			if (index < player.sceneCount) player.show(index);
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
		rotateCheckbox.checked = !locked;
	};
}

function toggleFullscreen() {
	if (document.fullscreenElement) void document.exitFullscreen();
	else void document.documentElement.requestFullscreen();
}

function nearestChoice(seconds: number): number {
	let best = INTERVAL_CHOICES[0][1];
	for (const [, choice] of INTERVAL_CHOICES) {
		if (Math.abs(choice - seconds) < Math.abs(best - seconds)) best = choice;
	}
	return best;
}

function checkboxRow(text: string, initial: boolean, onToggle: (on: boolean) => void): HTMLLabelElement {
	const row = document.createElement("label");
	row.className = "settings-row";
	row.append(span(text));
	const box = document.createElement("input");
	box.type = "checkbox";
	box.checked = initial;
	box.onchange = () => onToggle(box.checked);
	row.appendChild(box);
	return row;
}

function span(text: string): HTMLSpanElement {
	const el = document.createElement("span");
	el.textContent = text;
	return el;
}

function button(text: string, title: string, onClick: () => void): HTMLButtonElement {
	const el = document.createElement("button");
	el.textContent = text;
	el.title = title;
	el.onclick = onClick;
	return el;
}
