<script setup lang="ts">
import type { Node, NodeMode, SearchMode } from '@/types';
import Symbol from './Symbol.vue';
import Stack from './Stack.vue';
import { onMounted, ref, useTemplateRef, type ShallowRef } from 'vue';
import { useParentElement } from '@vueuse/core';
import { solveTree } from '@/solver';

const { node, search, removeFromChart, setActiveNode, updateLines, solve } = defineProps<{ node: Node, search: (query: string, mode: SearchMode) => void, removeFromChart: (node: Node) => void, setActiveNode: (node: Node|undefined, mode: NodeMode|undefined) => void, updateLines: () => void, solve: (node: Node) => void }>();

const node_div = useTemplateRef("node_div") as Readonly<ShallowRef<HTMLDivElement|null>>;
const chart_div = useParentElement(node_div) as Readonly<ShallowRef<HTMLDivElement|null>>;

const grabStart = (e: PointerEvent) => {
	if (!node_div.value || !chart_div.value) return;

	let offsetX = e.clientX - parseInt(window.getComputedStyle(node_div.value).left)
	let offsetY = e.clientY - parseInt(window.getComputedStyle(node_div.value).top);
	
	function move(e: MouseEvent) {
		if (!node_div.value || !chart_div.value) return;

		let chart_rect = chart_div.value.getBoundingClientRect();
		let node_rect = node_div.value.getBoundingClientRect();
		node.position.x = Math.min(Math.max(e.clientX - offsetX, 0), chart_rect.width - node_rect.width);
		node.position.y = Math.min(Math.max(e.clientY - offsetY, 0), chart_rect.height - node_rect.height);

		updateLines();
	}

	function reset() {
		window.removeEventListener("pointermove", move);
		window.removeEventListener("pointerup", reset);
	}

	window.addEventListener("pointermove", move);
	window.addEventListener("pointerup", reset);
};

const inputRefs = useTemplateRef("inputs");
const outputRefs = useTemplateRef("outputs");

onMounted(() => {
	let inputDivs = inputRefs.value?.map(r => r?.stackRef ?? undefined) ?? [];
	for (let [i, stack] of node.recipe.inputs.entries()) {
		if (inputDivs[i]) node.inputs.set(stack.id, inputDivs[i]);
	}
	let outputDivs = outputRefs.value?.map(r => r?.stackRef ?? undefined) ?? [];
	for (let [i, stack] of node.recipe.outputs.entries()) {
		if (outputDivs[i]) node.outputs.set(stack.id, outputDivs[i]);
	}

	updateLines();
});



</script>

<template>
<div ref="node_div" class="node" :style="{left: node.position.x + 'px', top: node.position.y + 'px'}">
	<div class="bar">
		<button class="move" @pointerdown="(e) => grabStart(e)"><Symbol>menu</Symbol></button>
		<button class="delete" @click="removeFromChart(node)"><Symbol>close</Symbol></button>
		<button class="solve" @click="solve(node)"><Symbol>graph_2</Symbol></button>
	</div>
	<div class="content">
		<div class="stacks inputs">
			<Stack v-for="stack in node.recipe.inputs" ref="inputs" :stack :search @click="setActiveNode(node, 'output')"></Stack>
		</div>
		<Stack :stack="node.recipe.machines[0] ?? node.recipe.process" :search></Stack>
		<div class="stacks outputs">
			<Stack v-for="stack in node.recipe.outputs" ref="outputs" :stack :search @contextmenu.prevent="setActiveNode(node, 'input')"></Stack>
		</div>
	</div>
</div>
</template>

<style scoped>
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

		.move, .delete, .solve {
			background-color: #202020;
			color: #dddddd;
			display: flex;
			align-items: center;
			justify-content: center;
			padding: 0.5rem;
			height: 1rem;
			width: 1rem;
			font-weight: 200;
			cursor: grab;

			&:active {
				background-color: #303030;
			}
		}

		.move {
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
