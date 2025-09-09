import type { Process } from "./generate";
import { searchItems, clearResults } from "./search";

type Pack = {
	name: string;
	path: string;
};

export let packs: Pack[] = [];
export let names: Map<string, string> = new Map();
export let processes: Process[] = [];
export let recipes_r: Map<string, string[]> = new Map();
export let recipes_u: Map<string, string[]> = new Map();
export let oredict: Map<string, string[]> = new Map();
export let oredict_inv: Map<string, string[]> = new Map();

export let search_input: HTMLInputElement = document.getElementById("search")! as HTMLInputElement;
export let results_div: HTMLDivElement = document.getElementById("results")! as HTMLDivElement;
export let packs_select: HTMLSelectElement = document.getElementById("packs")! as HTMLSelectElement;
export let status_span: HTMLSpanElement = document.getElementById("status")! as HTMLSpanElement;

search_input.addEventListener("keyup", (e) => {
	if (e.key != "Enter") return;
	searchItems((e.target as HTMLInputElement).value);
});

packs_select.addEventListener("change", async () => {
	clearResults();
	await loadPack(packs_select.value);
})

export async function init() {
	await getPacks();
	await loadPack(packs_select.value);
}

export async function getPacks() {
	packs = await fetch("/packs.json").then(res => res.json());

	packs_select.innerHTML = "";
	for (let pack of packs) {
		let opt = document.createElement("option");
		opt.value = pack.path;
		opt.innerHTML = pack.name;
		packs_select.appendChild(opt);
	}
}

export async function loadPack(path: string) {
	status_span.textContent = "loading...";
	names = new Map(await fetch(`${path}/names.json`).then(res => res.json()));
	processes = await fetch(`${path}/processes.json`).then(res => res.json());
	recipes_r = new Map(await fetch(`${path}/recipes_r.json`).then(res => res.json()));
	recipes_u = new Map(await fetch(`${path}/recipes_u.json`).then(res => res.json()));
	oredict = new Map(await fetch(`${path}/oredict.json`).then(res => res.json()));
	oredict_inv = new Map(await fetch(`${path}/oredict_inv.json`).then(res => res.json()));
	status_span.textContent = "";
}
