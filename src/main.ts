import type { Process } from "./generate";
import { Recipes } from "./recipes";
import { Search } from "./search";

async function main() {
	let names: Map<string, string> = new Map(await fetch("/data/nomi_ceu_1.7.5_hm/names.json").then(res => res.json()));
	let processes: Process[] = await fetch("/data/nomi_ceu_1.7.5_hm/processes.json").then(res => res.json());
	let recipes_r: Map<string, string[]> = new Map(await fetch("/data/nomi_ceu_1.7.5_hm/recipes_r.json").then(res => res.json()));
	let recipes_u: Map<string, string[]> = new Map(await fetch("/data/nomi_ceu_1.7.5_hm/recipes_u.json").then(res => res.json()));
	let oredict: Map<string, string[]> = new Map(await fetch("/data/nomi_ceu_1.7.5_hm/oredict.json").then(res => res.json()));
	let oredict_inv: Map<string, string[]> = new Map(await fetch("/data/nomi_ceu_1.7.5_hm/oredict_inv.json").then(res => res.json()));

	// @ts-ignore c:
	let recipes = new Recipes(names, processes, recipes_r, recipes_u, oredict, oredict_inv);
	// @ts-ignore c:
	let search = new Search(names, recipes);
}

main();
