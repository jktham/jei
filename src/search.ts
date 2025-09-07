import type { Recipes } from "./recipes";

export class Search {
	input_element: HTMLInputElement = document.getElementById("search")! as HTMLInputElement;
	results_element: HTMLDivElement = document.getElementById("results")! as HTMLDivElement;
	names: Map<string, string>;
	recipes: Recipes;

	constructor(names: Map<string, string>, recipes: Recipes) {
		this.names = names;
		this.recipes = recipes;

		this.input_element.addEventListener("keyup", (e) => {
			if (e.key != "Enter") return;
			this.search((e.target as HTMLInputElement).value);
		});
	}

	search(query: string) {
		if (!query) return;
		let url = new URL(window.location.toString());
		url.searchParams.delete("recipes");
		url.searchParams.delete("uses");
		if (query != url.searchParams.get("search")) {
			url.searchParams.set("search", query);
			history.pushState(null, "", url);
		}
		document.title = `jei search ${query}`;

		this.clearResults();
		this.recipes.clearRecipes();

		let res: [string, string][] = [];
		for (let [k, v] of this.names.entries()) {
			if (k.toLowerCase().includes(query) || v.toLowerCase().includes(query)) {
				res.push([k, v]);
			}
		}
		res = res.slice(0, 1000);

		for (let r of res) {
			this.appendResult(r[0], r[1], `/data/nomi_ceu_1.7.5_hm/icons/${r[0].replaceAll(":", "__")}.png`);
		}
		if (res.length == 0) {
			this.appendResult(query, "no :(", "/data/nomi_ceu_1.7.5_hm/icons/minecraft__paper__0.png");
		}
	}

	clearResults() {
		this.results_element.innerHTML = "";
		this.results_element.scrollTop = 0;
	}

	appendResult(id: string, name: string, icon: string) {
		let result_element = document.createElement("div");
		let name_element = document.createElement("span");
		let id_element = document.createElement("span");
		let icon_element = document.createElement("img");
		result_element.className = "result";
		name_element.className = "name";
		id_element.className = "id";
		icon_element.className = "icon";
		
		name_element.textContent = name;
		id_element.textContent = id;
		icon_element.src = icon;
		icon_element.loading = "lazy";
		icon_element.onerror = () => icon_element.src = "/data/nomi_ceu_1.7.5_hm/icons/minecraft__paper__0.png";
		result_element.onclick = () => {
			this.clearResults();
			this.recipes.search(this.recipes.recipes_r, id);
		};
		result_element.oncontextmenu = (e) => {
			e.preventDefault();
			this.clearResults();
			this.recipes.search(this.recipes.recipes_u, id);
		};

		result_element.appendChild(icon_element);
		result_element.appendChild(name_element);
		result_element.appendChild(id_element);
		this.results_element.appendChild(result_element);
	}

}