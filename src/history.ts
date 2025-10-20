import type { History, SearchMode } from "./types";

export function historyPush(history: History, page: string) {
	if (history.pages[history.index] == page) return;
	history.pages = history.pages.slice(0, history.index+1);
	history.pages.push(page);
	history.index = history.pages.length - 1;
}

export function historyBack(history: History, search: (query: string, mode: SearchMode) => void) {
	let index = Math.max(0, history.index - 1);
	historyGo(history, index, search);
}

export function historyForward(history: History, search: (query: string, mode: SearchMode) => void) {
	let index = Math.min(history.pages.length - 1, history.index + 1);
	historyGo(history, index, search);
}

export function historyGo(history: History, index: number, search: (query: string, mode: SearchMode) => void) {
	let page = history.pages[index];
	if (!page) return;
	history.index = index;
	
	let [mode, query] = page.split(/\//) as [SearchMode, string];
	search(query, mode);
}
