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
	// packs: Pack[],
	names: Map<string, string>,
	processes: Process[],
	recipes_r: Map<string, string[]>,
	recipes_u: Map<string, string[]>,
	oredict: Map<string, string[]>,
	oredict_inv: Map<string, string[]>,
	// history: History,
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

export type SearchMode = "r" | "u";
