import { active_stacks, chart_div, chart_svg } from "./app";
import { createStackElement, createSymbol, type RichStack } from "./util";

export function addNode(machine: RichStack, inputs: RichStack[], outputs: RichStack[]) {
	chart_div.appendChild(createNodeElement(machine, inputs, outputs));
	if (active_stacks[0].el && active_stacks[1].el) {
		chart_svg.appendChild(createLineElement(active_stacks[0].el, active_stacks[1].el));
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

	machine_div.appendChild(createStackElement(machine, true));
	// inputs.map(stack => inputs_div.appendChild(createStackElement(stack, true)));
	// outputs.map(stack => outputs_div.appendChild(createStackElement(stack, true)));

	for (let stack of inputs) {
		let el = createStackElement(stack, true);
		inputs_div.appendChild(el);
		if (stack.id == active_stacks[0].id && active_stacks[0].type == "input") {
			active_stacks[1] = {el, id: stack.id, type: "input"};
		}
	}
	for (let stack of outputs) {
		let el = createStackElement(stack, true);
		outputs_div.appendChild(el);
		if (stack.id == active_stacks[0].id && active_stacks[0].type == "output") {
			active_stacks[1] = {el, id: stack.id, type: "output"};
		}
	}

	move_div.addEventListener("pointerdown", (e) => {
		let offsetX = e.clientX - parseInt(window.getComputedStyle(node_div).left)
		let offsetY = e.clientY - parseInt(window.getComputedStyle(node_div).top);
		
		function move(e: MouseEvent) {
			let chart_rect = chart_div.getBoundingClientRect();
			let node_rect = node_div.getBoundingClientRect();
			node_div.style.left = Math.min(Math.max(e.clientX - offsetX, 0), chart_rect.width - node_rect.width) + "px";
			node_div.style.top = Math.min(Math.max(e.clientY - offsetY, 0), chart_rect.height - node_rect.height) + "px";
		}

		function reset() {
			window.removeEventListener("pointermove", move);
			window.removeEventListener("pointerup", reset);
		}

		window.addEventListener("pointermove", move);
		window.addEventListener("pointerup", reset);
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

export function createLineElement(stack0: HTMLDivElement, stack1: HTMLDivElement): SVGLineElement {
	let line = document.createElementNS("http://www.w3.org/2000/svg", "line");

	line.setAttribute("stroke", "white");
	line.setAttribute("stroke-dasharray", "5,5");

	let x0 = chart_div.getBoundingClientRect().left;
	let y0 = chart_div.getBoundingClientRect().top;
    line.setAttribute("x1", stack0.getBoundingClientRect().left - x0 + 16 + "px");
    line.setAttribute("y1", stack0.getBoundingClientRect().top - y0 + 16 + "px");
    line.setAttribute("x2", stack1.getBoundingClientRect().left - x0 + 16 + "px");
    line.setAttribute("y2", stack1.getBoundingClientRect().top - y0 + 16 + "px");

	let callback = (_mutations: MutationRecord[], observer: MutationObserver) => {
		let nodes = new Set(chart_div.children)
		if (!nodes.has(node0) || !nodes.has(node1)) { // parent node deleted
			chart_svg.removeChild(line);
			observer.disconnect();
			return;
		}

		let x0 = chart_div.getBoundingClientRect().left;
		let y0 = chart_div.getBoundingClientRect().top;
		line.setAttribute("x1", stack0.getBoundingClientRect().left - x0 + 16 + "px");
		line.setAttribute("y1", stack0.getBoundingClientRect().top - y0 + 16 + "px");
		line.setAttribute("x2", stack1.getBoundingClientRect().left - x0 + 16 + "px");
		line.setAttribute("y2", stack1.getBoundingClientRect().top - y0 + 16 + "px");
	}

	let observer = new MutationObserver(callback);
	let node0 = stack0.parentElement?.parentElement?.parentElement!;
	let node1 = stack1.parentElement?.parentElement?.parentElement!;
	observer.observe(node0, {attributes: true, attributeFilter: ["style"]});
	observer.observe(node1, {attributes: true, attributeFilter: ["style"]});
	observer.observe(chart_div, {childList: true});

	return line;
}