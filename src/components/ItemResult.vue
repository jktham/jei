<script setup lang="ts">
import type { Stack as StackT } from '@/types';
import Stack from './Stack.vue';

const { item } = defineProps<{ item: StackT }>();

</script>

<template>
<div class="item">
	<Stack :stack="item"></Stack>
	<span class="name">{{ item.name }}</span>
	<span class="id">{{ item.id }}</span>
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
}
</style>
