import { close_button, names, oredict, oredict_inv, processes, pushHistory, recipes_r, recipes_u, results_div, status_span } from "./app";
import { addNode } from "./chart";
import type { Stack } from "./generate";

export function clearResults() {
	results_div.innerHTML = "";
	results_div.scrollTop = 0;
	close_button.disabled = true;
}

export function searchItems(query: string) {
	clearResults();
	if (!query) return;

	let res: [string, string][] = [];
	for (let [id, display] of names.entries()) {
		if (id.toLowerCase().includes(query) || display.toLowerCase().includes(query)) {
			res.push([id, display]);
		}
	}
	
	res = res.filter(([id, _]) => {
		let recipes = recipes_r.get(id) ?? [];
		for (let entry of oredict_inv.get(id) ?? []) {
			recipes = recipes.concat(recipes_r.get(entry) ?? []);
		}
		let uses = recipes_u.get(id) ?? [];
		for (let entry of oredict_inv.get(id) ?? []) {
			uses = uses.concat(recipes_u.get(entry) ?? []);
		}
		return !(recipes.length == 0 && uses.length == 0) // item unused
	});

	for (let [id, display] of res) {
		results_div.appendChild(createItemResult(id, display, `/data/nomi_ceu_1.7.5_hm/icons/${id.replaceAll(":", "__")}.png`));
	}
	if (res.length == 0) {
		results_div.appendChild(createItemResult(query, ":(", "/data/nomi_ceu_1.7.5_hm/icons/minecraft__paper__0.png"));
	}
	status_span.textContent = `found ${res.length} items`;
	pushHistory("item", query);
}

export function searchRecipes(id: string) {
	clearResults();

	let res = recipes_r.get(id) ?? [];
	for (let entry of oredict_inv.get(id) ?? []) {
		res = res.concat(recipes_r.get(entry) ?? []);
	}
	for (let key of res) {
		let i = Number(key.split(".")[0]);
		let j = Number(key.split(".")[1]);
		let process = processes[i].id;
		let machines = processes[i].machines;
		let inputs = processes[i].recipes[j].inputs;
		let outputs = processes[i].recipes[j].outputs;
		results_div.appendChild(createRecipeResult(process, machines, inputs, outputs));
	}
	status_span.textContent = `found ${res.length} recipes`;
	pushHistory("recipe", id);
}

export function searchUses(id: string) {
	clearResults();

	let res = recipes_u.get(id) ?? [];
	for (let entry of oredict_inv.get(id) ?? []) {
		res = res.concat(recipes_u.get(entry) ?? []);
	}
	for (let key of res) {
		let i = Number(key.split(".")[0]);
		let j = Number(key.split(".")[1]);
		let process = processes[i].id;
		let machines = processes[i].machines;
		let inputs = processes[i].recipes[j].inputs;
		let outputs = processes[i].recipes[j].outputs;
		results_div.appendChild(createRecipeResult(process, machines, inputs, outputs));
	}
	status_span.textContent = `found ${res.length} uses`;
	pushHistory("use", id);
}

export function createItemResult(id: string, name: string, icon: string): HTMLDivElement {
	let item_div = document.createElement("div");
	let name_span = document.createElement("span");
	let id_span = document.createElement("span");
	let icon_img = document.createElement("img");

	item_div.className = "item";
	name_span.className = "name";
	id_span.className = "id";
	icon_img.className = "icon";
	
	name_span.textContent = name;
	id_span.textContent = id;
	icon_img.src = icon;
	icon_img.loading = "lazy";
	icon_img.onerror = () => icon_img.src = "/data/nomi_ceu_1.7.5_hm/icons/minecraft__paper__0.png";
	icon_img.draggable = false;
	item_div.onclick = () => {
		clearResults();
		searchRecipes(id);
	};
	item_div.oncontextmenu = (e) => {
		e.preventDefault();
		clearResults();
		searchUses(id);
	};

	item_div.appendChild(icon_img);
	item_div.appendChild(name_span);
	item_div.appendChild(id_span);
	return item_div;
}

