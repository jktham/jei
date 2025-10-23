<template>
	<div class="symbol material-symbols-outlined"><slot></slot></div>
</template>

<style scoped>
.symbol {
	height: 24px;
	width: 24px;
	max-height: 24px;
	max-width: 24px;
}

.flip {
	transform: scale(1, -1);
}

.rotate {
	transform: rotate(90deg);
}
</style>
