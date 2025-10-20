<script setup lang="ts">
import type { Data, SearchMode, Stack } from '@/types';
import { imgFallback } from '@/util';

const { stack, data, searchRecipe } = defineProps<{ stack: Stack, data: Data, searchRecipe: (id: string, mode: SearchMode, data: Data) => void }>();

</script>

<template>
	<div class="stack" @click="searchRecipe(stack.id, 'r', data)" @contextmenu.prevent="searchRecipe(stack.id, 'u', data)" :title="stack.name + '\n' + stack.id">
		<img class="icon" :src="stack.icon" @error="imgFallback"></img>
		<span class="count" v-if="stack.count > 0">{{ stack.count }}</span>
	</div>
</template>

<style scoped>
.stack {
	position: relative;
	width: 32px;
	height: 32px;
	min-width: 32px;
	min-height: 32px;
	cursor: pointer;
}

.stack:hover {
	background-color: #303030;
}

.stack .icon {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
}

.stack .count {
	position: absolute;
	bottom: 0;
	right: 0;
	max-width: 30px;
	text-shadow: 1px 1px 2px black;
	z-index: 20;
}
</style>