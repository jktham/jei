import type { Data, Stack, RawStack, Position } from "./types";

export function dedupStacks(stacks: RawStack[]): RawStack[] {
	return [...new Set(stacks.map(s => s.id))].map(id => {return {id: id, count: stacks.filter(s => s.id == id).map(s => s.count).reduce((c, acc) => acc + c, 0)}}).sort((a, b) => a.id.localeCompare(b.id));
}

export function imgFallback(e: Event) {
	let img = e.target as HTMLImageElement;
	if (img) img.src = "/data/nomi_ceu_1.7.5_hm/icons/minecraft__paper__0.png";
}

// acquire wealth
export function getRich(stack: RawStack, data: Data): Stack {
	let id = data.oredict.get(stack.id)?.[0] || stack.id;
	let name = data.names.get(id) || stack.id;

	const name_overrides: Map<string, string> = new Map([
		["gregtech:material_tree", "Material Tree"],
		["jeresources.mob", "Mob Drop"],
		["jeresources.dungeon", "Dungeon Chest"],
		["jeresources.villager", "Villager Trading"],
		["jeresources.worldgen", "Worldgen"],
		["jei.information", "Information"],
		["gregtech:circuit.integrated", "Circuit"],
		["gregtech:multiblock_info", "Multiblock Info"],
	]);
	name = name_overrides.get(id) || name;

	const icon_overrides: Map<string, string> = new Map([
		["gregtech:material_tree", "/data/nomi_ceu_1.7.5_hm/icons/minecraft__sapling__0.png"],
		["jeresources.mob", "/data/nomi_ceu_1.7.5_hm/icons/minecraft__skull__2.png"],
		["jeresources.dungeon", "/data/nomi_ceu_1.7.5_hm/icons/minecraft__chest__0.png"],
		["jeresources.villager", "/data/nomi_ceu_1.7.5_hm/icons/minecraft__emerald__0.png"],
		["jeresources.worldgen", "/data/nomi_ceu_1.7.5_hm/icons/minecraft__compass__0.png"],
		["jei.information", "/data/nomi_ceu_1.7.5_hm/icons/minecraft__book__0.png"],
		["gregtech:circuit.integrated", "/data/nomi_ceu_1.7.5_hm/icons/gregtech__meta_item_1__461.png"],
		["gregtech:multiblock_info", "/data/nomi_ceu_1.7.5_hm/icons/minecraft__book__0.png"],
	]);
	let icon = icon_overrides.get(id) || `/data/nomi_ceu_1.7.5_hm/icons/${id.replaceAll(":", "__")}.png`;

	return {
		id: id,
		count: stack.count,
		name: name,
		icon: icon,
	};
}

export function newUuid(): number {
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
