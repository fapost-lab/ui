import './app.css'
import {createApp} from 'vue'
import * as entry from '@fapost/ui'
import {KIT_MESSAGES} from '@fapost/ui/lib/messages'
import App from './App.vue'
// Written by run.mjs from the package's surface.json: one namespace import per subpath.
import {surface} from './surface.generated'

// Keep every module in the bundle: an import that resolves to nothing, or a component that does not compile, fails
// the build instead of being tree-shaken away.
Object.assign(window, {__fapostUi: {entry, surface}})

createApp(App)
    .provide(KIT_MESSAGES, () => ({close: 'Close'}))
    .mount('#app')
