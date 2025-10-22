import type { Position } from "./types";

export function grabStart(e: PointerEvent, position: Position, update?: () => void) {
	let initialOffset: Position = {
		x: e.clientX - position.x, 
		y: e.clientY - position.y,
	};
	
	function move(e: MouseEvent) {
		position.x = e.clientX - initialOffset.x;
		position.y = e.clientY - initialOffset.y;

		update?.();
	}

	function reset() {
		window.removeEventListener("pointermove", move);
		window.removeEventListener("pointerup", reset);
	}

	window.addEventListener("pointermove", move);
	window.addEventListener("pointerup", reset);
};
