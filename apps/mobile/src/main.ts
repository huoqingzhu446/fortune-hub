import { createPinia } from 'pinia';
import { createSSRApp } from 'vue';
import App from './App.vue';
import { installHttpInterceptors } from './interceptors/http';

export function createApp() {
  installHttpInterceptors();
  const app = createSSRApp(App);
  app.use(createPinia());

  return {
    app,
  };
}
