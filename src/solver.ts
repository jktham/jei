import { searchRecipes } from "./search";
import type { Data, Node, Recipe } from "./types";
import { newUuid } from "./util";

export function solveTree(root: Node, data: Data): Node[] {
	let nodes = solveStep(root, [], 20, 10000, new Set(), data);
	return nodes;
}

const stop = new Set([
	"gregtech:hammer:0",
	"gregtech:wire_cutter:0",
	"gregtech:screndriver:0",
	"gregtech:file:0",
	"gregtech:saw:0",
	"gregtech:mortar:0",
	"gregtech:meta_item_1:461",
	"fluid:water",
	"gregtech:rubber_log:0",
	"forge:bucketfilled:0",
]);

for (let i=0; i<=57; i++) {
	stop.add(`gregtech:meta_item_1:${i}`);
}

for (let i=821; i<=835; i++) {
	stop.add(`gregtech:meta_item_1:${i}`);
}

const stopPrefixes = [
	"deepmoblearning:data_model_",
	"gregtech:ore_",
	"thermalfoundation:fertilizer:",
	"minecraft:log",
];

function solveStep(node: Node, nodes: Node[], depth: number, limit: number, seen: Set<string>, data: Data): Node[] {
	if (depth <= 0) return nodes;
	if (nodes.length >= limit) return nodes;

	for (let stack of node.recipe.inputs) {
		if (stop.has(stack.id)) continue;
		if (stopPrefixes.some(id => stack.id.startsWith(id))) continue;
		if (seen.has(stack.id)) continue;

		let recipes = searchRecipes(stack.id, "recipe", data);
		let recipe = selectRecipe(recipes);

		if (recipe) {
			let child: Node = {
				recipe: recipe,
				children: [],
				position: {
					x: node.position.x,
					y: node.position.y,
				},
				uuid: newUuid(),
			};
			node.children.push(child);
			nodes.push(child);

			seen = new Set(seen).add(stack.id);
			nodes = solveStep(child, nodes, depth - 1, limit, seen, data);
		}
	}

	return nodes;
}

type RatedRecipe = Recipe & {rating: number};

function selectRecipe(recipes: Recipe[]): Recipe|undefined {
	let ratedRecipes = rateRecipes(recipes);
	ratedRecipes = ratedRecipes.filter(r => r.rating != -Infinity);
	ratedRecipes.sort((a, b) => b.rating - a.rating);

	let recipe = ratedRecipes[0];
	if (recipe?.process.id == "minecraft.smelting") { // long list of ores
		recipe.inputs = [recipe.inputs.find(stack => stack.id.endsWith("_0:0")) ?? recipe.inputs.find(stack => stack.id.endsWith("_0:1")) ?? recipe.inputs[0]!];
	}
	return recipe;
}

const processes = new Map<string, number>([
	["gregtech:material_tree", -Infinity],
	["chisel.chiseling", -Infinity],
	["jeresources.dungeon", -Infinity],
	["jeresources.villager", -Infinity],
	["jeresources.worldgen", -Infinity],

	["gregtech:packer", -100],
	["jeresources.mob", -100],
	["gregtech:arc_furnace_recycling", -100],
	["gregtech:extractor_recycling", -100],
	["gregtech:ore_by_product", -800],
	["gregtech:ore_spawn_location", -400],

	["minecraft.crafting", 50],
	["minecraft.smelting", 150],
	["gregtech:wiremill", 100],
	["gregtech:lathe", 100],
	["gregtech:assembler", 100],
	["gregtech:electric_blast_furnace", 300],
	["gregtech:mixer", 100],
	["gregtech:polarizer", 100],
	["gregtech:centrifuge", 100],
	["gregtech:rock_breaker", 100],
	["gregtech:gas_collector", 200],
	["gregtech:coke_oven", 100],
	["gregtech:chemical_reactor", 50],
	["gregtech:macerator", 100],
	["gregtech:arc_furnace", 100],
	["gregtech:fluid_spawn_location", 400],
]);

const inputs: [string, number][] = [
	["gregtech:meta_nugget", -100],
	["nomilabs:meta_nugget", -100],
	["gregtech:meta_dust_small", -100],
	["nomilabs:meta_dust_small", -100],
	["gregtech:meta_dust_tiny", -100],
	["nomilabs:meta_dust_tiny", -100],
	["gregtech:meta_crushed_centrifuged", -100],
	["nomilabs:meta_crushed_centrifuged", -100],
	["gregtech:meta_crushed_purified", -100],
	["nomilabs:meta_crushed_purified", -100],
	["gregtech:meta_dust_pure", -100],
	["nomilabs:meta_dust_pure", -100],
	["fluid:plasma", -100],

	["gregtech:ore_", 300],
	["nomilabs:ore_", 300],
	["minecraft:ore_", 300],
	["gregtech:meta_ingot", 100],
	["nomilabs:meta_ingot", 100],
	["gregtech:meta_gem:", 150],
	["gregtech:rubber_log", 100],
	["gregtech:meta_item_1:438", 100],
	["minecraft:log", 100],
	["minecraft:glass", 100],
	["minecraft:cobblestone", 100],
	["fluid:water", 100],
	["fluid:plastic", 200],
	["fluid:hydrogen_sulfide", 300],
	["gregtech:meta_dust:103", 100],
	["gregtech:meta_dust:2010", 100],
];

// todo: preferred recipes

function rateRecipes(recipes: Recipe[]): RatedRecipe[] {
	let rated = recipes.map(r => {return {...r, rating: 0}});

	for (let recipe of rated) {
		recipe.rating = 0;
		if (processes.has(recipe.process.id)) recipe.rating += processes.get(recipe.process.id)!;
		for (let stack of recipe.inputs) {
			for (let [prefix, r] of inputs) {
				if (stack.id.startsWith(prefix)) recipe.rating += r;
			}
		}
	}
	
	return rated;
}
