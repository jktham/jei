<script setup lang="ts">
import type { Recipe } from '@/types';
import Symbol from './Symbol.vue';
import Stack from './Stack.vue';
import { inject } from 'vue';
import { addAndSolveKey, addToChartKey } from '@/keys';

const { recipe } = defineProps<{ recipe: Recipe }>();
const addToChart = inject(addToChartKey, () => {});
const addAndSolve = inject(addAndSolveKey, () => {});

</script>

<template>
<div class="recipe">
	<Stack :stack="recipe.machines[0] ?? recipe.process"></Stack>
	<div class="stacks inputs" v-if="recipe.inputs.length > 0">
		<Stack v-for="stack in recipe.inputs" :stack></Stack>
	</div>
	<div class="arrow" :title="recipe.process.id"><Symbol>arrow_forward</Symbol></div>
	<div class="stacks outputs">
		<Stack v-for="stack in recipe.outputs" :stack></Stack>
	</div>
	<button id="add" title="add node" @click="addToChart(recipe)"><Symbol>add</Symbol></button>
	<button id="solve" title="add node and solve" @click="addAndSolve(recipe)"><Symbol class="flip">graph_2</Symbol></button>
</div>
</template>

<style scoped>
.recipe {
	display: flex;
	align-items: center;
	gap: 1rem;
	padding: 0.5rem;

	.stacks {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		min-height: 32px;
		min-width: 32px;
		overflow: auto;
	}

	#add {
		margin-left: auto;
		margin-right: -0.5rem;
	}
}
</style>
