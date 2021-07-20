<template>
    <div id="chatbox" class="flex flex-col">
        <div class="chat-log flex-col flex-grow p-2">
            <a class="btn absolute right-3 top-1" @click="$emit('toggleChat')">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </a>
            <div v-for="message of chatLog" :key="message">
                <span class="font-bold" :class="message.user_id === world.spaceConfig.user_id ? 'text-indigo-500' : ''">{{ message.user_id === world.spaceConfig.user_id ? 'Me' : message.alias }}: </span>
                <span class="ml-1">{{ message.content }}</span>
            </div>
        </div>
        <div class="chat-input flex">
            <input type="text" class="focus:outline-none flex-grow px-2" v-on:keyup.enter="submit" v-on:keyup.esc="cancel">
        </div>
    </div>
</template>
<script>
export default {
  name: "Chat",
  props: ['world', 'chatLog'],
  watch: {
    chatLog: {
      deep: true,
      handler() {
        this.$nextTick(async () => {
          if (!this.atBottom()) {
            this.scrollToBottom();
          }
        });
      }
    }
  },
  mounted() {
    this.scrollToBottom();
  },
  methods: {
    cancel() {
      document.querySelector("#chatbox .chat-input input").value = '';
      document.getElementById('renderCanvas').focus();
    },
    submit() {
      let content = document.querySelector("#chatbox .chat-input input").value.trim();
      if(content === '') {
        return;
      }
      this.world.chat.executeAndSend({
        user_id: this.world.spaceConfig.user_id,
        alias: this.world.spaceConfig.alias,
        content: content
      });
      document.querySelector("#chatbox .chat-input input").value = '';
    },
    atBottom() {
      return document.querySelector("#chatbox .chat-log").offsetHeight + document.querySelector("#chatbox .chat-log").scrollTop >= document.querySelector("#chatbox .chat-log").scrollHeight
    },
    scrollToBottom() {
      let container = document.querySelector("#chatbox .chat-log");
      container.scrollTop = container.scrollHeight;
    }
  }
}
</script>

<style scoped>
    #chatbox {
        width: 100%;
        max-width: 700px;
    }
    .chat-log {
        scrollbar-color: rgba(0,0,0,0.25);
        scrollbar-width: thin;
        height: 166px;
        max-height: 150px;
        overflow-y: auto;
        background-color: rgba(0,0,0,0.5);
    }
    .chat-input {
        background-color: rgba(0,0,0,0.5);
        font-size: 0.9rem;
        line-height: 1.5rem;
    }
    .chat-log::-webkit-scrollbar {
        width: 7px;
    }
    .chat-log::-webkit-scrollbar-track {
        background-color:  rgba(0,0,0,0.5);
        border-radius: 100px;
    }
    .chat-log::-webkit-scrollbar-thumb {
        border-radius: 100px;
        background-color: #7130e3;
        box-shadow: inset 2px 2px 5px 0 rgba(#fff, 0.25);
    }
    #chatbox input {
        border: 1px solid #909090;
        background-color: transparent;
    }
    #chatbox input:focus {
        border: 1px solid #d0d0d0;
    }
</style>