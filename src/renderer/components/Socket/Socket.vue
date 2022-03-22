<template>
  <div id="content">
    <div class="title">
      <el-form :inline="true" label-suffix=":" label-width="auto" size="mini">
        <el-form-item label="Host" class="input">
          <el-input
            placeholder="example: localhost:8080"
            class="input-with-select"
            v-model="host"
          >
          </el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="connect" :disabled="status > 0"
            >Connect</el-button
          >
        </el-form-item>
        <el-form-item>
          <el-button type="info" @click="shutdown" :disabled="status == 0"
            >Shutdown</el-button
          >
        </el-form-item>
      </el-form>
    </div>
    <div class="message-box">
      <div id="contextmenu" v-show="boxMenuVisible" class="menu" ref="boxMenu">
        <div class="contextmenu__item" @click="clearBox">清空</div>
      </div>

      <div class="header">
        <span>Status: </span>
        <span class="connected" v-if="status === 2">connected</span>
        <span class="connecting" v-if="status === 1">connecting</span>
        <span class="disconnected" v-if="status === 0">disconnected</span>
      </div>
      <div class="messages" ref="messages" @contextmenu="showBoxMenu">
        <div
          class="message-wrapper"
          v-for="(item, index) in messages"
          :key="index"
        >
          <div v-if="!item.self" class="message left">
            <div class="icon">
              <el-avatar>S</el-avatar>
            </div>
            <div class="content">
              <div class="data">{{ item.msg }}</div>
              <div class="time">{{ item.time }}</div>
            </div>
          </div>
          <div v-if="item.self" class="message right">
            <div class="content">
              <div class="data">{{ item.msg }}</div>
              <div class="time">{{ item.time }}</div>
            </div>
            <div class="icon">
              <el-avatar>C</el-avatar>
            </div>
          </div>
        </div>
      </div>
      <div class="send-box">
        <div class="option">
          <el-radio-group v-model="codec" size="mini">
            <el-radio-button label="text" border>Text</el-radio-button>
            <el-radio-button style="margin-left: 5px" label="hex" border
              >Hex</el-radio-button
            >
          </el-radio-group>
          <el-checkbox v-model="enter" class="enter-option" size="mini"
            >Enter is send</el-checkbox
          >
        </div>
        <div class="message-content">
          <textarea
            @keydown.enter="enterPressed"
            class="message-input"
            v-model="input"
            ref="input"
          ></textarea>
          <el-button
            class="send-btn"
            type="primary"
            size="mini"
            @click="send"
            :disabled="input === ''"
            >Send</el-button
          >
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { uint8Arr2HexStr, hexStr2Uint8Arr } from '@/tool/hex.js'
import { dateFormat } from '@/tool/time.js'
const net = require('net')

var TcpStatus = {
  Shutdown: 0,
  Connecting: 1,
  Connected: 2
}
export default {
  name: 'websocket',
  data () {
    return {
      client: new net.Socket(),
      host: '',
      codec: 'text',
      enter: true,
      input: '',
      messages: [],
      timer: null,
      status: TcpStatus.Shutdown,
      boxMenuVisible: false
    }
  },
  mounted () {
    this.client.on('connect', this.onopen)
    this.client.on('data', this.ondata)
    this.client.on('close', this.onclose)
    this.client.on('error', this.onerror)
  },
  watch: {
    boxMenuVisible (value) {
      if (value) {
        document.body.addEventListener('click', this.closeBoxMenu)
      } else {
        document.body.removeEventListener('click', this.closeBoxMenu)
      }
    },
    codec () {
      this.input = ''
      this.$refs.input.focus()
    }
  },
  methods: {
    connect () {
      this.host.trim()
      if (this.host === '') {
        this.$message.error('please input the host. ')
        return
      }
      let hosts = this.host.split(':')
      let port = 80
      if (hosts.length >= 2) {
        port = parseInt(hosts[1])
      }
      this.client.connect(port, hosts[0])
      this.status = TcpStatus.Connecting
    },
    shutdown () {
      this.client.end()
    },
    enterPressed (e) {
      // 回车按下事件
      if (e.key === 'Enter') {
        if (this.enter) {
          if (e.altKey && this.codec === 'text') {
            const selection = this.$refs.input.selectionStart
            this.input = this.input.substr(0, selection) + '\n' + this.input.substr(selection)
            return
          }
          e.preventDefault()
          this.send()
        }
      }
    },
    appendMsg (msg) {
      this.messages.push(msg)
      if (this.timer) {
        clearInterval(this.timer)
        this.timer = null
      }
      this.$nextTick(function () {
        let that = this
        let n = that.$refs.messages.scrollHeight - that.$refs.messages.scrollTop
        this.timer = setInterval(function () {
          if (n <= 0) {
            clearInterval(that.timer)
          } else {
            that.$refs.messages.scrollTop += 10
            n -= 10
          }
        }, 20 / n)
      })
    },
    send () {
      if (this.status !== TcpStatus.Connected) {
        this.$message.error('socket disconnected.')
        return
      }
      if (this.input === '') {
        this.$message.error('please input message.')
        return
      }
      let msg2 = ''
      if (this.codec === 'text') {
        // text input, add Text tag
        msg2 = 'Text: ' + this.input
        this.client.write(this.input)
      } else {
        try {
          const cr = hexStr2Uint8Arr(this.input)
          let bs = Buffer.from(cr.arr)
          console.log(typeof bs)
          this.client.write(bs)
          msg2 = 'Hex: ' + cr.str
        } catch (error) {
          console.log(error)
          this.$message.error('please input right hex numer, like: 0x88 0x87.')
          return
        }
      }
      this.appendMsg({
        self: true,
        msg: msg2,
        time: this.timeNow()
      })
    },
    timeNow () {
      return dateFormat('YYYY-mm-dd HH:MM:SS', new Date())
    },
    showBoxMenu (e) {
      this.boxMenuVisible = false
      if (document.body.clientWidth - e.clientX < 100) {
        this.$refs.boxMenu.style.left = e.clientX - 100 + 'px'
      } else {
        this.$refs.boxMenu.style.left = e.clientX + 'px'
      }
      this.$refs.boxMenu.style.top = e.clientY + 'px'
      this.boxMenuVisible = true
    },
    closeBoxMenu () {
      this.boxMenuVisible = false
    },
    clearBox () {
      this.messages = []
    },
    clearAll () {
      this.closeBoxMenu()
      this.input = ''
      this.codec = 'text'
      this.host = ''
      this.messages = []
      this.enter = true
      if (this.timer !== null) {
        clearInterval(this.timer)
      }
      if (this.status !== TcpStatus.Shutdown) {
        this.shutdown()
      }
    },
    onopen () {
      this.status = TcpStatus.Connected
    },
    ondata (data) {
      let msg = {}
      if (this.codec === 'text') {
        msg = 'Text: ' + data
      } else {
        msg = 'Hex: ' + uint8Arr2HexStr(data)
      }
      this.appendMsg({
        self: false,
        msg: msg,
        time: this.timeNow()
      })
    },
    onerror (event) {
      console.log(event)
      this.$message.error('socket error: ' + event.data)
    },
    onclose (event) {
      this.status = TcpStatus.Shutdown
    }
  }
}
</script>

