import fs from "fs";

async function generate() {
	console.log("generating recipe data");

	let packs = fs.readdirSync("./resources");
	console.log(`found packs: ${packs}`);

	if (!fs.existsSync("./public/data")) fs.mkdirSync("./public/data");
	for (let pack of packs) {
		await generatePack(pack);
	}

	console.log("done");
}

async function generatePack(name: string) {
	console.log(`generating ${name}`);
	if (fs.existsSync(`./public/data/${name}`)) fs.rmSync(`./public/data/${name}`, {recursive: true, force: true});
	fs.mkdirSync(`./public/data/${name}`);

	let names = parseNames(fs.readFileSync(`./resources/${name}/names.txt`).toString());
	fs.writeFileSync(`./public/data/${name}/names.json`, JSON.stringify(Object.fromEntries(names)));
	console.log(`parsed ${names.size} item names`);

	let oredict = parseOredict(fs.readFileSync(`./resources/${name}/oredict.txt`).toString());
	fs.writeFileSync(`./public/data/${name}/oredict.json`, JSON.stringify(Object.fromEntries(oredict)));
	console.log(`parsed ${oredict.size} oredict entries`);

	let recipes = parseRecipes(fs.readFileSync(`./resources/${name}/recipes.json`).toString());
	fs.writeFileSync(`./public/data/${name}/recipes.json`, JSON.stringify(recipes));
	console.log(`parsed ${recipes.length} recipes`);

	fs.cpSync(`./resources/${name}/icons`, `./public/data/${name}/icons`, {recursive: true});
	console.log(`copied ${fs.readdirSync(`./public/data/${name}/icons`).length} icons`);
}

function parseNames(names_str: string): Map<string, string> {
	let names: Map<string, string> = new Map();

	for (let line of names_str.split(/\r?\n/)) {
		let match = [...line.matchAll(/<(.*)>.*?","(.*)"/g)];
		let id = match[0]?.[1];
		let display = match[0]?.[2];

		if (id && display) {
			names.set(id, display);
		}
	}

	return names;
}

function parseOredict(oredict_str: string): Map<string, string[]> {
	let oredict: Map<string, string[]> = new Map();

	let key = "";
	let values: string[] = [];
	for (let line of oredict_str.split(/\r?\n/)) {
		if (line.startsWith("Ore entries for")) {
			key = [...line.matchAll(/<(.*)>/g)][0]?.[1];
			values = [];
		} else {
			values.push([...line.matchAll(/<(.*)>/g)][0]?.[1]);
		}

		if (key && values) {
			oredict.set(key, values);
		}
	}

	return oredict;
}

type Stack = {
	id: string,
	count: number,
};

type Recipe = {
	machine: string,
	inputs: Stack[],
	outputs: Stack[],
};

function parseRecipes(recipes_str: string): Recipe[] {
	let recipes: Recipe[] = [];

	let raw_recipes = JSON.parse(recipes_str);
	for (let machine of raw_recipes) {
		for (let raw_recipe of machine.recipes) {
			let recipe: Recipe = {
				machine: machine?.id,
				inputs: raw_recipe?.inputs.map((i: any) => {return {id: i.name, count: i.count}}),
				outputs: raw_recipe?.outputs.map((o: any) => {return {id: o.name, count: o.count}}),
			}

			recipes.push(recipe);
		}
	}

	return recipes;
}

generate();
