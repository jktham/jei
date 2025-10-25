<script setup lang="ts">
import { getPacks, loadPack } from '@/data';
import { searchItems, searchRecipes } from '@/search';
import { computedAsync } from '@vueuse/core';
import { watch, ref, computed, provide, useTemplateRef } from 'vue';
import ItemResult from './ItemResult.vue';
import type { Recipe, Stack, SearchMode, History, Node as NodeT, NodeMode, Position } from '@/types';
import RecipeResult from './RecipeResult.vue';
import Symbol from './Symbol.vue';
import { historyBack, historyForward, historyPush, historyGo } from '@/history';
import Node from './Node.vue';
import { add, len, newUuid, sub } from '@/util';
import { solveTree } from '@/solver';
import { alignTree, getNodeSize, getStackPos, grabStart } from '@/chart';
import { addAndSolveKey, addToChartKey, chartZoomKey, dataKey, removeFromChartKey, searchKey, setActiveNodeKey, solveKey, updateLinesKey } from '@/keys';

// data
const packs = await getPacks();
const pack = ref(localStorage.getItem("pack") ?? packs[0]?.path ?? "");

watch(pack, (p) => {
	localStorage.setItem("pack", p);
});

const data = computedAsync(async () => {
	return await loadPack(pack.value);
}, {
	names: new Map(),
	processes: [],
	recipes_r: new Map(),
	recipes_u: new Map(),
	oredict: new Map(),
	oredict_inv: new Map(),
});

watch(data, (_d) => {
	historyGo(history.value, history.value.index, search);
});

// search
const query = ref("");
const itemResults = ref<Stack[]>([]);
const recipeResults = ref<Recipe[]>([]);
const history = ref<History>({pages: [{query: "", mode: "item"}], index: 0});

const search = (query: string, mode: SearchMode) => {
	historyPush(history.value, {query, mode});
	if (mode == "item") {
		recipeResults.value = [];
		itemResults.value = searchItems(query, data.value);
	} else {
		itemResults.value = [];
		recipeResults.value = searchRecipes(query, mode, data.value);
	}
};

const clearResults = () => {
	itemResults.value = [];
	recipeResults.value = [];
	historyPush(history.value, {query: "", mode: "item"});
};

const status = computed(() => {
	if (recipeResults.value.length > 0) {
		return `found ${recipeResults.value.length} recipes`;
	} else if (itemResults.value.length > 0) {
		return `found ${itemResults.value.length} items`;
	} else if (chartNodes.value.length > 0) {
		return `${chartNodes.value.length} nodes, ${visibleNodes.value.length} visible, ${chartLines.value.length} lines, ${visibleLines.value.length} visible`;
	} else if (data.value.names.size > 0) {
		return `loaded ${data.value.names.size} items, ${data.value.recipes_r.size} recipes`;
	} else {
		return "loading...";
	}
});

const backDisabled = computed(() => history.value.index <= 0 || history.value.pages[history.value.index-1]?.query == '');
const forwardDisabled = computed(() => history.value.index >= history.value.pages.length - 1 || history.value.pages[history.value.index+1]?.query == '');
const closeDisabled = computed(() => itemResults.value.length == 0 && recipeResults.value.length == 0);

// chart
const chartNodes = ref<NodeT[]>([]);
const activeNode = ref<NodeT|undefined>(undefined);
const activeNodeMode = ref<NodeMode|undefined>(undefined);
const chartLines = ref<[Position, Position, number][]>([]);
const chartOffset = ref<Position>({x: 0, y: 0});
const chartZoom = ref<number>(1);

