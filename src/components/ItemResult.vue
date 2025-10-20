<script setup lang="ts">
import type { Data, Stack as StackT, SearchMode } from '@/types';
import { imgFallback } from '@/util';
import Stack from './Stack.vue';

const { item, data, searchRecipe } = defineProps<{ item: StackT, data: Data, searchRecipe: (id: string, mode: SearchMode, data: Data) => void }>();

</script>

<template>
<div class="item">
	<Stack :stack="item" :data :searchRecipe></Stack>
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
