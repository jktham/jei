import { App } from "./app";

async function main() {
	let app = new App();
	await app.init();
}

main();
