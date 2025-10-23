import type { InjectionKey, Ref } from "vue";
import type { Node, NodeMode, Recipe, SearchMode } from "./types";

export const searchKey = Symbol() as InjectionKey<(query: string, mode: SearchMode) => void>;
export const addToChartKey = Symbol() as InjectionKey<(recipe: Recipe) => void>;
export const removeFromChartKey = Symbol() as InjectionKey<(node: Node) => void>;
export const setActiveNodeKey = Symbol() as InjectionKey<(node: Node|undefined, mode: NodeMode|undefined) => void>;
export const updateLinesKey = Symbol() as InjectionKey<() => void>;
export const solveKey = Symbol() as InjectionKey<(node: Node) => void>;
export const chartZoomKey = Symbol() as InjectionKey<Ref<number>>;
