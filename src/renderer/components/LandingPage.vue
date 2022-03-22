<template>
  <div id="wrapper">
    <main>
      <div class="left-side">
        <left-menu v-on:menuChange="menuChange"></left-menu>
      </div>
      <div class="right-side">
        <websocket v-if="selected === 'Websocket'" ref="websocket" />
        <socket v-if="selected === 'TCP'" ref="socket" />
      </div>
    </main>
  </div>
</template>

<script>
import LeftMenu from './LeftMenu/LeftMenu'
import Websocket from './Websocket/Websocket'
import Socket from './Socket/Socket'

export default {
  name: 'landing-page',
  components: { LeftMenu, Websocket, Socket },
  data () {
    return {
      selected: 'TCP'
    }
  },
  methods: {
    menuChange (val) {
      if (this.selected === 'TCP') {
        this.$refs.socket.clearAll()
      } else {
        this.$refs.websocket.clearAll()
      }
      this.selected = val
    }
  }
}
</script>

<style>
@import url("https://fonts.googleapis.com/css?family=Source+Sans+Pro");

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: "Source Sans Pro", sans-serif;
}

#wrapper {
  background: radial-gradient(
    ellipse at top left,
    rgba(255, 255, 255, 1) 40%,
    rgba(229, 229, 229, 0.9) 100%
  );
  height: 100vh;
  width: 100vw;
}

main {
  display: flex;
}

main > div {
  flex-basis: 20%;
}

.left-side {
  max-width: 200px;
  height: 100vh;
  display: flex;
  background-color: rgb(237, 232, 238);
  flex-direction: column;
}
.right-side {
  flex: 1;
}
</style>
