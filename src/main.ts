import "./style.css";
import { initControls } from "./controls";
import { Player } from "./player";
import { auroraScene } from "./scenes/aurora";
import { clockScene } from "./scenes/clock";
import { matrixScene } from "./scenes/matrix";
import { photosScene } from "./scenes/photos";
import { starfieldScene } from "./scenes/starfield";
import { loadPref } from "./storage";

const ROTATE_MS = 2 * 60 * 1000;

const scenes = [matrixScene(), starfieldScene(), auroraScene(), clockScene(), photosScene()];

const params = new URLSearchParams(location.search);
const wallpaperMode = params.get("mode") === "wallpaper";

const app = document.getElementById("app")!;
const savedInterval = Number(loadPref("interval")) * 1000 || ROTATE_MS;
const player = new Player(app, scenes, {
	intervalMs: Number(params.get("interval")) * 1000 || savedInterval,
	shuffle: loadPref("shuffle") !== "0",
});
player.locked = loadPref("autorotate") === "0";

// In wallpaper mode the overlay stays dormant until mouse events actually
// arrive (i.e. Plash Browsing Mode is on) — a plain wallpaper never gets them.
player.onChange = initControls(player, { startHidden: wallpaperMode });

const requested = params.get("scene") ?? loadPref("last-scene");
let start = scenes.findIndex((s) => s.id === requested);
if (start === -1 || (wallpaperMode && !(scenes[start].autoEligible?.() ?? true))) {
	start = 0;
}
player.show(start);
