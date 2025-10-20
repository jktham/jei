<script setup lang="ts">
import type { Stack as StackT, SearchMode } from '@/types';
import Stack from './Stack.vue';

const { item, search } = defineProps<{ item: StackT, search: (query: string, mode: SearchMode) => void }>();

</script>

<template>
<div class="item">
	<Stack :stack="item" :search></Stack>
	<span class="name">{{ item.name }}</span>
	<span class="id">{{ item.id }}</span>
</div>
</template>

<style scoped>
.item {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.5rem;
}

.stack {
	width: 32px;
	height: 32px;
	min-width: 32px;
	min-height: 32px;
	margin-right: 0.5rem;
}

.id {
	color: #aaaaaa;
}
</style>
