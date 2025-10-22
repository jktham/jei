<script setup lang="ts">
import type { Node, Recipe, SearchMode } from '@/types';
import Symbol from './Symbol.vue';
import Stack from './Stack.vue';

const { recipe, search, addToChart } = defineProps<{ recipe: Recipe, search: (query: string, mode: SearchMode) => void, addToChart: (recipe: Recipe) => void }>();
</script>

<template>
<div class="recipe">
	<Stack :stack="recipe.machines[0] ?? recipe.process" :search></Stack>
	<div class="stacks inputs">
		<Stack v-for="stack in recipe.inputs" :stack :search></Stack>
	</div>
	<div class="arrow" :title="recipe.process.id"><Symbol>arrow_forward</Symbol></div>
	<div class="stacks outputs">
		<Stack v-for="stack in recipe.outputs" :stack :search></Stack>
	</div>
	<button class="add" @click="addToChart(recipe)"><Symbol>add</Symbol></button>
</div>
</template>

<style scoped>
.recipe {
	display: flex;
	align-items: center;
	gap: 1rem;
	padding: 0.5rem;
}

.stacks {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	min-height: 32px;
	min-width: 32px;
	overflow: auto;
}

.add {
	margin-left: auto;
}
</style>
