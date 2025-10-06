import { chart_div } from "./app";
import { createStackElement, createSymbol, type RichStack } from "./util";

export function addNode(machine: RichStack, inputs: RichStack[], outputs: RichStack[], connectedNode: HTMLDivElement | undefined) {
	chart_div.appendChild(createNodeElement(machine, inputs, outputs));
	if (connectedNode) {
		// todo: line stuff
	}
}

export function createNodeElement(machine: RichStack, inputs: RichStack[], outputs: RichStack[]): HTMLDivElement {
	let node_div = document.createElement("div");
	let bar_div = document.createElement("div");
	let content_div = document.createElement("div");
	let move_div = document.createElement("div");
	let delete_button = document.createElement("button");
	let machine_div = document.createElement("div");
	let inputs_div = document.createElement("div");
	let outputs_div = document.createElement("div");
	
	node_div.className = "node";
	bar_div.className = "bar";
	content_div.className = "content";
	move_div.className = "move";
	delete_button.className = "delete";
	machine_div.className = "stacks";
	inputs_div.className = "stacks";
	outputs_div.className = "stacks";

	move_div.appendChild(createSymbol("menu"));
	delete_button.appendChild(createSymbol("delete"));

	machine_div.appendChild(createStackElement(machine));
	inputs.map(stack => inputs_div.appendChild(createStackElement(stack)));
	outputs.map(stack => outputs_div.appendChild(createStackElement(stack)));

	move_div.addEventListener("mousedown", (e) => {
		let offsetX = e.clientX - parseInt(window.getComputedStyle(node_div).left)
		let offsetY = e.clientY - parseInt(window.getComputedStyle(node_div).top);
		
		function move(e: MouseEvent) {
			let chart_rect = chart_div.getBoundingClientRect();
			let node_rect = node_div.getBoundingClientRect();
			node_div.style.left = Math.min(Math.max(e.clientX - offsetX, 0), chart_rect.width - node_rect.width) + "px";
			node_div.style.top = Math.min(Math.max(e.clientY - offsetY, 0), chart_rect.height - node_rect.height) + "px";
		}

		function reset() {
			window.removeEventListener("mousemove", move);
			window.removeEventListener("mouseup", reset);
		}

		window.addEventListener("mousemove", move);
		window.addEventListener("mouseup", reset);
	});

	delete_button.addEventListener("click", () => {
		chart_div.removeChild(node_div);
	})

	bar_div.appendChild(move_div);
	bar_div.appendChild(delete_button);
	content_div.appendChild(inputs_div);
	content_div.appendChild(machine_div);
	content_div.appendChild(outputs_div);
	node_div.appendChild(bar_div);
	node_div.appendChild(content_div);
	return node_div;
}
