import { Search } from "./search";

async function main() {
	let names: Map<string, string> = new Map(await fetch("/data/nomi_ceu_1.7.5_hm/names.json").then(res => res.json()));

	// @ts-ignore c:
	let search = new Search(names);
}

main();
