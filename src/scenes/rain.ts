import type { Scene } from "../scene";

// Rain on a window: a blurred night backdrop, a faint shower behind the
// glass, static condensation droplets, and occasional "runners" that wobble
// down the pane, absorbing small drops and leaving a fading trail.

const STREAK_COUNT = 140;
const MAX_RUNNERS = 6;
const GRAVITY = 520; // px/s² for runners
const DROPLET_DENSITY = 1 / 9000; // static droplets per screen pixel
const DROPLET_SPAWN_PER_SEC = 60;
const TRAIL_AGE_MS = 1100;

interface Droplet {
	x: number;
	y: number;
	r: number;
	targetR: number;
	alpha: number;
}

interface Runner {
	x: number;
	y: number;
	r: number;
	vy: number;
	wobbleSeed: number;
	trail: { x: number; y: number; r: number; born: number }[];
}

interface Streak {
	x: number;
	y: number;
	length: number;
	speed: number;
	slant: number;
	alpha: number;
}

const rand = (min: number, max: number) => min + Math.random() * (max - min);

function drawDroplet(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, alpha: number) {
	if (r <= 0 || alpha <= 0) return;
	const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.35, r * 0.1, x, y, r);
	g.addColorStop(0, `rgba(235, 244, 255, ${0.5 * alpha})`);
	g.addColorStop(0.45, `rgba(170, 195, 225, ${0.14 * alpha})`);
	g.addColorStop(1, `rgba(100, 125, 160, ${0.4 * alpha})`);
	ctx.fillStyle = g;
	ctx.beginPath();
	ctx.arc(x, y, r, 0, Math.PI * 2);
	ctx.fill();
	// Specular highlight.
	ctx.fillStyle = `rgba(255, 255, 255, ${0.65 * alpha})`;
	ctx.beginPath();
	ctx.arc(x - r * 0.35, y - r * 0.4, Math.max(r * 0.18, 0.4), 0, Math.PI * 2);
	ctx.fill();
}

