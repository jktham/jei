import { App } from "./app";

async function main() {
	let app = new App();
	await app.init();

	await app.processQueryParams();
	window.addEventListener("popstate", async () => {
		await app.processQueryParams();
	});
}

main();
