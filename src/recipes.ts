import type { Process, Stack } from "./generate";

export class Recipes {
	recipes_element: HTMLDivElement = document.getElementById("recipes")! as HTMLDivElement;
	names: Map<string, string>;
	processes: Process[];
	recipes_r: Map<string, string[]>;
	recipes_u: Map<string, string[]>;
	oredict: Map<string, string[]>;
	oredict_inv: Map<string, string[]>;

	constructor(names: Map<string, string>, processes: Process[], recipes_r: Map<string, string[]>, recipes_u: Map<string, string[]>, oredict: Map<string, string[]>, oredict_inv: Map<string, string[]>) {
		this.names = names;
		this.processes = processes;
		this.recipes_r = recipes_r;
		this.recipes_u = recipes_u;
		this.oredict = oredict;
		this.oredict_inv = oredict_inv;
	}

	searchR(id: string) {
		console.log(id)
		this.clearRecipes();
		let keys = this.recipes_r.get(id) ?? [];
		for (let entry of this.oredict_inv.get(id) ?? []) {
			keys = keys.concat(this.recipes_r.get(entry) ?? []);
		}
		console.log(keys);
		for (let key of keys) {
			let i = Number(key.split(".")[0]);
			let j = Number(key.split(".")[1]);
			let process = this.processes[i].id;
			let machines = this.processes[i].machines;
			let inputs = this.processes[i].recipes[j].inputs;
			let outputs = this.processes[i].recipes[j].outputs;
			this.appendRecipe(process, machines, inputs, outputs);
		}
	}

	searchU(id: string) {
		this.clearRecipes();
		let keys = this.recipes_u.get(id) ?? [];
		for (let entry of this.oredict_inv.get(id) ?? []) {
			keys = keys.concat(this.recipes_u.get(entry) ?? []);
		}
		console.log(keys);
		for (let key of keys) {
			let i = Number(key.split(".")[0]);
			let j = Number(key.split(".")[1]);
			let process = this.processes[i].id;
			let machines = this.processes[i].machines;
			let inputs = this.processes[i].recipes[j].inputs;
			let outputs = this.processes[i].recipes[j].outputs;
			this.appendRecipe(process, machines, inputs, outputs);
		}
	}

	clearRecipes() {
		this.recipes_element.innerHTML = "";
		this.recipes_element.scrollTop = 0;
	}

	appendRecipe(process: string, machines: string[], inputs: Stack[], outputs: Stack[]) {
		let recipe_element = document.createElement("div");
		let inputs_element = document.createElement("div");
		let outputs_element = document.createElement("div");
		let icon_element = document.createElement("img");
		let arrow_element = document.createElement("div");
		recipe_element.className = "recipe";
		inputs_element.className = "inputs";
		outputs_element.className = "outputs";
		icon_element.className = "icon";
		arrow_element.className = "arrow";
		
		for (let stack of inputs) {
			let id = this.oredict.get(stack.id)?.[0] || stack.id;
			let name = this.names.get(id) || stack.id;
			let stack_element = document.createElement("img");
			stack_element.className = "stack";
			stack_element.src = `/data/nomi_ceu_1.7.5_hm/icons/${id.replaceAll(":", "__")}.png`;
			stack_element.title = `${name} (${id})`;
			stack_element.loading = "lazy";
			stack_element.onerror = () => stack_element.src = "/data/nomi_ceu_1.7.5_hm/icons/minecraft__paper__0.png";
			inputs_element.appendChild(stack_element);
		}
		for (let stack of outputs) {
			let id = this.oredict.get(stack.id)?.[0] || stack.id;
			let name = this.names.get(id) || stack.id;
			let stack_element = document.createElement("img");
			stack_element.className = "stack";
			stack_element.src = `/data/nomi_ceu_1.7.5_hm/icons/${id.replaceAll(":", "__")}.png`;
			stack_element.title = `${name} (${id})`;
			stack_element.loading = "lazy";
			stack_element.onerror = () => stack_element.src = "/data/nomi_ceu_1.7.5_hm/icons/minecraft__paper__0.png";
			outputs_element.appendChild(stack_element);
		}

		icon_element.src = `/data/nomi_ceu_1.7.5_hm/icons/${machines[0]?.replaceAll(":", "__")}.png`;
		icon_element.title = this.names.get(machines[0]) || machines[0] || process;
		icon_element.loading = "lazy";
		icon_element.onerror = () => icon_element.src = "/data/nomi_ceu_1.7.5_hm/icons/minecraft__paper__0.png";
		arrow_element.textContent = "🡒";

		recipe_element.appendChild(icon_element);
		recipe_element.appendChild(inputs_element);
		recipe_element.appendChild(arrow_element);
		recipe_element.appendChild(outputs_element);
		this.recipes_element.appendChild(recipe_element);
	}
}