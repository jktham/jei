import type { Process } from "./generate";
import { Recipes } from "./recipes";
import { Search } from "./search";

type Pack = {
	name: string;
	path: string;
};

export class App {
	packs_element: HTMLSelectElement = document.getElementById("packs")! as HTMLSelectElement;
	status_element: HTMLSpanElement = document.getElementById("status")! as HTMLSpanElement;

	packs: Pack[] = [];
	names: Map<string, string> = new Map();
	processes: Process[] = [];
	recipes_r: Map<string, string[]> = new Map();
	recipes_u: Map<string, string[]> = new Map();
	oredict: Map<string, string[]> = new Map();
	oredict_inv: Map<string, string[]> = new Map();

	search!: Search;
	recipes!: Recipes;

	constructor() {
		this.packs_element.addEventListener("change", async (e) => {
			let path = (e.target as HTMLSelectElement).value;
			let url = new URL(window.location.toString());
			if (path != url.searchParams.get("pack")) {
				url.searchParams.set("pack", path);
				history.pushState(null, "", url);
			}

			this.recipes?.clearRecipes();
			this.search?.clearResults();
			await this.load();
			await this.processQueryParams();
		})
	}

	async init() {
		await this.getPacks();
		await this.load();
	}

	async load() {
		await this.loadPack(this.packs_element.value);
		this.recipes = new Recipes(this.names, this.processes, this.recipes_r, this.recipes_u, this.oredict, this.oredict_inv);
		this.search = new Search(this.names, this.recipes);
	}

	async processQueryParams() {
		let url = new URL(window.location.toString());
		let pack = url.searchParams.get("pack");
		let search = url.searchParams.get("search");
		let recipes = url.searchParams.get("recipes");
		let uses = url.searchParams.get("uses");

		if (pack) {
			if (pack != this.packs_element.value) {
				this.packs_element.value = pack;
				this.recipes?.clearRecipes();
				this.search?.clearResults();
				await this.load();
			}
		}
		if (search) {
			this.search.input_element.value = search;
			this.search.search(search); // lol
		} else if (recipes) {
			this.search.clearResults();
			this.recipes.search(this.recipes.recipes_r, recipes);
		} else if (uses) {
			this.search.clearResults();
			this.recipes.search(this.recipes.recipes_u, uses);
		}
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
		this.status_element.textContent = "loading...";
		this.names = new Map(await fetch(`${path}/names.json`).then(res => res.json()));
		this.processes = await fetch(`${path}/processes.json`).then(res => res.json());
		this.recipes_r = new Map(await fetch(`${path}/recipes_r.json`).then(res => res.json()));
		this.recipes_u = new Map(await fetch(`${path}/recipes_u.json`).then(res => res.json()));
		this.oredict = new Map(await fetch(`${path}/oredict.json`).then(res => res.json()));
		this.oredict_inv = new Map(await fetch(`${path}/oredict_inv.json`).then(res => res.json()));
		this.status_element.textContent = "";
	}
}