<style lang="scss">
@import url("https://fonts.googleapis.com/css?family=Source+Sans+Pro");

#content {
  margin: 0;
  padding: 0;
  height: 100vh;
  display: flex;
  flex-direction: column;
  font-family: "Source Sans Pro", sans-serif;

  .title {
    color: rgba(0, 0, 0, 0.65);
    padding: 20px 15px;
    font-size: 14px;
    .input {
      width: 50%;
      .el-form-item__content {
        width: 90%;
        .el-select {
          min-width: 80px;
        }
      }
    }
    .el-form-item {
      margin-bottom: 0;
    }
  }

  .message-box {
    flex: 1;
    color: #606266;
    font-size: 14px;
    display: flex;
    flex-direction: column;
    .header {
      padding: 10px 15px;
      height: 40px;
      background-color: rgb(237, 232, 238);
      .connected {
        color: #67c23a;
      }
      .connecting {
        color: #409eff;
      }
      .disconnected {
        color: #f56c6c;
      }
    }
    .messages {
      flex: 1;
      overflow-y: scroll;
      padding: 0px 15px;
      .message-wrapper {
        display: block;
        clear: both;
        padding: 10px;
      }
      .message {
        display: flex;
        max-width: 80%;
        .icon .el-avatar {
          font-size: 25px;
        }
        .content {
          padding: 10px;
          border-radius: 6px;
          background-color: rgb(237, 232, 238);
          word-break: break-all;
          word-wrap: break-word;
          .data {
            white-space: pre-line;
          }
          .time {
            margin-top: 3px;
            color: rgba(0, 0, 0, 0.38);
            font-size: 8pt;
          }
        }
      }
      .left {
        .content {
          margin-left: 10px;
        }
      }
      .right {
        float: right;
        clear: both;
        .icon {
          margin-right: 10px;
        }
        .content {
          margin-right: 10px;
        }
      }
    }
    .messages::-webkit-scrollbar {
      width: 2px;
      height: 0.5px;
    }
    .send-box {
      height: 180px;
      background-color: white;
      .option {
        height: 45px;
        line-height: 45px;
        padding-left: 15px;
        background-color: rgb(237, 232, 238);
        .enter-option {
          margin-left: 5px;
          .el-checkbox__label {
            padding-left: 5px;
          }
        }
      }
      .message-content {
        .message-input {
          width: 100%;
          height: 130px;
          resize: none;
          outline: none;
          border: none;
          font-size: 14px;
          line-height: 20px;
          padding: 5px 15px;
          color: #606266;
        }
        .send-btn {
          position: fixed;
          bottom: 10px;
          right: 20px;
        }
      }
    }

    .menu {
      position: absolute;
      background-color: #fff;
      width: 100px;
      /*height: 106px;*/
      font-size: 12px;
      color: #444040;
      border-radius: 4px;
      -webkit-box-sizing: border-box;
      box-sizing: border-box;
      border-radius: 3px;
      border: 1px solid rgba(0, 0, 0, 0.15);
      box-shadow: 0 6px 12px rgba(0, 0, 0, 0.175);
      white-space: nowrap;
      z-index: 1000;
      .contextmenu__item {
        display: block;
        line-height: 34px;
        text-align: center;
      }
      .contextmenu__item:not(:last-child) {
        border-bottom: 1px solid rgba(0, 0, 0, 0.1);
      }
      .contextmenu__item:hover {
        cursor: pointer;
        background: #66b1ff;
        border-color: #66b1ff;
        color: #fff;
      }
    }
  }
}
</style>