export function createRecipeResult(process: string, machines: string[], inputs: Stack[], outputs: Stack[]): HTMLDivElement {
	let recipe_div = document.createElement("div");
	let inputs_div = document.createElement("div");
	let outputs_div = document.createElement("div");
	let icon_img = document.createElement("img");
	let arrow_span = document.createElement("div");
	let add_button = document.createElement("button");

	recipe_div.className = "recipe";
	icon_img.className = "icon";
	arrow_span.className = "arrow material-symbols-outlined";
	inputs_div.className = "inputs";
	outputs_div.className = "outputs";
	add_button.className = "add";

	let icon_overrides: Map<string, string> = new Map([
		["gregtech:material_tree", "/data/nomi_ceu_1.7.5_hm/icons/minecraft__book__0.png"],
		["jeresources.mob", "/data/nomi_ceu_1.7.5_hm/icons/minecraft__skull__2.png"],
		["jeresources.dungeon", "/data/nomi_ceu_1.7.5_hm/icons/minecraft__chest__0.png"],
		["jeresources.villager", "/data/nomi_ceu_1.7.5_hm/icons/minecraft__emerald__0.png"],
		["jei.information", "/data/nomi_ceu_1.7.5_hm/icons/minecraft__writable_book__0.png"],
		["gregtech:circuit.integrated", "/data/nomi_ceu_1.7.5_hm/icons/gregtech__meta_item_1__461.png"],
	]);
	icon_img.src = icon_overrides.get(machines[0] || process) || `/data/nomi_ceu_1.7.5_hm/icons/${machines[0]?.replaceAll(":", "__")}.png`;
	icon_img.title = names.get(machines[0]) || machines[0] || process;
	icon_img.loading = "lazy";
	icon_img.onerror = () => icon_img.src = "/data/nomi_ceu_1.7.5_hm/icons/minecraft__paper__0.png";
	icon_img.draggable = false;
	arrow_span.textContent = "arrow_forward";
	
	let dedup_inputs = dedupStacks(inputs);
	if (process == "gregtech:material_tree") dedup_inputs = [];
	if (dedup_inputs.length == 0) inputs_div.style.display = "none";
	let dedup_outputs = dedupStacks(outputs);
	dedup_inputs.map(stack => inputs_div.appendChild(createStack(stack)));
	dedup_outputs.map(stack => outputs_div.appendChild(createStack(stack)));

	add_button.innerHTML = "<span class=\"material-symbols-outlined\">add</span>";
	add_button.onclick = () => {addNode(machines[0], dedup_inputs, dedup_outputs); clearResults()};

	recipe_div.appendChild(icon_img);
	recipe_div.appendChild(inputs_div);
	recipe_div.appendChild(arrow_span);
	recipe_div.appendChild(outputs_div);
	recipe_div.appendChild(add_button);
	return recipe_div;
}

function dedupStacks(stacks: Stack[]): Stack[] {
	return [...new Set(stacks.map(s => s.id))].map(id => {return {id: id, count: stacks.filter(s => s.id == id).map(s => s.count).reduce((c, acc) => acc + c, 0)}}).sort((a, b) => a.id.localeCompare(b.id));
}

export function createStack(stack: Stack) {
	let id = oredict.get(stack.id)?.[0] || stack.id;
	let name = names.get(id) || stack.id;

	let stack_div = document.createElement("div");
	let icon_img = document.createElement("img");
	let count_span = document.createElement("span");
	
	stack_div.className = "stack";
	icon_img.className = "icon";
	count_span.className = "count";

	stack_div.title = `${name} (${id})`;
	stack_div.onclick = () => {
		searchRecipes(id);
	};
	stack_div.oncontextmenu = (e) => {
		e.preventDefault();
		searchUses(id);
	};
	icon_img.src = `/data/nomi_ceu_1.7.5_hm/icons/${id.replaceAll(":", "__")}.png`;
	icon_img.loading = "lazy";
	icon_img.onerror = () => icon_img.src = "/data/nomi_ceu_1.7.5_hm/icons/minecraft__paper__0.png";
	icon_img.draggable = false;
	count_span.textContent = stack.count.toString();

	stack_div.appendChild(icon_img);
	stack_div.appendChild(count_span);
	return stack_div;
}
