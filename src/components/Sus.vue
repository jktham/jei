<script setup lang="ts">
import App from './App.vue';

</script>

<template>
	<Suspense>
		<App></App>
		<template #fallback>loading...</template>
	</Suspense>
</template>
