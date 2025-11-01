<script setup lang="ts">
import { screenToChartPos, getNodeSize, fastPointOnChart, pointOnChart, alignTree, clampLine, generateLines, getSubTree as getTree } from '@/chart';
import type { Node as NodeT, NodeMode, Position, Recipe, SearchMode, Line } from '@/types';
import { pos, newUuid, mul, sub, cached, len, div, add } from '@/util';
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

const nodes = ref<NodeT[]>([]);
const lines = ref<Line[]>([]);
const offset = ref<Position>({x: 0, y: 0});
const zoom = ref<number>(1);
const activeNode = ref<NodeT|undefined>(undefined);
const activeNodeMode = ref<NodeMode|undefined>(undefined);

const chart_div = useTemplateRef("chart_div");
const chartRect = computed(() => chart_div.value?.getBoundingClientRect());

const visibleNodes = ref(nodes.value);
const visibleLines = ref(lines.value);

// methods
const newNode = (recipe: Recipe): NodeT => {
	let cornerPos = chartRect.value ? screenToChartPos(pos(chartRect.value.left, chartRect.value.bottom), offset.value, zoom.value, chartRect.value) : offset.value;
	let node: NodeT = {
		recipe: recipe,
		inputNodes: [],
		outputNodes: [],
		position: {
			x: cornerPos.x + 60,
			y: cornerPos.y - 200,
		},
		uuid: newUuid(),
	};
	return node;
};

const addNode = (node: NodeT) => {
	if (activeNode.value) {
		if (activeNodeMode.value == "input" && activeNode.value.recipe.outputs.map(r => r.id).find(id => node.recipe.inputs.map(r => r.id).includes(id))) {
			node.inputNodes.push(activeNode.value);
			activeNode.value.outputNodes.push(node);
			node.position = {
				x: activeNode.value.position.x,
				y: activeNode.value.position.y + getNodeSize(activeNode.value).y + 32,
			};
		} else if (activeNodeMode.value == "output" && node.recipe.outputs.map(r => r.id).find(id => activeNode.value?.recipe.inputs.map(r => r.id).includes(id))) {
			activeNode.value.inputNodes.push(node);
			node.outputNodes.push(activeNode.value);
			node.position = {
				x: activeNode.value.position.x,
				y: activeNode.value.position.y - (getNodeSize(activeNode.value).y + 32),
			};
		}
	}

	activeNode.value = undefined;
	activeNodeMode.value = undefined;
	nodes.value = [...nodes.value, node];
};

const deleteNode = (node: NodeT) => {
	for (let connected of [...node.inputNodes, ...node.outputNodes]) {
		connected.inputNodes = connected.inputNodes.filter(n => n.uuid != node.uuid);
		connected.outputNodes = connected.outputNodes.filter(n => n.uuid != node.uuid);
	}
	nodes.value = nodes.value.filter(n => n.uuid != node.uuid);
};

const deleteTree = (node: NodeT) => {
	let tree = getTree(node);
	for (let n of tree) {
		deleteNode(n);
	}
};

const clearChart = () => {
	nodes.value = [];
};

const setActiveNode = (node: NodeT|undefined, mode: NodeMode|undefined) => {
	activeNode.value = node;
	activeNodeMode.value = mode;
};

const scrollZoom = (e: WheelEvent) => {
	let sign = Math.sign(e.deltaY);
	let factor = sign > 0 ? 0.9 : 1/0.9;

	let oldSize = pos(chart_div.value?.clientWidth ?? 0, chart_div.value?.clientHeight ?? 0);
	let newSize = mul(oldSize, factor);
	let cursorPos = screenToChartPos(pos(e.clientX, e.clientY), offset.value, zoom.value, chartRect.value!);
	let cursorOffset = sub(cursorPos, offset.value);
	let scaledOffset = pos(cursorOffset.x / newSize.x, cursorOffset.y / newSize.y);

	offset.value.x += scaledOffset.x * (newSize.x - oldSize.x);
	offset.value.y += scaledOffset.y * (newSize.y - oldSize.y);

	zoom.value *= factor;
};

const followLine = (e: MouseEvent, line: Line) => {
	let mousePos = screenToChartPos(pos(e.clientX, e.clientY), offset.value, zoom.value, chartRect.value!);
	let stackPos = (len(sub(line.p0, mousePos)) > len(sub(line.p1, mousePos))) ? line.p0 : line.p1;

	let chartSize = pos(chart_div.value?.clientWidth ?? 0, chart_div.value?.clientHeight ?? 0);
	let centerOffset = div(chartSize, 2);
	
	offset.value = sub(stackPos, centerOffset);
};

