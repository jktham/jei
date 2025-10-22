<script setup lang="ts">
import { getPacks, loadPack } from '@/app';
import { searchItems, searchRecipes } from '@/search';
import { computedAsync } from '@vueuse/core';
import { watch, ref, computed, type ShallowRef, useTemplateRef } from 'vue';
import ItemResult from './ItemResult.vue';
import type { Recipe, Stack, SearchMode, History, Node as NodeT, NodeMode, Position } from '@/types';
import RecipeResult from './RecipeResult.vue';
import Symbol from './Symbol.vue';
import { historyBack, historyForward, historyPush, historyGo } from '@/history';
import Node from './Node.vue';
import { newUuid } from '@/util';
import { solveTree } from '@/solver';

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
	} else if (data.value.names.size > 0) {
		return `loaded ${data.value.names.size} items, ${data.value.recipes_r.size} recipes`;
	} else {
		return "loading...";
	}
});

const backDisabled = computed(() => history.value.index <= 0 || history.value.pages[history.value.index-1]?.query == '');
const forwardDisabled = computed(() => history.value.index >= history.value.pages.length - 1 || history.value.pages[history.value.index+1]?.query == '');
const closeDisabled = computed(() => itemResults.value.length == 0 && recipeResults.value.length == 0);

const chartNodes = ref<NodeT[]>([]);
const activeNode = ref<NodeT|undefined>(undefined);
const activeNodeMode = ref<NodeMode|undefined>(undefined);

const addToChart = (recipe: Recipe) => {
	clearResults();
	let node: NodeT = {
		recipe: recipe,
		children: [],
		position: {
			x: 0,
			y: 0,
		},
		uuid: newUuid(),
	};

	if (activeNode.value) {
		if (activeNodeMode.value == "input" && activeNode.value.recipe.outputs.map(r => r.id).find(id => node.recipe.inputs.map(r => r.id).includes(id))) {
			node.children.push(activeNode.value);
			node.position = {
				x: activeNode.value.position.x,
				y: activeNode.value.position.y + 150,
			};
		} else if (activeNodeMode.value == "output" && node.recipe.outputs.map(r => r.id).find(id => activeNode.value?.recipe.inputs.map(r => r.id).includes(id))) {
			activeNode.value.children.push(node);
			node.position = {
				x: activeNode.value.position.x,
				y: activeNode.value.position.y - 150,
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

const chartLines = ref<[Position, Position][]>([]);

const updateLines = () => {
	let lines: [Position, Position][] = [];
	for (let node of chartNodes.value) {
		for (let child of node.children) {
			for (let [i, id] of node.recipe.inputs.map(s => s.id).entries()) {
				let j = child.recipe.outputs.map(s => s.id).indexOf(id);
				if (j != -1) {
					lines.push([{
						x: node.position.x + 64 + i * 40,
						y: node.position.y + 24,
					}, {
						x: child.position.x + 64 + j * 40,
						y: child.position.y + 104,
					}]);
				}
			}
		}
	}
	chartLines.value = lines;
};

const solve = (node: NodeT) => {
	let nodes = solveTree(node, data.value);
	chartNodes.value = [...chartNodes.value, ...nodes];
	updateLines();
};

const chartOffset = ref<Position>({x: 0, y: 0});

const grabStart = (e: PointerEvent) => {
	let initialPos: Position = {
		x: e.clientX - chartOffset.value.x, 
		y: e.clientY - chartOffset.value.y,
	};
	
	function move(e: MouseEvent) {
		chartOffset.value.x = e.clientX - initialPos.x;
		chartOffset.value.y = e.clientY - initialPos.y;

		updateLines();
	}

	function reset() {
		window.removeEventListener("pointermove", move);
		window.removeEventListener("pointerup", reset);
	}

	window.addEventListener("pointermove", move);
	window.addEventListener("pointerup", reset);
};

</script>

<template>
	<nav id="navbar">
		<select v-model="pack" id="packs">
			<option v-for="pack in packs" :value="pack.path">{{ pack.name }}</option>
		</select>
		<span id="status">{{ status }}</span>
		<div class="linebreak"></div>
		<input id="search" placeholder="item search" v-model="query" @keyup.enter="search(query, 'item')" />
		<button id="back" :disabled="backDisabled" @click="historyBack(history, search)"><Symbol>chevron_left</Symbol></button>
		<button id="forward" :disabled="forwardDisabled" @click="historyForward(history, search)"><Symbol>chevron_right</Symbol></button>
		<button id="close" :disabled="closeDisabled" @click="clearResults"><Symbol>close</Symbol></button>
	</nav>
	<main id="main">
		<div id="results">
			<div v-for="result in itemResults.slice(0, 1000)">
				<ItemResult :item="result" :search/>
			</div>
			<div v-for="result in recipeResults.slice(0, 1000)">
				<RecipeResult :recipe="result" :search :addToChart/>
			</div>
		</div>
		<div id="chart">
			<Node v-for="node in chartNodes" :key="node.uuid" :class="{outline: node.uuid == activeNode?.uuid}" :node :search :removeFromChart :setActiveNode :updateLines :solve :chartOffset/>
		</div>
		<svg id="chart_svg" xmlns="http://www.w3.org/2000/svg" @pointerdown="grabStart">
			<line v-for="line of chartLines" stroke="white" stroke-dasharray="5,5" :x1="line[0].x + chartOffset.x + 'px'" :y1="line[0].y + chartOffset.y + 'px'" :x2="line[1].x + chartOffset.x + 'px'" :y2="line[1].y + chartOffset.y + 'px'"></line>
		</svg>
	</main>
</template>

<style>
#app {
	margin: 0;
	padding: 1rem;
	height: calc(100dvh - 2rem);
	display: flex;
	flex-direction: column;
}
</style>

<style>
#navbar {
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	flex-shrink: 0;
	gap: 0.25rem 0.5rem;
	margin-bottom: 1rem;
}

#search {
	background-color: #202020;
	width: 20rem;
	max-width: 20rem;
	min-width: 5rem;
	flex: 1 1 5rem;
	padding: 0.5rem;
	font-size: 1rem;
}

#packs {
	box-sizing: content-box;
	border: none;
	outline: none;
	background-color: #202020;
	width: 20rem;
	max-width: 20rem;
	min-width: 5rem;
	flex: 1 1 5rem;
	padding: 0.5rem;
	font-size: 1rem;
	height: 1.5rem;
}

#status {
	margin-right: auto;
}

#navbar .linebreak {
	width: 100%;
	height: 0;
}

button {
	box-sizing: content-box;
	border: none;
	outline: none;
	background-color: #202020;
	padding: 0.5rem;
	font-size: 1rem;
	height: 1.5rem;
}

button:active {
	background-color: #303030;
}

#back {
	margin-left: auto;
}

#main {
	position: relative;
	height: 100%;
}

#results {
	display: flex;
	position: relative;
	flex-direction: column;
	max-height: 20rem;
	overflow: auto;
	z-index: 10;
	background-color: #101010;
}

#chart {
	position: absolute;
	top: 0;
	right: 0;
	bottom: 0;
	left: 0;
	background-color: #080808;
	overflow: hidden;
}

.node.outline {
	outline: solid 1px white;
}

#chart_svg {
	position: absolute;
	top: 0;
	right: 0;
	bottom: 0;
	left: 0;
	z-index: 1;
	height: 100%;
	width: 100%;
}
</style>
