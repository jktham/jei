<script setup lang="ts">
import { screenToChartPos, getNodeSize, getStackPos, cheapOnChart, pointOnChart, alignTree, clampLine } from '@/chart';
import type { Node as NodeT, NodeMode, Position, Recipe, SearchMode, Line } from '@/types';
import { pos, newUuid, mul, sub, len } from '@/util';
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

const addToChart = (recipe: Recipe) => {
	let cornerPos = chartRect.value ? screenToChartPos(pos(chartRect.value.left, chartRect.value.bottom), offset.value, zoom.value, chartRect.value) : offset.value;
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
	nodes.value = [...nodes.value, node];
	updateLines();
};

const removeFromChart = (node: NodeT) => {
	for (let cnode of nodes.value) {
		cnode.children = cnode.children.filter(n => n.uuid != node.uuid);
	}
	nodes.value = nodes.value.filter(n => n.uuid != node.uuid);
	updateLines();
};

const clearChart = () => {
	nodes.value = [];
	updateLines();
};

const setActiveNode = (node: NodeT|undefined, mode: NodeMode|undefined) => {
	activeNode.value = node;
	activeNodeMode.value = mode;
};

const updateLines = () => {
	let newLines: Line[] = [];
	let seen: Set<number> = new Set();

	for (let node of nodes.value) {
		for (let child of node.children) {
			if (seen.has(child.uuid)) continue;
			for (let [i, id] of node.recipe.inputs.map(s => s.id).entries()) {
				let j = child.recipe.outputs.map(s => s.id).indexOf(id);
				if (j != -1) {
					newLines.push({
						p0: getStackPos(node, i, "input"), 
						p1: getStackPos(child, j, "output"), 
						uuid: newUuid(),
					});
				}
			}
			seen.add(child.uuid);
		}
	}
	lines.value = newLines;
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

const chart_div = useTemplateRef("chart_div");
const chartRect = computed(() => chart_div.value?.getBoundingClientRect());

const visibleNodes = ref(nodes.value);
const visibleLines = ref(lines.value);

let lastUpdateVisible = Date.now();
const updateVisible = () => {
	let refreshPeriod = 0;
	if (nodes.value.length + lines.value.length > 1000) refreshPeriod = 500;

	let time = Date.now();
	if (time - lastUpdateVisible < refreshPeriod) return;
	lastUpdateVisible = Date.now();

	if (!chartRect.value) return;

	visibleNodes.value = nodes.value.filter(node => cheapOnChart(node.position, offset.value, zoom.value, chartRect.value!));
	visibleNodes.value = visibleNodes.value.filter(node => pointOnChart(node.position, pos(1000, 1000), offset.value, zoom.value, chartRect.value!));

	const {x: left, y: top} = screenToChartPos(pos(chartRect.value.left, chartRect.value.top), offset.value, zoom.value, chartRect.value);
	const {x: right, y: bottom} = screenToChartPos(pos(chartRect.value.right, chartRect.value.bottom), offset.value, zoom.value, chartRect.value);
	visibleLines.value = lines.value.map(line => clampLine(line, left - 1000, top - 1000, right + 1000, bottom + 1000)).filter(line => line !== undefined);
};

// workaround for cached compute
let timer = 0;
const updateVisibleWatcher = () => {
	updateVisible();
	clearTimeout(timer);
	timer = setTimeout(() => updateVisible(), 500);
};

watch([nodes, lines, offset, zoom, chartRect], updateVisibleWatcher);

// solver
const solve = (node: NodeT) => {
	if (!data) return;
	let tree = solveTree(node, data.value);
	alignTree(node);
	nodes.value = [...nodes.value, ...tree];
	updateLines();
};

const addAndSolve = (recipe: Recipe) => {
	addToChart(recipe);
	let node = nodes.value[nodes.value.length-1]!;
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
	addToChart,
	addAndSolve,
});

// debug
window.addEventListener("keyup", (e) => {
	if (!data) return;
	if (e.key == " " && e.ctrlKey) {
		let recipe = searchRecipes("gregtech:meta_item_1:128", "recipe", data.value)[0]!;
		let cornerPos = chartRect.value ? screenToChartPos(pos(chartRect.value.left, chartRect.value.bottom), offset.value, zoom.value, chartRect.value) : offset.value;
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

		nodes.value.push(node, ...tree);
		updateLines();
	}
});

</script>

<template>
	<div id="chart" ref="chart_div" @pointerdown.left.stop="(e) => grab(e, offset, zoom, updateVisibleWatcher, true)" @wheel="scrollZoom">
		<Node v-for="node in visibleNodes" :key="node.uuid" :class="{active: node.uuid == activeNode?.uuid}" :node
			@search="(id, mode) => $emit('search', id, mode)"
			@setActive="setActiveNode"
			@move="(e, pos) => grab(e, pos, zoom, updateLines)"
			@delete="removeFromChart"
			@solve="solve"
		/>
		<svg id="chart_bg" xmlns="http://www.w3.org/2000/svg">
			<line v-for="line of visibleLines" :key="line.uuid" :x1="line.p0.x + 'px'" :y1="line.p0.y + 'px'" :x2="line.p1.x + 'px'" :y2="line.p1.y + 'px'"></line>
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

		&>line {
			stroke: var(--fg3);
			stroke-dasharray: v-bind("visibleLines.length > 100 ? 'none' : '5, 5'"); /* drawing this is pretty expensive for some reason */
			transform: translate(v-bind("-offset.x + 'px'"), v-bind("-offset.y + 'px'"));
		}
	}
}
</style>
