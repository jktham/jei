import type { Process } from "./generate";
import { Recipes } from "./recipes";
import { Search } from "./search";

type Pack = {
	name: string;
	path: string;
};

export class App {
	packs_element: HTMLSelectElement = document.getElementById("packs")! as HTMLSelectElement;

	packs: Pack[] = [];
	names: Map<string, string> = new Map();
	processes: Process[] = [];
	recipes_r: Map<string, string[]> = new Map();
	recipes_u: Map<string, string[]> = new Map();
	oredict: Map<string, string[]> = new Map();
	oredict_inv: Map<string, string[]> = new Map();

	search?: Search;
	recipes?: Recipes;

	constructor() {
		this.packs_element.addEventListener("change", async (e) => {
			let path = (e.target as HTMLSelectElement).value;
			this.search?.clearResults();
			this.recipes?.clearRecipes();
			await this.loadPack(path);
		})
	}

	async init() {
		await this.getPacks();
		await this.loadPack(this.packs[0].path);

		this.recipes = new Recipes(this.names, this.processes, this.recipes_r, this.recipes_u, this.oredict, this.oredict_inv);
		this.search = new Search(this.names, this.recipes);
	}

	async getPacks() {
		this.packs = await fetch("/packs.json").then(res => res.json());

		this.packs_element.innerHTML = "";
		for (let pack of this.packs) {
			let opt = document.createElement("option");
			opt.value = pack.path;
			opt.innerHTML = pack.name;
			this.packs_element.appendChild(opt);
		}
	}

	async loadPack(path: string) {
		this.names = new Map(await fetch(`${path}/names.json`).then(res => res.json()));
		this.processes = await fetch(`${path}/processes.json`).then(res => res.json());
		this.recipes_r = new Map(await fetch(`${path}/recipes_r.json`).then(res => res.json()));
		this.recipes_u = new Map(await fetch(`${path}/recipes_u.json`).then(res => res.json()));
		this.oredict = new Map(await fetch(`${path}/oredict.json`).then(res => res.json()));
		this.oredict_inv = new Map(await fetch(`${path}/oredict_inv.json`).then(res => res.json()));
	}
}