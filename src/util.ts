import { active_stacks, names, oredict } from "./app";
import type { Stack } from "./generate";
import { searchRecipes, searchUses } from "./search";

export function dedupStacks(stacks: Stack[]): Stack[] {
	return [...new Set(stacks.map(s => s.id))].map(id => {return {id: id, count: stacks.filter(s => s.id == id).map(s => s.count).reduce((c, acc) => acc + c, 0)}}).sort((a, b) => a.id.localeCompare(b.id));
}

export function imgFallback(e: string | Event) {
	if (typeof e == "string") return;
	let img = e.target as HTMLImageElement;
	if (img) img.src = "/data/nomi_ceu_1.7.5_hm/icons/minecraft__paper__0.png";
}

export function createSymbol(name: string): HTMLSpanElement {
	let symbol_span = document.createElement("span");
	symbol_span.className = "material-symbols-outlined";
	symbol_span.textContent = name;
	return symbol_span;
}

export type RichStack = {
	id: string,
	count: number,
	name: string,
	icon: string,
};

// acquire wealth
export function getRich(stack: Stack): RichStack {
	let id = oredict.get(stack.id)?.[0] || stack.id;
	let name = names.get(id) || stack.id;

	let icon_overrides: Map<string, string> = new Map([
		["gregtech:material_tree", "/data/nomi_ceu_1.7.5_hm/icons/minecraft__book__0.png"],
		["jeresources.mob", "/data/nomi_ceu_1.7.5_hm/icons/minecraft__skull__2.png"],
		["jeresources.dungeon", "/data/nomi_ceu_1.7.5_hm/icons/minecraft__chest__0.png"],
		["jeresources.villager", "/data/nomi_ceu_1.7.5_hm/icons/minecraft__emerald__0.png"],
		["jei.information", "/data/nomi_ceu_1.7.5_hm/icons/minecraft__writable_book__0.png"],
		["gregtech:circuit.integrated", "/data/nomi_ceu_1.7.5_hm/icons/gregtech__meta_item_1__461.png"],
	]);
	let icon = icon_overrides.get(id) || `/data/nomi_ceu_1.7.5_hm/icons/${id.replaceAll(":", "__")}.png`;

	return {
		id: id,
		count: stack.count,
		name: name,
		icon: icon,
	};
}

export function createStackElement(stack: RichStack, set_active: boolean): HTMLDivElement {
	let stack_div = document.createElement("div");
	let icon_img = document.createElement("img");
	let count_span = document.createElement("span");
	
	stack_div.className = "stack";
	icon_img.className = "icon";
	count_span.className = "count";

	stack_div.title = `${stack.name}\n${stack.id}`;
	stack_div.onclick = () => {
		if (set_active) active_stacks[0] = {el: stack_div, id: stack.id, type: "output"};
		searchRecipes(stack.id);
	};
	stack_div.oncontextmenu = (e) => {
		if (set_active) active_stacks[0] = {el: stack_div, id: stack.id, type: "input"};
		e.preventDefault();
		searchUses(stack.id);
	};
	icon_img.src = stack.icon;
	icon_img.loading = "lazy";
	icon_img.onerror = imgFallback;
	icon_img.draggable = false;
	count_span.textContent = stack.count.toString();

	stack_div.appendChild(icon_img);
	stack_div.appendChild(count_span);
	return stack_div;
}
