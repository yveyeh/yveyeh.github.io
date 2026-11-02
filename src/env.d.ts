/// <reference types="vite/client" />

declare module '*.html' {
  import type { RootRenderFunction } from 'vue'
  export const render: RootRenderFunction
  export default render
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}
