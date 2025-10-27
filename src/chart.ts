import type { Node, NodeMode, Position } from "./types";
import { add, div, len, mul, pos, sub } from "./util";

export function grab(e: PointerEvent, position: Position, zoom: number, update?: () => void, flip: boolean = false) {
	let initialOffset: Position = {
		x: e.clientX / zoom - position.x * (flip ? -1 : 1),
		y: e.clientY / zoom - position.y * (flip ? -1 : 1),
	};
	
	function move(e: MouseEvent) {
		position.x = e.clientX / zoom - initialOffset.x;
		position.y = e.clientY / zoom - initialOffset.y;

		if (flip) {
			position.x *= -1;
			position.y *= -1;
		}

		update?.();
	}

	function reset() {
		window.removeEventListener("pointermove", move);
		window.removeEventListener("pointerup", reset);
	}

	window.addEventListener("pointermove", move);
	window.addEventListener("pointerup", reset);
};

export function getStackPos(node: Node, i: number, side: NodeMode): Position {
	return {
		x: node.position.x + 8 + 32 + 8 + i * (32 + 8) + 16,
		y: node.position.y + (side == "input" ? 8 + 16 : 8 + 2 * (32 + 8) + 16),
	};
}

export function getNodeSize(node: Node): Position {
	let stacks = Math.max(node.recipe.inputs.length, node.recipe.outputs.length);
	return {
		x: 8 + 32 + 8 + stacks * (32 + 8),
		y: 8 + 3 * (32 + 8),
	};
}

export function alignTree(root: Node) {
	alignStep(root);
}

const margin = 32;

function alignStep(node: Node) {
	let offset = 0;
	for (let child of node.children) {
		let size = getNodeSize(child);

		child.position.x = node.position.x + offset;
		child.position.y = node.position.y - (size.y + margin);

		offset += getTreeWidth(child);
		alignStep(child);
	}
}

function getTreeWidth(node: Node): number {
	if (node.children.length == 0) {
		return getNodeSize(node).x + margin;
	}
	
	let width = 0;
	for (let child of node.children) {
		width += getTreeWidth(child);
	}
	return Math.max(width, getNodeSize(node).x + margin);
}

export function chartToScreenPos(chartPos: Position, offset: Position, zoom: number, chartRect: DOMRect): Position {
	let screenOffset = mul(sub(chartPos, offset), zoom);
	let screenPos = add(screenOffset, pos(chartRect.x, chartRect.y));
	return screenPos;
}

export function screenToChartPos(screenPos: Position, offset: Position, zoom: number, chartRect: DOMRect): Position {
	let screenOffset = sub(screenPos, pos(chartRect.x, chartRect.y));
	let chartPos = add(div(screenOffset, zoom), offset);
	return chartPos;
}

export const cheapOnChart = (pos: Position, offset: Position, zoom: number, chartRect: DOMRect): boolean => {
	let size = Math.max(chartRect.width, chartRect.height);
	let vec = sub(pos, offset);
	return vec.x >= -200 && vec.y >= -200 && len(vec) * zoom < size * 2;
};

export function pointOnChart(chartPos: Position, tolerance: Position, offset: Position, zoom: number, chartRect: DOMRect): boolean {
	return (
		chartToScreenPos(add(chartPos, tolerance), offset, zoom, chartRect).x >= chartRect.left &&
		chartToScreenPos(sub(chartPos, tolerance), offset, zoom, chartRect).x <= chartRect.right &&
		chartToScreenPos(add(chartPos, tolerance), offset, zoom, chartRect).y >= chartRect.top &&
		chartToScreenPos(sub(chartPos, tolerance), offset, zoom, chartRect).y <= chartRect.bottom
	);
}

export function lineOnChart(p0: Position, p1: Position, tolerance: Position, offset: Position, zoom: number, chartRect: DOMRect): boolean {
	return ( // todo: check line/rect intersect
		pointOnChart(p0, tolerance, offset, zoom, chartRect) ||
		pointOnChart(p1, tolerance, offset, zoom, chartRect)
	);
}
