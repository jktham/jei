<script setup lang="ts">
import { getPacks, loadPack } from '@/app';
import { searchItems, searchRecipes } from '@/search';
import { computedAsync } from '@vueuse/core';
import { watch, ref, computed } from 'vue';
import ItemResult from './ItemResult.vue';
import type { Recipe, Stack, SearchMode, History, Node as NodeT } from '@/types';
import RecipeResult from './RecipeResult.vue';
import Symbol from './Symbol.vue';
import { historyBack, historyForward, historyPush, historyGo } from '@/history';
import Node from './Node.vue';

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
		return `loaded ${data.value.names.size} items, ${data.value.recipes_r.size + data.value.recipes_u.size} recipes`;
	} else {
		return "loading...";
	}
});

const backDisabled = computed(() => history.value.index <= 0 || history.value.pages[history.value.index-1]?.query == '');
const forwardDisabled = computed(() => history.value.index >= history.value.pages.length - 1 || history.value.pages[history.value.index+1]?.query == '');
const closeDisabled = computed(() => itemResults.value.length == 0 && recipeResults.value.length == 0);

const chartNodes = ref<NodeT[]>([]);

const addToChart = (node: NodeT) => {
	if (node.x == -1) node.x = Math.random() * 400;
	if (node.y == -1) node.y = Math.random() * 400;

	chartNodes.value.push(node);
	clearResults();
};

const removeFromChart = (node: NodeT) => {
	chartNodes.value = chartNodes.value.filter(n => n != node); // compares reference
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
				<ItemResult :item="result" :data :search/>
			</div>
			<div v-for="result in recipeResults.slice(0, 1000)">
				<RecipeResult :recipe="result" :data :search :addToChart/>
			</div>
		</div>
		<div id="chart">
			<Node v-for="node in chartNodes" :node :search :removeFromChart/>
		</div>
		<svg id="chart_svg"></svg>
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
