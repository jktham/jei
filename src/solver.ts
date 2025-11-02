import TinyQueue from "tinyqueue";
import { searchRecipes } from "./search";
import type { Data, Node, Recipe, Stack } from "./types";
import { newUuid } from "./util";
import { getPath } from "./chart";

// idea:
// build graph of path options
// mark free source verts
// dijkstra from sources
// walk graph from root and pick lowest dist options

export function solveTree(root: Node, data: Data): Node[] {
	let t0 = Date.now();
	console.log("solving");

	let path = getPath(root);
	let prevSeenItems = new Set(path.flatMap(n => n.recipe.outputs.map(s => s.id)));

	let graph = buildGraph(root.recipe, data, prevSeenItems);
	console.log(`graph done, ${Date.now() - t0}ms`, graph);

	dijkstra(0, graph);
	console.log(`dijkstra done, ${Date.now() - t0}ms`);

	// trimGraph(graph);
	// console.log(`trim done, ${Date.now() - t0}ms`, graph);

	let nodes = createNodes(graph);
	console.log(`nodes done, ${Date.now() - t0}ms`, nodes);
	replaceNode(nodes, 0, root);
	return nodes;
}

const free = new Set([
	"gregtech:hammer:0",
	"gregtech:wire_cutter:0",
	"gregtech:screwdriver:0",
	"gregtech:file:0",
	"gregtech:saw:0",
	"gregtech:mortar:0",
	"gregtech:knife:0",
	"gregtech:wrench:0",
	"gregtech:meta_item_1:461",
	"gregtech:meta_lens:2000",
	"fluid:water",
	"gregtech:rubber_log:0",
	"forge:bucketfilled:0",
]);

for (let i=0; i<=57; i++) {
	free.add(`gregtech:meta_item_1:${i}`);
}

for (let i=821; i<=835; i++) {
	free.add(`gregtech:meta_item_1:${i}`);
}

const freePrefixes = [
	"deepmoblearning:data_model_",
	"gregtech:ore_",
	"thermalfoundation:fertilizer:",
	"minecraft:log",
];

function isFree(stack: Stack): boolean {
	return free.has(stack.id) || freePrefixes.some(prefix => stack.id.startsWith(prefix));
}

type Vertex = {
	recipe: Recipe,
	index: number,
	cost: number,
	dist: number,
	parent?: number,
	path?: number,
	seenItems?: Set<string>,
	stackIndex: number,
};

type Graph = {
	vertices: Vertex[],
	edges: number[][],
	free: Vertex[],
};

function newVertex(recipe: Recipe, index: number): Vertex {
	return {
		recipe,
		index,
		cost: scaleCost(recipe.score),
		dist: Infinity,
		parent: undefined,
		path: undefined,
		seenItems: undefined,
		stackIndex: 0,
	};
}

function buildGraph(root: Recipe, data: Data, prevSeenItems?: Set<string>): Graph {
	let graph: Graph = {
		vertices: [],
		edges: [],
		free: [],
	};

	let queue: Vertex[] = [];
	let r = newVertex(root, 0);
	r.seenItems = new Set(prevSeenItems);
	r.recipe.outputs.map(stack => r.seenItems!.add(stack.id));

	graph.vertices.push(r);
	graph.edges.push([]);
	queue.push(r);

	while (queue.length > 0 && graph.vertices.length < 10000) {
		let u = queue.shift()!;

		let neighbors: Vertex[] = [];
		for (let [i, stack] of u.recipe.inputs.entries()) {
			if (isFree(stack) || u.seenItems?.has(stack.id)) {
				continue;
			}

			let options = searchRecipes(stack.id, 'recipe', data).map(r => newVertex(r, -1));

			options = options.filter(v => v.cost != Infinity);
			options.sort((a, b) => a.cost - b.cost);
			options = options.slice(0, 1); // number of alternative paths

			options.map(v => {
				v.parent = u.index;
				v.seenItems = new Set(u.seenItems);
				v.recipe.outputs.map(stack => v.seenItems!.add(stack.id));
				v.stackIndex = i;
			});

			neighbors.push(...options);
		}
		
		if (u.recipe.inputs.every(isFree)) {
			graph.free.push(u);
		}

		for (let v of neighbors) {
			v.index = graph.vertices.length;
			graph.vertices.push(v);
			graph.edges.push([]);
			queue.push(v);

			graph.edges[u.index]!.push(v.index);
		}
	}

	return graph;
}

function dijkstra(source: number, graph: Graph) {
	if (source >= graph.vertices.length) throw new Error("invalid dijkstra source");
	let queue = new TinyQueue<Vertex>([], (a, b) => a.dist - b.dist);

	let s = graph.vertices[source]!;
	s.dist = 0;
	queue.push(s);

	while (queue.length > 0) {
		let u = queue.pop()!;

		let neighbors: Vertex[] = graph.edges[u.index]!.map(i => graph.vertices[i]!);

		for (let v of neighbors) {
			let dist = u.dist + v.cost;
			if (dist < v.dist) {
				v.dist = dist;
				v.path = u.index;
				queue.push(v);
			}
		}

	}
}