const addToChart = (recipe: Recipe) => {
	clearResults();
	let node: NodeT = {
		recipe: recipe,
		children: [],
		position: {
			x: -chartOffset.value.x,
			y: -chartOffset.value.y,
		},
		uuid: newUuid(),
	};

	if (activeNode.value) {
		if (activeNodeMode.value == "input" && activeNode.value.recipe.outputs.map(r => r.id).find(id => node.recipe.inputs.map(r => r.id).includes(id))) {
			node.children.push(activeNode.value);
			node.position = {
				x: activeNode.value.position.x,
				y: activeNode.value.position.y + getNodeSize(activeNode.value).y + 32,
			};
		} else if (activeNodeMode.value == "output" && node.recipe.outputs.map(r => r.id).find(id => activeNode.value?.recipe.inputs.map(r => r.id).includes(id))) {
			activeNode.value.children.push(node);
			node.position = {
				x: activeNode.value.position.x,
				y: activeNode.value.position.y - (getNodeSize(activeNode.value).y + 32),
			};
		}
	}

	activeNode.value = undefined;
	activeNodeMode.value = undefined;
	chartNodes.value = [...chartNodes.value, node];
	updateLines();
};

const removeFromChart = (node: NodeT) => {
	for (let cnode of chartNodes.value) {
		cnode.children = cnode.children.filter(n => n.uuid != node.uuid);
	}
	chartNodes.value = chartNodes.value.filter(n => n.uuid != node.uuid);
	updateLines();
};

const setActiveNode = (node: NodeT|undefined, mode: NodeMode|undefined) => {
	activeNode.value = node;
	activeNodeMode.value = mode;
};

const updateLines = () => {
	let lines: [Position, Position, number][] = [];
	let seen: Set<number> = new Set();

	for (let node of chartNodes.value) {
		for (let child of node.children) {
			if (seen.has(child.uuid)) continue;
			for (let [i, id] of node.recipe.inputs.map(s => s.id).entries()) {
				let j = child.recipe.outputs.map(s => s.id).indexOf(id);
				if (j != -1) {
					lines.push([getStackPos(node, i, "input"), getStackPos(child, j, "output"), newUuid()]);
				}
			}
			seen.add(child.uuid);
		}
	}
	chartLines.value = lines;
};

const clearChart = () => {
	chartNodes.value = [];
	chartLines.value = [];
};

const scrollZoom = (e: WheelEvent) => {
	if (e.deltaY > 0) {
		chartZoom.value *= 0.9;
	} else {
		chartZoom.value /= 0.9;
	}
};

const chart_div = useTemplateRef("chart_div");
const chartIsVisible = (pos: Position): boolean => {
	let size = Math.max(chart_div.value?.clientWidth ?? 100000, chart_div.value?.clientHeight ?? 100000) * chartZoom.value;
	return len(add(pos, chartOffset.value)) * chartZoom.value < size * 1.2;
};

const visibleNodes = computed(() => {
	return chartNodes.value.filter(node => chartIsVisible(node.position));
});

const visibleLines = computed(() => {
	return chartLines.value.filter(line => chartIsVisible(line[0]) || chartIsVisible(line[1]));
});

// solver
const solve = (node: NodeT) => {
	let nodes = solveTree(node, data.value);
	alignTree(node);
	chartNodes.value = [...chartNodes.value, ...nodes];
	updateLines();
};

const addAndSolve = (recipe: Recipe) => {
	addToChart(recipe);
	let node = chartNodes.value[chartNodes.value.length-1]!;
	solve(node);
};

// provide dependencies
provide(searchKey, search);
provide(addToChartKey, addToChart);
provide(removeFromChartKey, removeFromChart);
provide(setActiveNodeKey, setActiveNode);
provide(updateLinesKey, updateLines);
provide(solveKey, solve);
provide(chartZoomKey, chartZoom);
provide(addAndSolveKey, addAndSolve);
provide(dataKey, data);

// debug
window.addEventListener("keyup", (e) => {
	if (e.key == " " && e.ctrlKey) {
		let recipe = searchRecipes("gregtech:meta_item_1:128", "recipe", data.value)[0]!;
		let node: NodeT = {
			recipe: recipe,
			children: [],
			position: {
				x: -chartOffset.value.x + 400 / chartZoom.value,
				y: -chartOffset.value.y + 600 / chartZoom.value,
			},
			uuid: newUuid(),
		};

		let nodes = solveTree(node, data.value);
		alignTree(node);

		chartNodes.value.push(node, ...nodes);
		updateLines();
	}
});

