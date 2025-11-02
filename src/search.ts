import { getRecipeScore } from "./solver";
import type { Data, Recipe, Stack, SearchMode, RawStack } from "./types";
import { dedupStacks } from "./util";

export function searchItems(query: string, data: Data): Stack[] {
	if (!query) return [];

	let res: [string, string][] = [];
	for (let [id, display] of data.names.entries()) {
		if (id.toLowerCase().includes(query) || display.toLowerCase().includes(query)) {
			res.push([id, display]);
		}
	}
	
	res = res.filter(([id, _]) => {
		let recipes = data.recipes_r.get(id) ?? [];
		for (let entry of data.oredict_inv.get(id) ?? []) {
			recipes = recipes.concat(data.recipes_r.get(entry) ?? []);
		}
		let uses = data.recipes_u.get(id) ?? [];
		for (let entry of data.oredict_inv.get(id) ?? []) {
			uses = uses.concat(data.recipes_u.get(entry) ?? []);
		}
		return !(recipes.length == 0 && uses.length == 0) // item unused
	});

	if (res.length == 0) {
		return [({
			id: query,
			count: 0,
			name: ":(",
			icon: "/data/nomi_ceu_1.7.5_hm/icons/minecraft__paper__0.png",
		})];
	}
	let results = res.map(([id, _]) => getRich({id, count: 0}, data));
	// results.sort((a, b) => (data.recipes_u.get(b.id)?.length ?? 0) - (data.recipes_u.get(a.id)?.length ?? 0))
	return results;
}

export function searchRecipes(id: string, mode: SearchMode, data: Data): Recipe[] {
	if (!id) return [];
	
	let recipes = new Map();
	if (mode == "recipe") {
		recipes = data.recipes_r;
	} else if (mode == "use") {
		recipes = data.recipes_u;
	}

	let res = recipes.get(id) ?? [];
	for (let entry of data.oredict_inv.get(id) ?? []) {
		res = res.concat(recipes.get(entry) ?? []);
	}
	let results: Recipe[] = [];
	for (let key of res) {
		let i = Number(key.split(".")[0]);
		let j = Number(key.split(".")[1]);
		let process = data.processes[i]!.id;
		let machines = data.processes[i]!.machines;
		let inputs = data.processes[i]!.recipes[j]!.inputs;
		let outputs = data.processes[i]!.recipes[j]!.outputs;
		
		let r: Recipe = {
			process: getRich({id: process, count: 0}, data),
			machines: machines.map(m => getRich({id: m, count: 0}, data)),
			inputs: dedupStacks(inputs).map(s => getRich(s, data)),
			outputs: dedupStacks(outputs).map(s => getRich(s, data)),
			id: `${i}.${j}`,
			score: 0,
		};
		r.score = getRecipeScore(r);
		results.push(r);
	}
	results.sort((a, b) => b.score - a.score);
	return results;
}

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

// acquire wealth
export function getRich(stack: RawStack, data: Data): Stack {
	let id = data.oredict.get(stack.id)?.[0] || stack.id;
	let name = data.names.get(id) || stack.id;

	name = name_overrides.get(id) || name;
	let icon = icon_overrides.get(id) || `/data/nomi_ceu_1.7.5_hm/icons/${id.replaceAll(":", "__")}.png`;

	return {
		id: id,
		count: stack.count,
		name: name,
		icon: icon,
	};
}
