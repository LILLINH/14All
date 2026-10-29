<script setup>
import { useNotes } from '../composables/useNotes'

const { notes } = useNotes()
</script>

<template>
  <ul>
    <li v-for="note in notes" :key="note.id">{{ note.text }}</li>
  </ul>
</template>
