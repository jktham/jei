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
	fs.writeFileSync(`./public/data/${name}/names.json`, JSON.stringify([...names.entries()]));
	console.log(`parsed ${names.size} item names`);

	let oredict = parseOredict(fs.readFileSync(`./resources/${name}/oredict.txt`).toString(), names);
	fs.writeFileSync(`./public/data/${name}/oredict.json`, JSON.stringify([...oredict.entries()]));
	let oredict_inv = invertOredict(oredict);
	fs.writeFileSync(`./public/data/${name}/oredict_inv.json`, JSON.stringify([...oredict_inv.entries()]));
	console.log(`parsed ${oredict.size} oredict entries`);

	let processes = parseProcesses(fs.readFileSync(`./resources/${name}/recipes.json`).toString());
	processes = reduceProcessesOredict(processes, oredict, oredict_inv);
	fs.writeFileSync(`./public/data/${name}/processes.json`, JSON.stringify(processes));
	let recipes_r = generateRecipesR(processes);
	fs.writeFileSync(`./public/data/${name}/recipes_r.json`, JSON.stringify([...recipes_r.entries()]));
	let recipes_u = generateRecipesU(processes);
	fs.writeFileSync(`./public/data/${name}/recipes_u.json`, JSON.stringify([...recipes_u.entries()]));
	console.log(`parsed ${processes.reduce((acc, r) => acc + r.recipes.length, 0)} recipes`);

	fs.cpSync(`./resources/${name}/icons`, `./public/data/${name}/icons`, {recursive: true});
	console.log(`copied ${fs.readdirSync(`./public/data/${name}/icons`).length} icons`);
}

