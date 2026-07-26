import type { Scene } from "../scene";

const STAR_COUNT = 400;
const SPEED = 8;
const DEPTH = 1600;

interface Star {
	x: number;
	y: number;
	z: number;
	pz: number;
}

function resetStar(star: Star, w: number, h: number, randomDepth: boolean) {
	star.x = (Math.random() - 0.5) * w * 2;
	star.y = (Math.random() - 0.5) * h * 2;
	star.z = randomDepth ? Math.random() * DEPTH : DEPTH;
	star.pz = star.z;
}

export function starfieldScene(): Scene {
	let canvas: HTMLCanvasElement | null = null;
	let raf = 0;
	let onResize = () => {};

	return {
		id: "starfield",
		name: "Starfield Warp",
		mount(host) {
			canvas = document.createElement("canvas");
			host.appendChild(canvas);
			const ctx = canvas.getContext("2d")!;

			const resize = () => {
				canvas!.width = host.clientWidth;
				canvas!.height = host.clientHeight;
			};
			resize();
			onResize = resize;
			window.addEventListener("resize", onResize);

			const stars: Star[] = Array.from({ length: STAR_COUNT }, () => {
				const star = { x: 0, y: 0, z: 0, pz: 0 };
				resetStar(star, canvas!.width, canvas!.height, true);
				return star;
			});

			const animate = () => {
				raf = requestAnimationFrame(animate);
				const w = canvas!.width;
				const h = canvas!.height;
				const cx = w / 2;
				const cy = h / 2;
				ctx.fillStyle = "rgba(0, 0, 5, 0.4)";
				ctx.fillRect(0, 0, w, h);
				ctx.strokeStyle = "#ffffff";
				ctx.lineCap = "round";

				for (const star of stars) {
					star.pz = star.z;
					star.z -= SPEED;
					if (star.z <= 1) {
						resetStar(star, w, h, false);
						continue;
					}
					const scale = 300;
					const sx = (star.x / star.z) * scale + cx;
					const sy = (star.y / star.z) * scale + cy;
					const px = (star.x / star.pz) * scale + cx;
					const py = (star.y / star.pz) * scale + cy;
					if (sx < 0 || sx > w || sy < 0 || sy > h) {
						resetStar(star, w, h, false);
						continue;
					}
					const depth = 1 - star.z / DEPTH;
					ctx.lineWidth = depth * 3;
					ctx.globalAlpha = depth;
					ctx.beginPath();
					ctx.moveTo(px, py);
					ctx.lineTo(sx, sy);
					ctx.stroke();
				}
				ctx.globalAlpha = 1;
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