function trimGraph(graph: Graph) {
	let paths: number[][] = [];

	for (let s of graph.free.sort((a, b) => a.dist - b.dist)) {
		let u = graph.vertices[s.index]!;
		let path: Vertex[] = [u];

		while (u.path !== undefined) {
			u = graph.vertices[u.path]!;
			path.push(u);
		}

		path.reverse();
		paths.push(path.map(v => v.index));
	}
	
	if (paths.length > 0) {
		let p = new Set(paths.flat());
		graph.vertices = graph.vertices.filter(v => p.has(v.index));
		graph.edges = graph.edges.map(e => e.filter(v => p.has(v)));
	}
}

function createNodes(graph: Graph): Node[] {
	let nodes: Map<number, Node> = new Map();
	for (let v of graph.vertices) {
		let node = {
			recipe: v.recipe,
			inputNodes: [],
			outputNodes: [],
			position: {
				x: 0,
				y: 0,
			},
			uuid: newUuid(),
		};
		nodes.set(v.index, node);
	}
	for (let [u, vs] of graph.edges.entries()) {
		for (let v of vs) {
			if (nodes.has(u) && nodes.has(v)) {
				nodes.get(u)!.inputNodes.push(nodes.get(v)!);
				nodes.get(v)!.outputNodes.push(nodes.get(u)!);
			}
		}
	}
	for (let node of nodes.values()) {
		if (node.recipe.process.id == "minecraft.smelting") {
			node.recipe.inputs = node.recipe.inputs.filter(s => s.name != "Spawner Shards").slice(0, 1); // only show first ore in list
		}
	}
	return [...nodes.values()];
}

function replaceNode(nodes: Node[], index: number, newNode: Node) {
	let oldNode = nodes[index];
	if (oldNode) {
		for (let input of oldNode.inputNodes) {
			for (let i=0; i<input.outputNodes.length; i++) {
				if (input.outputNodes[i] == oldNode) {
					input.outputNodes[i] = newNode;
				}
			}
		}
		for (let output of oldNode.outputNodes) {
			for (let i=0; i<output.inputNodes.length; i++) {
				if (output.inputNodes[i] == oldNode) {
					output.inputNodes[i] = newNode;
				}
			}
		}
		newNode.inputNodes.push(...oldNode.inputNodes);
		newNode.outputNodes.push(...oldNode.outputNodes);
		nodes[index] = newNode;
	}
}

const processWeights: Map<string, number> = new Map([
	["gregtech:material_tree", -Infinity],
	["chisel.chiseling", -Infinity],
	["jeresources.dungeon", -Infinity],
	["jeresources.villager", -Infinity],
	["jeresources.worldgen", -Infinity],

	["gregtech:packer", -100],
	["gregtech:cutter", -50],
	["jeresources.mob", -100],
	["gregtech:arc_furnace_recycling", -100],
	["gregtech:extractor_recycling", -100],
	["gregtech:ore_by_product", -800],
	["gregtech:ore_spawn_location", -400],

	["minecraft.crafting", 50],
	["minecraft.smelting", 150],
	["gregtech:wiremill", 100],
	["gregtech:bender", 100],
	["gregtech:lathe", 200],
	["gregtech:assembler", 100],
	["gregtech:electric_blast_furnace", 300],
	["gregtech:mixer", 100],
	["gregtech:polarizer", 100],
	["gregtech:centrifuge", 100],
	["gregtech:rock_breaker", 100],
	["gregtech:gas_collector", 200],
	["gregtech:coke_oven", 100],
	["gregtech:chemical_reactor", 50],
	["gregtech:electrolyzer", 100],
	["gregtech:macerator", 100],
	["gregtech:arc_furnace", 100],
	["gregtech:fluid_spawn_location", 400],
	["actuallyadditions.reconstructor", 200],
]);

const inputPrefixWeights: [string, number][] = [
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
	["minecraft:glass:0", 200],
	["minecraft:cobblestone", 100],
	["fluid:water", 100],
	["fluid:plastic", 200],
	["fluid:hydrogen_sulfide", 300],
	["gregtech:meta_dust:103", 100],
	["gregtech:meta_dust:2010", 100],
];

const recipeWeights: Map<string, number> = new Map([
	["33.3", 200], // water -> hydrogen, oxygen
	["67.1804", 200], // liquid naquadria
	["6.15", 200], // gravel -> sand
	["6.14", 200], // cobble -> gravel
	["38.0", 200], // cobble
]);

export function getRecipeScore(recipe: Recipe): number {
	let score = 0;
	if (processWeights.has(recipe.process.id)) score += processWeights.get(recipe.process.id)!;
	let used = new Array(inputPrefixWeights.length).fill(0);
	for (let stack of recipe.inputs) {
		for (let [i, [prefix, r]] of inputPrefixWeights.entries()) {
			if (stack.id.startsWith(prefix) && used[i] == 0) { // only apply each prefix weight once
				score += r;
				used[i]++;
			}
		}
	}
	score += recipeWeights.get(recipe.id) ?? 0;
	return score;
}

function scaleCost(score: number): number {
	return Math.max(1000 - score, 0);
}
