<script setup lang="ts">
import type { Node, NodeMode, Position, SearchMode } from '@/types';
import Symbol from './Symbol.vue';
import Stack from './Stack.vue';
import { onMounted, ref, useTemplateRef, type ShallowRef } from 'vue';

const { node, search, removeFromChart, setActiveNode, updateLines, solve, chartOffset } = defineProps<{ node: Node, search: (query: string, mode: SearchMode) => void, removeFromChart: (node: Node) => void, setActiveNode: (node: Node|undefined, mode: NodeMode|undefined) => void, updateLines: () => void, solve: (node: Node) => void, chartOffset: Position }>();

const node_div = useTemplateRef("node_div") as Readonly<ShallowRef<HTMLDivElement|null>>;

const grabStart = (e: PointerEvent) => {
	let initialPos: Position = {
		x: e.clientX - node.position.x, 
		y: e.clientY - node.position.y,
	};
	
	function move(e: MouseEvent) {
		node.position.x = e.clientX - initialPos.x;
		node.position.y = e.clientY - initialPos.y;

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
<div ref="node_div" class="node" :style="{left: node.position.x + chartOffset.x + 'px', top: node.position.y + chartOffset.y + 'px'}">
	<div class="bar">
		<button class="move" @pointerdown="(e) => grabStart(e)"><Symbol>menu</Symbol></button>
		<button class="delete" @click="removeFromChart(node)"><Symbol>close</Symbol></button>
		<button class="solve" @click="solve(node)"><Symbol>graph_2</Symbol></button>
	</div>
	<div class="content">
		<div class="stacks inputs">
			<Stack v-for="stack in node.recipe.inputs" :stack :search @click="setActiveNode(node, 'output')"></Stack>
		</div>
		<Stack :stack="node.recipe.machines[0] ?? node.recipe.process" :search></Stack>
		<div class="stacks outputs">
			<Stack v-for="stack in node.recipe.outputs" :stack :search @contextmenu.prevent="setActiveNode(node, 'input')"></Stack>
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
