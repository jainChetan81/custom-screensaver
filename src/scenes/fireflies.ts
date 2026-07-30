import type { Scene } from "../scene";

const FIREFLY_COUNT = 60;

interface Firefly {
	x: number;
	y: number;
	vx: number;
	vy: number;
	r: number;
	hue: number;
	phase: number;
	blinkSpeed: number;
}

const rand = (min: number, max: number) => min + Math.random() * (max - min);

function spawnFirefly(w: number, h: number): Firefly {
	return {
		x: rand(0, w),
		y: rand(0, h),
		vx: rand(-14, 14),
		vy: rand(-14, 14),
		r: rand(1.5, 3.2),
		hue: rand(70, 130),
		phase: rand(0, Math.PI * 2),
		blinkSpeed: rand(0.6, 1.6),
	};
}

export function firefliesScene(): Scene {
	let canvas: HTMLCanvasElement | null = null;
	let raf = 0;
	let onResize = () => {};

	return {
		id: "fireflies",
		name: "Fireflies",
		mount(host) {
			canvas = document.createElement("canvas");
			host.appendChild(canvas);
			const ctx = canvas.getContext("2d")!;

			let width = 0;
			let height = 0;
			let flies: Firefly[] = [];

			const resize = () => {
				const dpr = window.devicePixelRatio || 1;
				width = host.clientWidth;
				height = host.clientHeight;
				canvas!.width = width * dpr;
				canvas!.height = height * dpr;
				ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
				flies = Array.from({ length: FIREFLY_COUNT }, () => spawnFirefly(width, height));
			};
			resize();
			onResize = resize;
			window.addEventListener("resize", onResize);

			let lastTime = -1;
			const animate = (timeStamp: number) => {
				raf = requestAnimationFrame(animate);
				if (lastTime < 0) lastTime = timeStamp;
				const dt = Math.min(Math.max((timeStamp - lastTime) / 1000, 0), 0.1);
				const t = timeStamp / 1000;
				lastTime = timeStamp;

				const bg = ctx.createLinearGradient(0, 0, 0, height);
				bg.addColorStop(0, "#050a08");
				bg.addColorStop(1, "#0a1410");
				ctx.fillStyle = bg;
				ctx.fillRect(0, 0, width, height);

				ctx.globalCompositeOperation = "lighter";
				for (const f of flies) {
					f.vx += rand(-6, 6) * dt;
					f.vy += rand(-6, 6) * dt;
					f.vx = Math.max(-20, Math.min(20, f.vx));
					f.vy = Math.max(-20, Math.min(20, f.vy));
					f.x += f.vx * dt;
					f.y += f.vy * dt;
					if (f.x < 0) f.x += width;
					if (f.x > width) f.x -= width;
					if (f.y < 0) f.y += height;
					if (f.y > height) f.y -= height;

					const glow = 0.35 + 0.65 * Math.max(0, Math.sin(t * f.blinkSpeed + f.phase));
					const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r * 8);
					g.addColorStop(0, `hsla(${f.hue}, 100%, 75%, ${0.9 * glow})`);
					g.addColorStop(0.3, `hsla(${f.hue}, 100%, 60%, ${0.35 * glow})`);
					g.addColorStop(1, `hsla(${f.hue}, 100%, 50%, 0)`);
					ctx.fillStyle = g;
					ctx.beginPath();
					ctx.arc(f.x, f.y, f.r * 8, 0, Math.PI * 2);
					ctx.fill();

					ctx.fillStyle = `hsla(${f.hue}, 100%, 90%, ${glow})`;
					ctx.beginPath();
					ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
					ctx.fill();
				}
				ctx.globalCompositeOperation = "source-over";
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