export function rainScene(): Scene {
	let canvas: HTMLCanvasElement | null = null;
	let raf = 0;
	let onResize = () => {};

	return {
		id: "rain",
		name: "Rain on Glass",
		mount(host) {
			canvas = document.createElement("canvas");
			host.appendChild(canvas);
			const ctx = canvas.getContext("2d")!;
			const backdrop = document.createElement("canvas");
			const backdropCtx = backdrop.getContext("2d")!;

			let width = 0;
			let height = 0;
			let droplets: Droplet[] = [];
			let runners: Runner[] = [];
			let streaks: Streak[] = [];
			let nextRunnerAt = 0;

			const paintBackdrop = () => {
				backdrop.width = width;
				backdrop.height = height;
				const sky = backdropCtx.createLinearGradient(0, 0, 0, height);
				sky.addColorStop(0, "#0a101d");
				sky.addColorStop(0.55, "#111a2c");
				sky.addColorStop(1, "#1a2334");
				backdropCtx.fillStyle = sky;
				backdropCtx.fillRect(0, 0, width, height);
				// Distant city bokeh, heavily soft-edged via radial gradients.
				const tones = ["255, 178, 102", "255, 214, 150", "140, 180, 255", "255, 140, 140"];
				for (let i = 0; i < 14; i++) {
					const x = rand(0, width);
					const y = rand(height * 0.25, height * 0.95);
					const r = rand(30, 110);
					const tone = tones[Math.floor(Math.random() * tones.length)];
					const g = backdropCtx.createRadialGradient(x, y, 0, x, y, r);
					g.addColorStop(0, `rgba(${tone}, ${rand(0.08, 0.2)})`);
					g.addColorStop(1, `rgba(${tone}, 0)`);
					backdropCtx.fillStyle = g;
					backdropCtx.fillRect(x - r, y - r, r * 2, r * 2);
				}
			};

			const resize = () => {
				const dpr = window.devicePixelRatio || 1;
				width = host.clientWidth;
				height = host.clientHeight;
				canvas!.width = width * dpr;
				canvas!.height = height * dpr;
				ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
				paintBackdrop();
				droplets = [];
				runners = [];
				streaks = Array.from({ length: STREAK_COUNT }, () => ({
					x: rand(0, width),
					y: rand(0, height),
					length: rand(9, 22),
					speed: rand(420, 900),
					slant: rand(-0.06, 0.02),
					alpha: rand(0.05, 0.16),
				}));
			};
			resize();
			onResize = resize;
			window.addEventListener("resize", onResize);

			const dropletCap = () => Math.floor((width * height) * DROPLET_DENSITY);

			const spawnRunner = (now: number) => {
				runners.push({
					x: rand(width * 0.05, width * 0.95),
					y: -12,
					r: rand(3, 5),
					vy: rand(20, 70),
					wobbleSeed: rand(0, Math.PI * 2),
					trail: [],
				});
				nextRunnerAt = now + rand(700, 2200);
			};

			let lastTime = -1;
			const animate = (timeStamp: number) => {
				raf = requestAnimationFrame(animate);
				if (lastTime < 0) lastTime = timeStamp;
				const dt = Math.min(Math.max((timeStamp - lastTime) / 1000, 0), 0.1);
				lastTime = timeStamp;

				ctx.drawImage(backdrop, 0, 0, width, height);

				// Shower behind the glass.
				ctx.strokeStyle = "#9fb4d0";
				ctx.lineWidth = 1;
				for (const s of streaks) {
					s.y += s.speed * dt;
					s.x += s.slant * s.speed * dt;
					if (s.y - s.length > height) {
						s.y = -s.length;
						s.x = rand(0, width);
					}
					ctx.globalAlpha = s.alpha;
					ctx.beginPath();
					ctx.moveTo(s.x, s.y);
					ctx.lineTo(s.x - s.slant * s.length, s.y - s.length);
					ctx.stroke();
				}
				ctx.globalAlpha = 1;

				// Condensation: droplets fade in, grow a little, occasionally vanish.
				const spawnBudget = Math.min(
					DROPLET_SPAWN_PER_SEC * dt,
					dropletCap() - droplets.length,
				);
				for (let i = 0; i < spawnBudget; i += 1) {
					const r = rand(0.9, 2.9);
					droplets.push({
						x: rand(0, width),
						y: rand(0, height),
						r: 0,
						targetR: r,
						alpha: 0,
					});
				}
				if (droplets.length >= dropletCap() && Math.random() < 0.05) {
					droplets.splice(Math.floor(Math.random() * droplets.length), 1);
				}
				for (const d of droplets) {
					if (d.alpha < 1) d.alpha = Math.min(d.alpha + dt * 2, 1);
					if (d.r < d.targetR) d.r = Math.min(d.r + dt * 1.4, d.targetR);
					drawDroplet(ctx, d.x, d.y, d.r, d.alpha);
				}

				// Runners: gravity drops that wobble down and absorb static droplets.
				if (timeStamp > nextRunnerAt && runners.length < MAX_RUNNERS) {
					spawnRunner(timeStamp);
				}
				for (let i = runners.length - 1; i >= 0; i--) {
					const run = runners[i];
					run.vy += GRAVITY * dt * (0.25 + run.r * 0.08);
					run.y += run.vy * dt;
					run.x += Math.sin(run.y * 0.02 + run.wobbleSeed) * 24 * dt;
					run.trail.push({ x: run.x, y: run.y, r: run.r * 0.7, born: timeStamp });
					while (run.trail.length && timeStamp - run.trail[0].born > TRAIL_AGE_MS) {
						run.trail.shift();
					}
					// Absorb static droplets in the runner's path.
					for (let j = droplets.length - 1; j >= 0; j--) {
						const d = droplets[j];
						const dx = d.x - run.x;
						const dy = d.y - run.y;
						if (dx * dx + dy * dy < (run.r + d.r) * (run.r + d.r)) {
							run.r = Math.min(Math.sqrt(run.r * run.r + d.r * d.r * 0.6), 7);
							droplets.splice(j, 1);
						}
					}
					// Fading trail.
					for (const t of run.trail) {
						const age = (timeStamp - t.born) / TRAIL_AGE_MS;
						drawDroplet(ctx, t.x, t.y, t.r * (1 - age * 0.6), (1 - age) * 0.5);
					}
					drawDroplet(ctx, run.x, run.y, run.r, 1);
					if (run.y - run.r > height) runners.splice(i, 1);
				}
			};
			raf = requestAnimationFrame(animate);
		},
		unmount() {
			cancelAnimationFrame(raf);
			window.removeEventListener("resize", onResize);
			canvas?.remove();
			canvas = null;
		},
	};
}
