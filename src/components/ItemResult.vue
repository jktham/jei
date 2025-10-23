<script setup lang="ts">
import type { Stack as StackT } from '@/types';
import Stack from './Stack.vue';
import { computed, inject } from 'vue';
import { dataKey, searchKey } from '@/keys';
import Symbol from './Symbol.vue';

const { item } = defineProps<{ item: StackT }>();
const search = inject(searchKey, () => {});
const data = inject(dataKey);

const info = computed(() => {
	let recipes = data?.value.recipes_r.get(item.id)?.length ?? 0;
	let uses = data?.value.recipes_u.get(item.id)?.length ?? 0;
	return `${recipes} recipes, ${uses} uses`;
});

</script>

<template>
<div class="item">
	<Stack :stack="item"></Stack>
	<span class="name">{{ item.name }}</span>
	<span class="id">{{ item.id }}</span>
	<span class="info">{{ info }}</span>
	<button id="recipes" title="recipes" @click="search(item.id, 'recipe')"><Symbol class="rotate">call_merge</Symbol></button>
	<button id="uses" title="uses" @click="search(item.id, 'use')"><Symbol class="rotate">call_split</Symbol></button>
</div>
</template>

<style scoped>
.item {
	display: flex;
	align-items: center;
	gap: 1rem;
	padding: 0.5rem;

	.id {
		margin-left: -0.5rem;
		color: var(--fg3);
	}

	.info {
		margin-left: auto;
		color: var(--fg3);
	}

	#recipes {
		margin-right: -0.5rem;
	}
}
</style>