function parseNames(names_str: string): Map<string, string> {
	let names: Map<string, string> = new Map();

	for (let line of names_str.split(/\r?\n/)) {
		let match = [...line.matchAll(/<(.*)>.*?","(.*)"/g)];
		let id = match[0]?.[1];
		let display = match[0]?.[2];

		// add explicit :0
		if (id?.match(/:\d+$/) === null) {
			id += ":0";
		}

		if (id && display) {
			names.set(id, display);
		}
	}

	return names;
}

function parseOredict(oredict_str: string, names: Map<string, string>): Map<string, string[]> {
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

	// expand wildcards
	for (let entry of oredict.values()) {
		for (let id of entry) {
			if (id?.includes(":*")) {
				let prefix = id.replace(":*", "");
				let valid_ids = [];
				for (let i=0; i<100; i++) {
					if (names.has(`${prefix}:${i}`)) {
						valid_ids.push(`${prefix}:${i}`);
					}
				}
				entry.splice(entry.indexOf(id), 1, ...valid_ids);
			}
		}
	}

	// add explicit :0
	for (let entry of oredict.values()) {
		for (let i=0; i<entry.length; i++) {
			if (entry[i]?.match(/:\d+$/) === null) {
				entry[i] += ":0";
			}
		}
	}

	// some manual fixes for the nomi dump
	oredict.set("ore:stairWoodFix", ["minecraft:oak_stairs:0", "minecraft:spruce_stairs:0", "minecraft:birch_stairs:0", "minecraft:jungle_stairs:0", "minecraft:acacia_stairs:0", "minecraft:dark_oak_stairs:0", "gregtech:rubber_wood_stairs:0"]);
	oredict.set("ore:blockQuartzFix", ["minecraft:quartz_block:0", "minecraft:quartz_block:1", "minecraft:quartz_block:2"]);
	oredict.set("ore:gemCoalFix", ["minecraft:coal", "minecraft:coal:1"]);
	oredict.set("ore:blockSandstoneFix", ["minecraft:sandstone:0", "minecraft:sandstone:1", "minecraft:sandstone:2"]);
	oredict.set("ore:blockRedSandstoneFix", ["minecraft:red_sandstone:0", "minecraft:red_sandstone:1", "minecraft:red_sandstone:2"]);

	return oredict;
}

function invertOredict(oredict: Map<string, string[]>): Map<string, string[]> {
	let oredict_inv: Map<string, string[]> = new Map();
	for (let [k, vs] of oredict) {
		for (let v of vs) {
			let prev = oredict_inv.get(v);
			if (!prev) {
				oredict_inv.set(v, [k]);
			} else {
				oredict_inv.set(v, [...prev, k]);
			}
		}
	}
	return oredict_inv;
}

export type Stack = {
	id: string,
	count: number,
};

export type Recipe = {
	inputs: Stack[],
	outputs: Stack[],
};

export type Process = {
	id: string,
	machines: string[],
	recipes: Recipe[],
}

function parseProcesses(processes_str: string): Process[] {
	let processes: Process[] = [];
	let raw_processes = JSON.parse(processes_str);
	for (let raw_process of raw_processes) {
		let process: Process = {
			id: raw_process?.id,
			machines: raw_process?.catalysts.map((m: any) => {return m.name}),
			recipes: raw_process?.recipes.map((r: any) => {return {
				inputs: r?.inputs.map((i: any) => {return {id: i.name, count: i.count}}),
				outputs: r?.outputs.map((o: any) => {return {id: o.name, count: o.count}}),
			}}),
		}
		processes.push(process);
	}
	return processes;
}

// recipe dump contains oredict variants as subsequent inputs, replace with most specific and largest matching groups. 
// mostly works but turns out not every variant is an oredict group, need to fix in dump mod itself
function reduceProcessesOredict(processes: Process[], oredict: Map<string, string[]>, oredict_inv: Map<string, string[]>): Process[] {
	for (let process of processes) {
		for (let recipe of process.recipes) {
			let n = recipe.inputs.length;
			let ores: string[] = [];

			for (let i=0; i<n; i++) {
				ores = [...new Set(ores.concat(oredict_inv.get(recipe.inputs[i].id) ?? []))];
			}
			let entries = ores.map(o => oredict.get(o) ?? []);

			type Match = {
				entry: string[],
				ore: string,
				index: number,
				length: number,
			};
			let matches: Match[] = [];
			for (let entry of entries) {
				for (let i=0; i < recipe.inputs.length - entry.length + 1; i++) {
					if(entry.every((e, j) => (e == recipe.inputs[i + j].id))) {
						matches.push({
							entry: entry,
							ore: ores[entries.indexOf(entry)],
							index: i,
							length: entry.length,
						});
					}
				}
			}
			
			// check for overlaps, pick longest match
			for (let match1 of matches) {
				for (let match2 of matches) {
					if (match1 !== match2 && match1.index < match2.index + match2.length && match2.index < match1.index + match1.length) {
						if (match1.length >= match2.length) {
							match2.length = 0;
						} else {
							match1.length = 0;
						}
					}
				}
			}
			matches = matches.filter(m => m.length != 0);

			for (let match of matches) {
				recipe.inputs[match.index].id = match.ore;
				for (let j=1; j<match.length; j++) {
					recipe.inputs[match.index+j].id = "";
				}
			}
			recipe.inputs = recipe.inputs.filter(i => i.id != "");
		}
	}
	return processes;
}

function generateRecipesR(processes: Process[]): Map<string, string[]> {
	let recipes_r: Map<string, string[]> = new Map();
	for (let [i, process] of processes.entries()) {
		for (let [j, recipe] of process.recipes.entries()) {
			for (let output of recipe.outputs) {
				let prev = recipes_r.get(output.id);
				if (!prev) {
					recipes_r.set(output.id, [`${i}.${j}`]);
				} else {
					recipes_r.set(output.id, [...prev, `${i}.${j}`]);
				}
			}
		}
	}
	return recipes_r;
}

function generateRecipesU(processes: Process[]): Map<string, string[]> {
	let recipes_u: Map<string, string[]> = new Map();
	for (let [i, process] of processes.entries()) {
		for (let [j, recipe] of process.recipes.entries()) {
			for (let input of recipe.inputs) {
				let prev = recipes_u.get(input.id);
				if (!prev) {
					recipes_u.set(input.id, [`${i}.${j}`]);
				} else {
					recipes_u.set(input.id, [...prev, `${i}.${j}`]);
				}
			}
		}
	}
	return recipes_u;
}

generate();
