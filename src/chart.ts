import type { Node, NodeMode, Position } from "./types";

export function grabStart(e: PointerEvent, position: Position, zoom: number, update?: () => void) {
	let initialOffset: Position = {
		x: e.clientX / zoom - position.x, 
		y: e.clientY / zoom - position.y,
	};
	
	function move(e: MouseEvent) {
		position.x = e.clientX / zoom - initialOffset.x;
		position.y = e.clientY / zoom - initialOffset.y;

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