</script>

<template>
	<nav id="navbar">
		<select v-model="pack" id="packs">
			<option v-for="pack in packs" :value="pack.path">{{ pack.name }}</option>
		</select>
		<span id="status">{{ status }}</span>
		<div class="linebreak"></div>
		<input id="search" placeholder="item search" v-model="query" @keyup.enter="search(query, 'item')" />
		<button id="back" title="back" :disabled="backDisabled" @click="historyBack(history, search)"><Symbol>chevron_left</Symbol></button>
		<button id="forward" title="forward" :disabled="forwardDisabled" @click="historyForward(history, search)"><Symbol>chevron_right</Symbol></button>
		<button id="close" title="close search" :disabled="closeDisabled" @click="clearResults(); setActiveNode(undefined, undefined);"><Symbol>close</Symbol></button>
		<button id="clear" title="clear chart" :disabled="chartNodes.length == 0" @click="clearChart()"><Symbol>delete</Symbol></button>
	</nav>
	<main id="main">
		<div id="results">
			<div v-for="item in itemResults.slice(0, 1000)">
				<ItemResult :item/>
			</div>
			<div v-for="recipe in recipeResults.slice(0, 1000)">
				<RecipeResult :recipe/>
			</div>
		</div>
		<div id="chart" ref="chart_div" @pointerdown.stop="(e) => grabStart(e, chartOffset, chartZoom, undefined)" @wheel="scrollZoom">
			<Node v-for="node in visibleNodes" :key="node.uuid" :class="{active: node.uuid == activeNode?.uuid}" :node/>
			<svg id="chart_bg" xmlns="http://www.w3.org/2000/svg">
				<line v-for="line of visibleLines" :key="line[2]" :x1="line[0].x + 'px'" :y1="line[0].y + 'px'" :x2="line[1].x + 'px'" :y2="line[1].y + 'px'"></line>
			</svg>
		</div>
	</main>
</template>

<style>
#app {
	display: flex;
	flex-direction: column;
	height: 100%;
	margin: 0;
	padding: 1rem;
}

button {
	height: 2.5rem;
	padding: 0.5rem;
	background-color: var(--bg3);
}

button:active {
	background-color: var(--bg4);
}
</style>

<style scoped>
#navbar {
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	flex-shrink: 0;
	gap: 0.25rem 0.5rem;
	margin-bottom: 1rem;

	.linebreak {
		width: 100%;
		height: 0;
	}

	#packs {
		height: 2.5rem;
		width: 20rem;
		max-width: 20rem;
		min-width: 5rem;
		flex: 1 1 5rem;
		padding: 0.5rem;
		font-size: 1rem;
		background-color: var(--bg3);
	}

	#status {
		display: flex;
		align-items: center;
		height: 2.5rem;
		margin-right: auto;
	}

	#search {
		width: 20rem;
		max-width: 20rem;
		min-width: 5rem;
		flex: 1 1 5rem;
		padding: 0.5rem;
		font-size: 1rem;
		background-color: var(--bg3);
	}

	#back {
		margin-left: auto;
	}
}

#main {
	position: relative;
	height: 100%;

	#results {
		position: relative;
		display: flex;
		flex-direction: column;
		max-height: 30rem;
		overflow: auto;
		z-index: 10;
		background-color: var(--bg2);
	}

	#chart {
		position: absolute;
		top: 0;
		right: 0;
		bottom: 0;
		left: 0;
		overflow: hidden;
		zoom: v-bind(chartZoom);

		&>.node {
			transform: translate(v-bind("chartOffset.x + 'px'"), v-bind("chartOffset.y + 'px'"));
		}

		#chart_bg {
			position: absolute;
			top: 0;
			right: 0;
			bottom: 0;
			left: 0;
			height: 100%;
			width: 100%;
			background-color: var(--bg1);

			&>line {
				stroke: var(--fg3);
				stroke-dasharray: 5, 5;
				transform: translate(v-bind("chartOffset.x + 'px'"), v-bind("chartOffset.y + 'px'"));
			}
		}
	}
}
</style>
