import type { Data, Recipe, Stack, SearchMode, RawStack } from "./types";
import { dedupStacks, getRich } from "./util";

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
	return res.map(([id, _]) => getRich({id, count: 0}, data));
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
		};
		results.push(r);
	}
	return results;
}
