<template>
  <div>
    <div class="items">
      <div
        @click="select('TCP')"
        :class="['item', selected === 'TCP' ? 'selected' : '']"
      >
        TCP
      </div>
      <div
        @click="select('Websocket')"
        :class="['item', selected === 'Websocket' ? 'selected' : '']"
      >
        WebSocket
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data () {
    return {
      selected: 'TCP'
    }
  },
  methods: {
    select (val) {
      if (this.selected !== val) {
        this.selected = val
        this.$emit('menuChange', val)
      }
    }
  }
}
</script>

<style scoped>
.items {
  margin-top: 30px;
}

.item {
  padding: 10px 20px;
  cursor: pointer;
  display: flex;
  color: #6a6a6a;
  margin-bottom: 12px;
}

.selected {
  background-color: rgb(221, 219, 226);
}
</style>
