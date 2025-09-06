async function main() {
	let names: Map<string, string> = new Map(await fetch("/data/nomi_ceu_1.7.5_hm/names.json").then(res => res.json()));
	document.getElementById("search")?.addEventListener("keyup", (e) => {
		let query = (e.target as HTMLInputElement).value;
		let name = names.get(query);
		
		(document.getElementById("name") as HTMLSpanElement).textContent = name ?? "not found";
		(document.getElementById("id") as HTMLSpanElement).textContent = query;

		let img = `http://localhost:5173/data/nomi_ceu_1.7.5_hm/icons/${query.replaceAll(":", "__")}.png`;
		if (!name) img = `http://localhost:5173/data/nomi_ceu_1.7.5_hm/icons/minecraft__paper__0.png`;
		(document.getElementById("icon") as HTMLImageElement).src = img;
	});
	if ((document.getElementById("search") as HTMLInputElement).value == "") (document.getElementById("search") as HTMLInputElement).value = "gregtech:machine:1001";
	document.getElementById("search")?.dispatchEvent(new Event("keyup"));
}

main();
