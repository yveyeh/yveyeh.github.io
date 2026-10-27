<script setup>
/**
 * Renders a Font Awesome icon definition as inline SVG (no icon font / CSS needed).
 */
const props = defineProps({
  icon: { type: Object, required: true },
})
const [width, height, , , path] = props.icon.icon
</script>

<template>
  <svg :viewBox="`0 0 ${width} ${height}`" fill="currentColor" aria-hidden="true" focusable="false">
    <path :d="Array.isArray(path) ? path.join(' ') : path" />
  </svg>
</template>
