export class Search {
	input: HTMLInputElement = document.getElementById("search")! as HTMLInputElement;
	results: HTMLDivElement = document.getElementById("results")! as HTMLDivElement;
	names: Map<string, string>;

	constructor(names: Map<string, string>) {
		this.names = names;

		this.input.addEventListener("keyup", (e) => {
			if (e.key != "Enter") return;
			this.search((e.target as HTMLInputElement).value);
		});
	}

	search(query: string) {
		this.clearResults();

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
		this.results.innerHTML = "";
		this.results.scrollTop = 0;
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
		result_element.onclick = () => this.selectResult(id);

		result_element.appendChild(icon_element);
		result_element.appendChild(name_element);
		result_element.appendChild(id_element);
		this.results.appendChild(result_element);
	}

	selectResult(id: string) {
		this.clearResults();
		console.log(id);
	}

}