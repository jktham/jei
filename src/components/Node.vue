<script setup lang="ts">
import type { Node, Position } from '@/types';
import Symbol from './Symbol.vue';
import Stack from './Stack.vue';
import { grabStart } from '@/chart';
import { inject, ref } from 'vue';
import { chartZoomKey, removeFromChartKey, setActiveNodeKey, solveKey, updateLinesKey } from '@/keys';

const { node, chartOffset } = defineProps<{ node: Node, chartOffset: Position }>();
const removeFromChart = inject(removeFromChartKey, () => {});
const setActiveNode = inject(setActiveNodeKey, () => {});
const updateLines = inject(updateLinesKey, () => {});
const solve = inject(solveKey, () => {});
const chartZoom = inject(chartZoomKey, ref(1));

</script>

<template>
<div ref="node_div" class="node" :style="{left: node.position.x + chartOffset.x + 'px', top: node.position.y + chartOffset.y + 'px'}">
	<div class="bar">
		<button class="move" @pointerdown.stop="(e) => grabStart(e, node.position, chartZoom, updateLines)" title="move"><Symbol>menu</Symbol></button>
		<button class="delete" @click="removeFromChart(node)" title="delete"><Symbol>close</Symbol></button>
		<button class="solve" @click="solve(node)" title="solve"><Symbol class="flip">graph_2</Symbol></button>
	</div>
	<div class="content">
		<div class="stacks inputs">
			<Stack v-for="stack in node.recipe.inputs" :stack @click="setActiveNode(node, 'output')"></Stack>
		</div>
		<Stack :stack="node.recipe.machines[0] ?? node.recipe.process"></Stack>
		<div class="stacks outputs">
			<Stack v-for="stack in node.recipe.outputs" :stack @contextmenu.prevent="setActiveNode(node, 'input')"></Stack>
		</div>
	</div>
</div>
</template>

<style scoped>
.node {
	position: absolute;
	display: flex;
	user-select: none;
	gap: 0.5rem;
	padding: 0.5rem;
	z-index: 2;

	&.active {
		outline: solid 1px var(--fg2);
	}

	.bar {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;

		button {
			background-color: var(--bg3);
			color: var(--fg2);
			display: flex;
			align-items: center;
			justify-content: center;
			padding: 0.5rem;
			height: 2rem;
			width: 2rem;

			&:active {
				background-color: var(--bg4);
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
			gap: 0.5rem;
			min-height: 32px;
		}
	}
}
</style>
