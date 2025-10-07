import { active_stacks, close_button, names, oredict_inv, processes, pushHistory, recipes_r, recipes_u, results_div, status_span } from "./app";
import { addNode } from "./chart";
import type { Stack } from "./generate";
import { createStackElement, createSymbol, dedupStacks, getRich, imgFallback } from "./util";

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
		results_div.appendChild(createItemResultElement(id, display, `/data/nomi_ceu_1.7.5_hm/icons/${id.replaceAll(":", "__")}.png`));
	}
	if (res.length == 0) {
		results_div.appendChild(createItemResultElement(query, ":(", "/data/nomi_ceu_1.7.5_hm/icons/minecraft__paper__0.png"));
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
		results_div.appendChild(createRecipeResultElement(process, machines, inputs, outputs));
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
		results_div.appendChild(createRecipeResultElement(process, machines, inputs, outputs));
	}
	status_span.textContent = `found ${res.length} uses`;
	pushHistory("use", id);
}

export function createItemResultElement(id: string, name: string, icon: string): HTMLDivElement {
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
	icon_img.onerror = imgFallback;
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

export function createRecipeResultElement(process: string, machines: string[], inputs: Stack[], outputs: Stack[]): HTMLDivElement {
	let recipe_div = document.createElement("div");
	let inputs_div = document.createElement("div");
	let outputs_div = document.createElement("div");
	let machines_div = document.createElement("div");
	let arrow_span = createSymbol("arrow_forward");
	let add_button = document.createElement("button");

	recipe_div.className = "recipe";
	inputs_div.className = "stacks";
	outputs_div.className = "stacks";
	machines_div.className = "stacks";
	add_button.className = "add";

	// let machines_rich = dedupStacks(machines.map(machine => {return {id: machine || process, count: 0}})).map(stack => getRich(stack));
	// machines_rich.map(stack => machines_div.appendChild(createStackElement(stack)));
	let machines_rich = [getRich({id: machines[0] || process, count: 0})];
	machines_div.appendChild(createStackElement(machines_rich[0], false));

	let inputs_rich = dedupStacks(inputs).map(stack => getRich(stack));
	let outputs_rich = dedupStacks(outputs).map(stack => getRich(stack));

	if (process == "gregtech:material_tree") inputs_div.style.display = "none";
	inputs_rich.map(stack => inputs_div.appendChild(createStackElement(stack, false)));
	outputs_rich.map(stack => outputs_div.appendChild(createStackElement(stack, false)));

	add_button.appendChild(createSymbol("add"));
	add_button.onclick = () => {
		clearResults();
		addNode(machines_rich[0], inputs_rich, outputs_rich);
		active_stacks[0] = {el: undefined, id: "", type: ""};
		active_stacks[1] = {el: undefined, id: "", type: ""};
	};

	recipe_div.appendChild(machines_div);
	recipe_div.appendChild(inputs_div);
	recipe_div.appendChild(arrow_span);
	recipe_div.appendChild(outputs_div);
	recipe_div.appendChild(add_button);
	return recipe_div;
}
