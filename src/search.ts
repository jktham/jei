import { names, oredict, oredict_inv, processes, recipes_r, recipes_u, results_div, status_span } from "./app";
import type { Stack } from "./generate";

export function clearResults() {
	results_div.innerHTML = "";
	results_div.scrollTop = 0;
}

export function searchItems(query: string) {
	if (!query) return;
	clearResults();

	let res: [string, string][] = [];
	for (let [k, v] of names.entries()) {
		if (k.toLowerCase().includes(query) || v.toLowerCase().includes(query)) {
			res.push([k, v]);
		}
	}

	for (let r of res) {
		results_div.appendChild(createItemResult(r[0], r[1], `/data/nomi_ceu_1.7.5_hm/icons/${r[0].replaceAll(":", "__")}.png`));
	}
	if (res.length == 0) {
		results_div.appendChild(createItemResult(query, ":(", "/data/nomi_ceu_1.7.5_hm/icons/minecraft__paper__0.png"));
	}
	status_span.textContent = `found ${res.length} items`;
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
	let arrow_div = document.createElement("div");

	recipe_div.className = "recipe";
	icon_img.className = "icon";
	arrow_div.className = "arrow";
	inputs_div.className = "inputs";
	outputs_div.className = "outputs";

	icon_img.src = `/data/nomi_ceu_1.7.5_hm/icons/${machines[0]?.replaceAll(":", "__")}.png`;
	icon_img.title = names.get(machines[0]) || machines[0] || process;
	icon_img.loading = "lazy";
	icon_img.onerror = () => icon_img.src = "/data/nomi_ceu_1.7.5_hm/icons/minecraft__paper__0.png";
	arrow_div.textContent = "🡒";
	
	let dedup_inputs = dedupStacks(inputs);
	let dedup_outputs = dedupStacks(outputs);
	dedup_inputs.map(stack => inputs_div.appendChild(createStack(stack)));
	dedup_outputs.map(stack => outputs_div.appendChild(createStack(stack)));

	recipe_div.onclick = () => console.log(process);

	recipe_div.appendChild(icon_img);
	recipe_div.appendChild(inputs_div);
	recipe_div.appendChild(arrow_div);
	recipe_div.appendChild(outputs_div);
	return recipe_div;
}

function dedupStacks(stacks: Stack[]): Stack[] {
	return [...new Set(stacks.map(s => s.id))].map(id => {return {id: id, count: stacks.filter(s => s.id == id).map(s => s.count).reduce((c, acc) => acc + c, 0)}});
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
	count_span.textContent = stack.count.toString();

	stack_div.appendChild(icon_img);
	stack_div.appendChild(count_span);
	return stack_div;
}
