import type { Process } from "./generate";
import { searchItems, clearResults, searchRecipes, searchUses } from "./search";

type Pack = {
	name: string;
	path: string;
};

type PageType = "item" | "recipe" | "use";

type Page = {
	type: PageType;
	query: string;
}

type History = {
	pages: Page[];
	index: number;
}

export let packs: Pack[] = [];
export let names: Map<string, string> = new Map();
export let processes: Process[] = [];
export let recipes_r: Map<string, string[]> = new Map();
export let recipes_u: Map<string, string[]> = new Map();
export let oredict: Map<string, string[]> = new Map();
export let oredict_inv: Map<string, string[]> = new Map();
export let history: History = {
	pages: [{type: "item", query: ""}],
	index: 0
};

export let search_input: HTMLInputElement = document.getElementById("search")! as HTMLInputElement;
export let results_div: HTMLDivElement = document.getElementById("results")! as HTMLDivElement;
export let packs_select: HTMLSelectElement = document.getElementById("packs")! as HTMLSelectElement;
export let status_span: HTMLSpanElement = document.getElementById("status")! as HTMLSpanElement;
export let back_button: HTMLButtonElement = document.getElementById("back")! as HTMLButtonElement;
export let forward_button: HTMLButtonElement = document.getElementById("forward")! as HTMLButtonElement;

search_input.addEventListener("keyup", (e) => {
	if (e.key != "Enter") return;
	searchItems((e.target as HTMLInputElement).value);
});

packs_select.addEventListener("change", async () => {
	clearResults();
	await loadPack(packs_select.value);
	localStorage.setItem("pack", packs_select.value);
	historyGo(history.index);
})

back_button.addEventListener("click", () => {
	historyBack();
})

forward_button.addEventListener("click", () => {
	historyForward();
})

export async function init() {
	search_input.value = "";
	updateHistoryButtons();
	await getPacks();
	let pack = localStorage.getItem("pack");
	if (pack) packs_select.value = pack;
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

export function pushHistory(type: PageType, query: string) {
	let page: Page = {type, query}
	let current_page = history.pages[history.index];
	if (page.type == current_page.type && page.query == current_page.query) {
		return; // avoid adding again when coming from history
	}

	if (history.index != history.pages.length-1) { // pushed in middle of history
		history.pages = history.pages.slice(0, history.index + 1);
	}
	history.pages.push(page);
	history.index += 1;

	updateHistoryButtons();
}

export function historyBack() {
	history.index = Math.max(1, history.index - 1);
	historyGo(history.index);
}

export function historyForward() {
	history.index = Math.min(history.pages.length - 1, history.index + 1);
	historyGo(history.index);
}

function historyGo(index: number) {
	let page = history.pages[index];
	if (page.type == "item") {
		searchItems(page.query);
	} else if (page.type == "recipe") {
		searchRecipes(page.query);
	} else if (page.type == "use") {
		searchUses(page.query);
	}
	updateHistoryButtons();
}

function updateHistoryButtons() {
	back_button.disabled = history.index <= 1;
	forward_button.disabled = history.index >= history.pages.length - 1;
}
