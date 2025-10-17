import type { Pack, Page, PageType, Process, History, ActiveStack, Data } from "./types";
import { searchItems, clearResults, searchRecipes, searchUses } from "./search";

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
export let chart_div: HTMLDivElement = document.getElementById("chart")! as HTMLDivElement;
export let packs_select: HTMLSelectElement = document.getElementById("packs")! as HTMLSelectElement;
export let status_span: HTMLSpanElement = document.getElementById("status")! as HTMLSpanElement;
export let back_button: HTMLButtonElement = document.getElementById("back")! as HTMLButtonElement;
export let forward_button: HTMLButtonElement = document.getElementById("forward")! as HTMLButtonElement;
export let close_button: HTMLButtonElement = document.getElementById("close")! as HTMLButtonElement;
export let chart_svg: SVGElement = document.getElementById("chart_svg")! as unknown as SVGElement;

export let active_stacks: ActiveStack[] = [{el: undefined, id: "", type: ""}, {el: undefined, id: "", type: ""}];

export async function getPacks(): Promise<Pack[]> {
	let packs: Pack[] = await fetch("/packs.json").then(res => res.json());
	return packs;
}

export async function loadPack(path: string): Promise<Data> {
	return {
		names: new Map(await fetch(`${path}/names.json`).then(res => res.json())),
		processes: await fetch(`${path}/processes.json`).then(res => res.json()),
		recipes_r: new Map(await fetch(`${path}/recipes_r.json`).then(res => res.json())),
		recipes_u: new Map(await fetch(`${path}/recipes_u.json`).then(res => res.json())),
		oredict: new Map(await fetch(`${path}/oredict.json`).then(res => res.json())),
		oredict_inv: new Map(await fetch(`${path}/oredict_inv.json`).then(res => res.json())),
	};
}

export function pushHistory(type: PageType, query: string) {
	let page: Page = {type, query}
	let current_page = history.pages[history.index]!;
	if (page.type == current_page.type && page.query == current_page.query) {
		updateHistoryButtons();
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
	let page = history.pages[index]!;
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
	close_button.disabled = results_div.children.length == 0;
}
