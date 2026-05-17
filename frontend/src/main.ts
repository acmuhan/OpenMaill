import { createApp } from 'vue'
import './style.css'
import App from './App.vue'

const app = createApp(App)
app.mount('#app')

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}
