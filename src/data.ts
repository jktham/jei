import type { Pack, Data } from "./types";

export async function getPacks(): Promise<Pack[]> {
	let packs: Pack[] = await fetch("/packs.json").then(res => res.json());
	return packs;
}

export async function loadPack(path: string): Promise<Data> {
	return {
		names: new Map(await fetch(`${path}/names.json`).then(res => res.json())),
		processes: await fetch(`${path}/processes.json`).then(res => res.json()),
		recipes_r: new Map(await fetch(`${path}/recipes_r.json`).then(res => res.json())),
		recipes_u: new Map(await fetch(`${path}/recipes_u.json`).then(res => res.json())),
		oredict: new Map(await fetch(`${path}/oredict.json`).then(res => res.json())),
		oredict_inv: new Map(await fetch(`${path}/oredict_inv.json`).then(res => res.json())),
	};
}
