import type { RawStack, Position } from "./types";

export function dedupStacks(stacks: RawStack[]): RawStack[] {
	return [...new Set(stacks.map(s => s.id))].map(id => {return {id: id, count: stacks.filter(s => s.id == id).map(s => s.count).reduce((c, acc) => acc + c, 0)}}).sort((a, b) => a.id.localeCompare(b.id));
}

export function imgFallback(e: Event) {
	let img = e.target as HTMLImageElement;
	if (img) img.src = "/data/nomi_ceu_1.7.5_hm/icons/minecraft__paper__0.png";
}

export function newUuid(seed?: string): number {
	if (seed !== undefined) return generateHash(seed);
	return Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
}

export function add(a: Position, b: Position): Position {
	return {
		x: a.x + b.x,
		y: a.y + b.y,
	};
}

export function sub(a: Position, b: Position): Position {
	return {
		x: a.x - b.x,
		y: a.y - b.y,
	};
}

export function mul(a: Position, b: number): Position {
	return {
		x: a.x * b,
		y: a.y * b,
	};
}
export function div(a: Position, b: number): Position {
	return {
		x: a.x / b,
		y: a.y / b,
	};
}

export function pos(x: number, y: number): Position {
	return {x, y};
}

export function len(pos: Position): number {
	return Math.sqrt(pos.x*pos.x + pos.y*pos.y);
}

const lastTime: Map<string, number> = new Map();
const handlers: Map<string, number> = new Map();

// only run callback every 'time' ms, with additional run after last attempt
export function cached(name: string, time: number, callback: Function) {
	let t0 = lastTime.get(name) ?? 0;
	let t1 = Date.now();

	if (t1 - t0 > time) {
		lastTime.set(name, t1);
		callback();
	}

	clearTimeout(handlers.get(name));
	handlers.set(name, setTimeout(callback, time));
}

function generateHash(string: string): number {
	let hash = 0;
	for (const char of string) {
		hash = (hash << 5) - hash + char.charCodeAt(0);
		hash |= 0;
	}
	return hash;
};
