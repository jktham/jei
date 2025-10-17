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
};


export type Pack = {
	name: string,
	path: string,
};

export type PageType = "item" | "recipe" | "use";

export type Page = {
	type: PageType,
	query: string,
};

export type History = {
	pages: Page[],
	index: number,
};


export type ActiveStack = {
	el: HTMLDivElement | undefined,
	id: string,
	type: "input" | "output" | "",
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
