import { createApp } from 'vue'
import RootApp from './RootApp.vue'
import router from './router'
import './style.css'

const app = createApp(RootApp)

app.use(router)
app.mount('#app')
