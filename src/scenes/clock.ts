import type { Scene } from "../scene";

// Huge thin digits that slowly drift and shift hue (burn-in safe).
export function clockScene(): Scene {
	let container: HTMLElement | null = null;
	let tick = 0;
	let drift = 0;

	return {
		id: "clock",
		name: "Clock",
		mount(host) {
			container = document.createElement("div");
			container.className = "clock";
			const time = document.createElement("div");
			time.className = "clock-time";
			const date = document.createElement("div");
			date.className = "clock-date";
			container.append(time, date);
			host.appendChild(container);

			let hue = Math.floor(Math.random() * 360);
			const update = () => {
				const now = new Date();
				time.textContent = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
				date.textContent = now.toLocaleDateString([], {
					weekday: "long",
					month: "long",
					day: "numeric",
				});
				hue = (hue + 0.05) % 360;
				container!.style.color = `hsl(${hue} 25% 88%)`;
			};
			update();
			tick = window.setInterval(update, 1000);

			const wander = () => {
				const x = (Math.random() - 0.5) * 6;
				const y = (Math.random() - 0.5) * 6;
				container!.style.transform = `translate(${x}%, ${y}%)`;
			};
			wander();
			drift = window.setInterval(wander, 60_000);
		},
		unmount() {
			clearInterval(tick);
			clearInterval(drift);
			container?.remove();
			container = null;
		},
	};
}
