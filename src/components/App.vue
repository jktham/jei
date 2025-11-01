<script setup lang="ts">
import { getPacks, loadPack } from '@/data';
import { searchItems, searchRecipes } from '@/search';
import { computedAsync } from '@vueuse/core';
import { watch, ref, computed, provide, useTemplateRef } from 'vue';
import ItemResult from './ItemResult.vue';
import type { Recipe, Stack, SearchMode, History } from '@/types';
import RecipeResult from './RecipeResult.vue';
import Symbol from './Symbol.vue';
import { historyBack, historyForward, historyPush, historyGo } from '@/history';
import { dataKey } from '@/keys';
import Chart from './Chart.vue';

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
	} else if (chart.value?.nodes && chart.value.nodes.length > 0) {
		return `${chart.value.nodes.length} nodes, ${chart.value.visibleNodes.length} visible, ${chart.value.lines.length} lines, ${chart.value.visibleLines.length} visible`;
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
const chart = useTemplateRef("chart");

// provide dependencies
provide(dataKey, data);

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
		<button id="close" title="close search" :disabled="closeDisabled" @click="clearResults(); chart?.setActiveNode(undefined, undefined)"><Symbol>close</Symbol></button>
		<button id="clear" title="clear chart" :disabled="chart?.nodes.length == 0" @click="chart?.clearChart()"><Symbol>delete</Symbol></button>
	</nav>
	<main id="main">
		<div id="results">
			<div v-for="item in itemResults.slice(0, 1000)">
				<ItemResult :item @search="search"/>
			</div>
			<div v-for="recipe in recipeResults.slice(0, 1000)">
				<RecipeResult :recipe @search="search" @add="chart?.addNode(chart?.newNode($event)!); clearResults()" @solve="chart?.addAndSolveNode(chart?.newNode($event)!); clearResults()"/>
			</div>
		</div>
		<Chart ref="chart" @search="search"></Chart>
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
}
</style>
