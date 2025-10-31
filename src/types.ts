export type RawStack = {
	id: string,
	count: number,
};

export type Process = {
	id: string,
	machines: string[],
	recipes: {
		inputs: RawStack[],
		outputs: RawStack[],
	}[],
};

export type Pack = {
	name: string,
	path: string,
};

export type Data = {
	names: Map<string, string>,
	processes: Process[],
	recipes_r: Map<string, string[]>,
	recipes_u: Map<string, string[]>,
	oredict: Map<string, string[]>,
	oredict_inv: Map<string, string[]>,
};

export type Stack = {
	id: string,
	count: number,
	name: string,
	icon: string,
};

export type Recipe = {
	process: Stack,
	machines: Stack[],
	inputs: Stack[],
	outputs: Stack[],
};

export type SearchMode = "item" | "recipe" | "use";

export type Page = {
	query: string,
	mode: SearchMode,
};

export type History = {
	pages: Page[],
	index: number,
};

export type Position = {
	x: number,
	y: number,
};

export type Node = {
	recipe: Recipe,
	inputNodes: Node[],
	outputNodes: Node[],
	position: Position,
	uuid: number,
};

export type NodeMode = "input" | "output";

export type Line = {
	p0: Position,
	p1: Position,
	c0: Position, // clamped
	c1: Position,
	uuid: number,
};
