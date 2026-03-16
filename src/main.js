import { createApp } from 'vue'
import { registerSW } from 'virtual:pwa-register'
import './style.css'
import App from './App.vue'
import '@fortawesome/fontawesome-free/css/all.css'

createApp(App).mount('#app')

if (import.meta.env.PROD) {
  registerSW({
    immediate: true
  })
}