// updates
const updateLines = () => {
	lines.value = generateLines(nodes.value);
};

const updateLinesWatcher = () => {
	let refresh = (nodes.value.length + lines.value.length > 1000) ? 500 : 5;
	cached('updateLines', refresh, updateLines);
};

watch([nodes], updateLinesWatcher);

const updateVisible = () => {
	if (!chartRect.value) return;

	visibleNodes.value = nodes.value.filter(node => fastPointOnChart(node.position, offset.value, zoom.value, chartRect.value!));
	visibleNodes.value = visibleNodes.value.filter(node => pointOnChart(node.position, pos(400, 400), offset.value, zoom.value, chartRect.value!));

	const {x: left, y: top} = screenToChartPos(pos(chartRect.value.left, chartRect.value.top), offset.value, zoom.value, chartRect.value);
	const {x: right, y: bottom} = screenToChartPos(pos(chartRect.value.right, chartRect.value.bottom), offset.value, zoom.value, chartRect.value);
	visibleLines.value = lines.value.map(line => clampLine(line, left - 1000, top - 1000, right + 1000, bottom + 1000)).filter(line => line !== undefined);
};

const updateVisibleWatcher = () => {
	let refresh = (nodes.value.length + lines.value.length > 1000) ? 500 : 5;
	cached('updateVisible', refresh, updateVisible);
};

watch([nodes, lines, offset, zoom, chartRect], updateVisibleWatcher);

// solver
const solve = (node: NodeT) => {
	if (!data) return;
	let tree = solveTree(node, data.value);
	alignTree(node);
	nodes.value = [...nodes.value, ...tree];
};

const addAndSolve = (recipe: Recipe) => {
	let node = newNode(recipe);
	addNode(node);
	solve(node);
};

// expose
defineExpose({
	nodes,
	lines,
	visibleNodes,
	visibleLines,
	setActiveNode,
	clearChart,
	addToChart: addNode,
	addAndSolve,
});

// debug
window.addEventListener("keyup", (e) => {
	if (!data) return;
	if (e.key == " " && e.ctrlKey) {
		let recipe = searchRecipes("gregtech:meta_item_1:128", "recipe", data.value)[0];
		if (recipe) addAndSolve(recipe);
	}
});

</script>

<template>
	<div id="chart" ref="chart_div" @pointerdown.left.stop="(e) => grab(e, [offset], zoom, updateVisibleWatcher, true)" @wheel="scrollZoom">
		<Node v-for="node in visibleNodes" :key="node.uuid" :class="{active: node.uuid == activeNode?.uuid}" :node
			@search="(id, mode) => $emit('search', id, mode)"
			@setActive="setActiveNode"
			@move="(e, node) => grab(e, [node.position], zoom, updateLinesWatcher)"
			@delete="deleteNode"
			@solve="solve"
			@moveTree="(e, node) => grab(e, [node.position, ...getTree(node).map(n => n.position)], zoom, updateLinesWatcher)"
			@deleteTree="deleteTree"
			@alignTree="(node) => {alignTree(node); updateLinesWatcher()}"
		/>
		<svg id="chart_bg" xmlns="http://www.w3.org/2000/svg">
			<line class="line" v-for="line of visibleLines" :key="line.uuid" :x1="line.c0.x + 'px'" :y1="line.c0.y + 'px'" :x2="line.c1.x + 'px'" :y2="line.c1.y + 'px'"></line>
			<line class="clickLine" v-for="line of visibleLines" :key="line.uuid" :x1="line.c0.x + 'px'" :y1="line.c0.y + 'px'" :x2="line.c1.x + 'px'" :y2="line.c1.y + 'px'" @click="followLine($event, line)"></line>
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
	zoom: v-bind(zoom);

	&>.node {
		transform: translate(v-bind("-offset.x + 'px'"), v-bind("-offset.y + 'px'"));
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

		&>.line {
			stroke: var(--fg3);
			stroke-dasharray: v-bind("visibleLines.length > 100 ? 'none' : '5, 5'"); /* drawing this is pretty expensive for some reason */
			transform: translate(v-bind("-offset.x + 'px'"), v-bind("-offset.y + 'px'"));
		}

		&>.clickLine {
			stroke: var(--fg3);
			stroke-opacity: 0.3;
			stroke-width: 0.5rem;
			transform: translate(v-bind("-offset.x + 'px'"), v-bind("-offset.y + 'px'"));
			visibility: hidden;
			cursor: pointer;
			pointer-events: all;

			&:hover {
				visibility: visible;				
			}
		}
	}
}
</style>
