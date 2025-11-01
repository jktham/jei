import type { InjectionKey, Ref } from "vue";
import type { Data } from "./types";

export const dataKey = Symbol() as InjectionKey<Ref<Data>>;
export const setStatusKey = Symbol() as InjectionKey<(text: string) => void>;
