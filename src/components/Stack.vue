<script setup lang="ts">
import type { SearchMode, Stack } from '@/types';
import { imgFallback } from '@/util';
import { useTemplateRef } from 'vue';

const { stack, search } = defineProps<{ stack: Stack, search: (query: string, mode: SearchMode) => void }>();

const stackRef = useTemplateRef("stack");

defineExpose({
	stackRef,
});
</script>

<template>
	<div ref="stack" class="stack" @click="search(stack.id, 'recipe')" @contextmenu.prevent="search(stack.id, 'use')" :title="stack.name + '\n' + stack.id">
		<img class="icon" :src="stack.icon" @error="imgFallback" loading="lazy"></img>
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