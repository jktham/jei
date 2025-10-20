<script setup lang="ts">
import { getPacks, loadPack } from '@/app';
import { searchItems, searchRecipes } from '@/search';
import { computedAsync } from '@vueuse/core';
import { watch, ref, computed } from 'vue';
import ItemResult from './ItemResult.vue';
import type { Recipe, Stack, SearchMode } from '@/types';
import RecipeResult from './RecipeResult.vue';
import Symbol from './Symbol.vue';

const packs = await getPacks();
const pack = ref(localStorage.getItem("pack") ?? packs[0]?.path ?? "");
watch(pack, (p) => { localStorage.setItem("pack", p) });

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

const query = ref("");
const itemResults = ref<Stack[]>([]);
const recipeResults = ref<Recipe[]>([]);

const searchItem = (query: string) => {
	recipeResults.value = [];
	itemResults.value = searchItems(query, data.value);
};

const searchRecipe = (id: string, mode: SearchMode) => {
	itemResults.value = [];
	recipeResults.value = searchRecipes(id, mode, data.value);
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

</script>

<template>
	<nav id="navbar">
		<select v-model="pack" id="packs">
			<option v-for="pack in packs" :value="pack.path">{{ pack.name }}</option>
		</select>
		<span id="status">{{ status }}</span>
		<div class="linebreak"></div>
		<input id="search" placeholder="item search" v-model="query" @keyup.enter="searchItem(query)" />
		<button id="back" disabled><Symbol>chevron_left</Symbol></button>
		<button id="forward" disabled><Symbol>chevron_right</Symbol></button>
		<button id="close" disabled><Symbol>close</Symbol></button>
	</nav>
	<main id="main">
		<div id="results">
			<div v-for="result in itemResults.slice(0, 100)">
				<ItemResult :item="result" :data :searchRecipe/>
			</div>
			<div v-for="result in recipeResults.slice(0, 100)">
				<RecipeResult :recipe="result" :data :searchRecipe/>
			</div>
		</div>
		<div id="chart"></div>
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

#close {
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

	.node {
		position: absolute;
		display: flex;
		flex-direction: row;
		user-select: none;
		gap: 0.5rem;
		padding: 0.5rem;
		z-index: 2;

		.bar {
			display: flex;
			flex-direction: column;
			gap: 0.5rem;

			.move, .delete {
				background-color: #202020;
				color: #dddddd;
				display: flex;
				align-items: center;
				justify-content: center;
				padding: 0.5rem;
				height: 1rem;
				width: 1rem;
				font-weight: 200;

				&:active {
					background-color: #303030;
				}
			}

			.move {
				cursor: grab;
				&:active {
					cursor: grabbing;
				}
			}
		}

		.content {
			display: flex;
			flex-direction: column;
			gap: 0.5rem;
			max-width: 40rem;

			.stacks {
				display: flex;
				flex-wrap: nowrap;
			}
		}
	}
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
