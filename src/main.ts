import { createApp } from 'vue';
import Sus from './components/Sus.vue';

let app = createApp(Sus)
app.config.performance = true;
app.mount('#app');
