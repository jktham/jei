import { searchRecipes } from "./search";
import type { Data, Node, Recipe, Stack } from "./types";
import { newUuid } from "./util";

export function solveTree(node: Node, data: Data): Node[] {
	let stop = ["gregtech:hammer", "gregtech:wire_cutter", "gregtech:screndriver", "gregtech:file", "gregtech:saw", "gregtech:mortar", "gregtech:meta_item_1:461", "deepmoblearning:data_model_", "gregtech:ore_", "fluid:water"];
	let nodes = solveStep(node, [], 5, stop, [], data);
	return nodes;
}

function solveStep(node: Node, nodes: Node[], depth: number, stop: string[], seen: string[], data: Data): Node[] {
	if (depth <= 0) return nodes;

	let count = 0;
	for (let stack of node.recipe.inputs) {
		if (stop.some(s => stack.id.startsWith(s))) continue;
		if (seen.includes(stack.id)) continue;

		let recipes = searchRecipes(stack.id, "recipe", data);
		let recipe = selectRecipe(recipes);

		if (recipe) {
			let child: Node = {
				recipe: recipe,
				children: [],
				position: {
					x: node.position.x + count * 160,
					y: node.position.y - 120,
				},
				uuid: newUuid(),
			};
			node.children.push(child);
			nodes.push(child);
			count++;

			seen = [...seen, stack.id];
			nodes = solveStep(child, nodes, depth - 1, stop, seen, data);
		}
	}

	return nodes;
}

function selectRecipe(recipes: Recipe[]): Recipe|undefined {
	let ignoredProcesses = ["gregtech:material_tree", "chisel.chiseling", "jeresources.dungeon", "jeresources.villager", "jeresources.worldgen"];
	let lowPriorityProcesses = ["gregtech:packer", "minecraft.crafting", "jeresources.mob", "gregtech:arc_furnace_recycling"];

	recipes = recipes.filter(r => !ignoredProcesses.includes(r.process.id));
	recipes.sort((a, b) => Number(lowPriorityProcesses.includes(a.process.id)) - Number(lowPriorityProcesses.includes(b.process.id)))

	let recipe = recipes[0];
	if (recipe?.process.id == "minecraft.smelting") {
		recipe.inputs = recipe.inputs.slice(0, 1);
	}
	return recipe;
}
