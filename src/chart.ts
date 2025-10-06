import { chart_div, names } from "./app";
import type { Stack } from "./generate";
import { createStack } from "./search";

export function addNode(machine: string, inputs: Stack[], outputs: Stack[]) {
	let node_div = document.createElement("div");
	let inputs_div = document.createElement("div");
	let machine_div = document.createElement("div");
	let outputs_div = document.createElement("div");
	
	node_div.className = "node";
	inputs_div.className = "inputs";
	machine_div.className = "machine";
	outputs_div.className = "outputs";

	machine_div.appendChild(createStack({id: machine, count: 0}));
	inputs.map(stack => inputs_div.appendChild(createStack(stack)));
	outputs.map(stack => outputs_div.appendChild(createStack(stack)));

	node_div.textContent = names.get(outputs[0].id) || outputs[0].id;

	node_div.addEventListener("mousedown", (e) => {
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

	node_div.appendChild(inputs_div);
	node_div.appendChild(machine_div);
	node_div.appendChild(outputs_div);
	chart_div.appendChild(node_div);
}
