import type { Scene } from "../scene";

// Port of MatrixRain.tsx from jainChetan81/examples, minus React.
const CHARACTERS =
	"アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッン0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const FONT_SIZE = 25;
const FRAME_MS = 1000 / 30;

class Glyph {
	x: number;
	y: number;

	constructor(x: number) {
		this.x = x;
		this.y = Math.floor(Math.random() * -50);
	}

	draw(ctx: CanvasRenderingContext2D, canvasHeight: number) {
		const text = CHARACTERS.charAt(Math.floor(Math.random() * CHARACTERS.length));
		ctx.fillText(text, this.x * FONT_SIZE, this.y * FONT_SIZE);
		if (this.y * FONT_SIZE > canvasHeight && Math.random() > 0.98) {
			this.y = 0;
		} else {
			this.y += 1;
		}
	}
}

export function matrixScene(): Scene {
	let canvas: HTMLCanvasElement | null = null;
	let raf = 0;
	let onResize = () => {};

	return {
		id: "matrix",
		name: "Matrix Rain",
		mount(host) {
			canvas = document.createElement("canvas");
			host.appendChild(canvas);
			const ctx = canvas.getContext("2d")!;
			let glyphs: Glyph[] = [];

			let width = 0;
			let height = 0;
			const resize = () => {
				const dpr = window.devicePixelRatio || 1;
				width = host.clientWidth;
				height = host.clientHeight;
				canvas!.width = width * dpr;
				canvas!.height = height * dpr;
				ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
				const columns = Math.ceil(width / FONT_SIZE);
				glyphs = Array.from({ length: columns }, (_, i) => new Glyph(i));
			};
			resize();
			onResize = resize;
			window.addEventListener("resize", onResize);

			let lastTime = 0;
			let timer = 0;
			const animate = (timeStamp: number) => {
				raf = requestAnimationFrame(animate);
				timer += timeStamp - lastTime;
				lastTime = timeStamp;
				if (timer < FRAME_MS) return;
				timer = 0;
				ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
				ctx.fillRect(0, 0, width, height);
				ctx.fillStyle = "#0affa0";
				ctx.font = `${FONT_SIZE}px monospace`;
				ctx.textAlign = "center";
				for (const glyph of glyphs) glyph.draw(ctx, height);
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
