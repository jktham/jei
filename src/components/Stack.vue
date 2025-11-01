<script setup lang="ts">
import type { SearchMode, Stack } from '@/types';
import { imgFallback } from '@/util';

const { stack } = defineProps<{
	stack: Stack,
}>();

const emit = defineEmits<{
	(e: 'search', id: string, mode: SearchMode): void,
}>();

</script>

<template>
	<div class="stack" @click="$emit('search', stack.id, 'recipe')" @contextmenu.prevent="$emit('search', stack.id, 'use')" :title="stack.name + '\n' + stack.id">
		<img class="icon" :src="stack.icon" @error="imgFallback" loading="lazy" draggable="false"></img>
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
	background-color: var(--tbg1);
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