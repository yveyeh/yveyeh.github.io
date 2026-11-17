import { defineComponent, h } from 'vue'
import { RouterView } from 'vue-router'

/**
 * @author Didier Yufenyuy Veyeh <https://yveyeh.github.io>
 * @copyright © 2021. Tenshnova (https://www.yveyeh.dev)
 * @license - See the link (https://github.com/yveyeh/yveyeh.github.io/blob/master/LICENSE)
 * @version 3.0
 */
export default defineComponent({
  name: 'App',
  render() {
    return h(RouterView)
  }
})
