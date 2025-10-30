<script setup lang="ts">
import type { Node, NodeMode, Position, SearchMode } from '@/types';
import Symbol from './Symbol.vue';
import Stack from './Stack.vue';

const { node } = defineProps<{
	node: Node,
}>();

const emit = defineEmits<{
	(e: 'search', id: string, mode: SearchMode): void,
	(e: 'setActive', node: Node, mode: NodeMode): void,
	(e: 'move', event: PointerEvent, position: Position): void,
	(e: 'delete', node: Node): void,
	(e: 'solve', node: Node): void,
}>();

</script>

<template>
<div class="node" :style="{left: node.position.x + 'px', top: node.position.y + 'px'}">
	<div class="bar">
		<button class="move" @pointerdown.left.stop="(e) => $emit('move', e, node.position)" title="move"><Symbol>menu</Symbol></button>
		<button class="delete" @click="$emit('delete', node)" title="delete"><Symbol>close</Symbol></button>
		<button class="solve" @click="$emit('solve', node)" title="solve"><Symbol class="flip">graph_2</Symbol></button>
	</div>
	<div class="content">
		<div class="stacks inputs">
			<Stack v-for="stack in node.recipe.inputs" :stack @click="$emit('setActive', node, 'output')" @search="(id, mode) => $emit('search', id, mode)"></Stack>
		</div>
		<Stack :stack="node.recipe.machines[0] ?? node.recipe.process" @search="(id, mode) => $emit('search', id, mode)"></Stack>
		<div class="stacks outputs">
			<Stack v-for="stack in node.recipe.outputs" :stack @contextmenu.prevent="$emit('setActive', node, 'input')" @search="(id, mode) => $emit('search', id, mode)"></Stack>
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
