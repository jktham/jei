<script setup lang="ts">
import { screenToChartPos, getNodeSize, getStackPos, cheapOnChart, pointOnChart, lineOnChart, alignTree } from '@/chart';
import type { Node as NodeT, NodeMode, Position, Recipe, SearchMode } from '@/types';
import { pos, newUuid, mul, sub } from '@/util';
import { ref, useTemplateRef, computed, watch, inject } from 'vue';
import { grab } from '@/chart';
import { dataKey } from '@/keys';
import Node from './Node.vue';
import { solveTree } from '@/solver';
import { searchRecipes } from '@/search';

const emit = defineEmits<{
	(e: 'search', id: string, mode: SearchMode): void,
}>();

const data = inject(dataKey);

const chartNodes = ref<NodeT[]>([]);
const activeNode = ref<NodeT|undefined>(undefined);
const activeNodeMode = ref<NodeMode|undefined>(undefined);
const chartLines = ref<[Position, Position, number][]>([]);
const chartOffset = ref<Position>({x: 0, y: 0});
const chartZoom = ref<number>(1);

const addToChart = (recipe: Recipe) => {
	let cornerPos = chartRect.value ? screenToChartPos(pos(chartRect.value.left, chartRect.value.bottom), chartOffset.value, chartZoom.value, chartRect.value) : chartOffset.value;
	let node: NodeT = {
		recipe: recipe,
		children: [],
		position: {
			x: cornerPos.x + 60,
			y: cornerPos.y - 200,
		},
		uuid: newUuid(),
	};

	if (activeNode.value) {
		if (activeNodeMode.value == "input" && activeNode.value.recipe.outputs.map(r => r.id).find(id => node.recipe.inputs.map(r => r.id).includes(id))) {
			node.children.push(activeNode.value);
			node.position = {
				x: activeNode.value.position.x,
				y: activeNode.value.position.y + getNodeSize(activeNode.value).y + 32,
			};
		} else if (activeNodeMode.value == "output" && node.recipe.outputs.map(r => r.id).find(id => activeNode.value?.recipe.inputs.map(r => r.id).includes(id))) {
			activeNode.value.children.push(node);
			node.position = {
				x: activeNode.value.position.x,
				y: activeNode.value.position.y - (getNodeSize(activeNode.value).y + 32),
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

const clearChart = () => {
	chartNodes.value = [];
	updateLines();
};

const setActiveNode = (node: NodeT|undefined, mode: NodeMode|undefined) => {
	activeNode.value = node;
	activeNodeMode.value = mode;
};

const updateLines = () => {
	let lines: [Position, Position, number][] = [];
	let seen: Set<number> = new Set();

	for (let node of chartNodes.value) {
		for (let child of node.children) {
			if (seen.has(child.uuid)) continue;
			for (let [i, id] of node.recipe.inputs.map(s => s.id).entries()) {
				let j = child.recipe.outputs.map(s => s.id).indexOf(id);
				if (j != -1) {
					lines.push([getStackPos(node, i, "input"), getStackPos(child, j, "output"), newUuid()]);
				}
			}
			seen.add(child.uuid);
		}
	}
	chartLines.value = lines;
};

const scrollZoom = (e: WheelEvent) => {
	let sign = Math.sign(e.deltaY);
	let factor = sign > 0 ? 0.9 : 1/0.9;

	let oldSize = pos(chart_div.value?.clientWidth ?? 0, chart_div.value?.clientHeight ?? 0);
	let newSize = mul(oldSize, factor);
	let cursorPos = screenToChartPos(pos(e.clientX, e.clientY), chartOffset.value, chartZoom.value, chartRect.value!);
	let cursorOffset = sub(cursorPos, chartOffset.value);
	let scaledOffset = pos(cursorOffset.x / newSize.x, cursorOffset.y / newSize.y);

	chartOffset.value.x += scaledOffset.x * (newSize.x - oldSize.x);
	chartOffset.value.y += scaledOffset.y * (newSize.y - oldSize.y);

	chartZoom.value *= factor;
};

const chart_div = useTemplateRef("chart_div");
const chartRect = computed(() => chart_div.value?.getBoundingClientRect());

const visibleNodes = ref(chartNodes.value);
const visibleLines = ref(chartLines.value);

const updateVisible = () => {
	if (!chart_div.value) return;

	visibleNodes.value = chartNodes.value.filter(node => cheapOnChart(node.position, chartOffset.value, chartZoom.value, chartRect.value!));
	visibleLines.value = chartLines.value.filter(line => cheapOnChart(line[0], chartOffset.value, chartZoom.value, chartRect.value!) || cheapOnChart(line[1], chartOffset.value, chartZoom.value, chartRect.value!));

	visibleNodes.value = visibleNodes.value.filter(node => pointOnChart(node.position, pos(400, 400), chartOffset.value, chartZoom.value, chartRect.value!))
	visibleLines.value = visibleLines.value.filter(line => lineOnChart(line[0], line[1], pos(400, 400), chartOffset.value, chartZoom.value, chartRect.value!))
};

watch([chartNodes, chartLines, chartOffset, chartZoom, chartRect], () => {
	updateVisible();
});

// solver
const solve = (node: NodeT) => {
	if (!data) return;
	let tree = solveTree(node, data.value);
	alignTree(node);
	chartNodes.value = [...chartNodes.value, ...tree];
	updateLines();
};

const addAndSolve = (recipe: Recipe) => {
	addToChart(recipe);
	let node = chartNodes.value[chartNodes.value.length-1]!;
	solve(node);
};

// expose

defineExpose({
	chartNodes,
	setActiveNode,
	clearChart,
	addToChart,
	addAndSolve,
});

// debug
window.addEventListener("keyup", (e) => {
	if (!data) return;
	if (e.key == " " && e.ctrlKey) {
		let recipe = searchRecipes("gregtech:meta_item_1:128", "recipe", data.value)[0]!;
		let cornerPos = chartRect.value ? screenToChartPos(pos(chartRect.value.left, chartRect.value.bottom), chartOffset.value, chartZoom.value, chartRect.value) : chartOffset.value;
		let node: NodeT = {
			recipe: recipe,
			children: [],
			position: {
				x: cornerPos.x + 60,
				y: cornerPos.y - 200,
			},
			uuid: newUuid(),
		};

		let tree = solveTree(node, data.value);
		alignTree(node);

		chartNodes.value.push(node, ...tree);
		updateLines();
	}
});

</script>

<template>
	<div id="chart" ref="chart_div" @pointerdown.left.stop="(e) => grab(e, chartOffset, chartZoom, updateVisible, true)" @wheel="scrollZoom">
		<Node v-for="node in chartNodes" :key="node.uuid" :class="{active: node.uuid == activeNode?.uuid}" :node
			@search="(id, mode) => $emit('search', id, mode)"
			@setActive="setActiveNode"
			@move="(e, pos) => grab(e, pos, chartZoom, updateLines)"
			@delete="removeFromChart"
			@solve="solve"
		/>
		<svg id="chart_bg" xmlns="http://www.w3.org/2000/svg">
			<line v-for="line of visibleLines" :key="line[2]" :x1="line[0].x + 'px'" :y1="line[0].y + 'px'" :x2="line[1].x + 'px'" :y2="line[1].y + 'px'"></line>
		</svg>
	</div>
</template>

<style scoped>
#chart {
	position: absolute;
	top: 0;
	right: 0;
	bottom: 0;
	left: 0;
	overflow: hidden;
	zoom: v-bind(chartZoom);

	&>.node {
		transform: translate(v-bind("-chartOffset.x + 'px'"), v-bind("-chartOffset.y + 'px'"));
	}

	#chart_bg {
		position: absolute;
		top: 0;
		right: 0;
		bottom: 0;
		left: 0;
		height: 100%;
		width: 100%;
		background-color: var(--bg1);

		&>line {
			stroke: var(--fg3);
			stroke-dasharray: v-bind("chartZoom <= 0.3 ? 'none' : '5, 5'");
			transform: translate(v-bind("-chartOffset.x + 'px'"), v-bind("-chartOffset.y + 'px'"));
		}
	}
}
</style>
