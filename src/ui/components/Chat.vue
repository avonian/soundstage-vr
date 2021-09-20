<template>
    <div id="chatbox" class="flex flex-col ui-hide" v-if="isOpen">
        <div class="chat-log flex-col flex-grow p-2">
            <a class="btn absolute right-3 top-1" @click="isOpen = isOpen !== true">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </a>
            <div v-for="message of chatLog" :key="message">
                <span class="font-bold" :class="message.user_id === world.spaceConfig.user_id ? 'text-indigo-500' : ''">{{ message.user_id === world.spaceConfig.user_id ? 'Me' : message.alias.replace(/\./g," ") }}: </span>
                <span class="ml-1" v-html="createLinks(message.content)"></span>
            </div>
        </div>
        <div class="chat-input flex">
            <input type="text" class="focus:outline-none flex-grow px-2" v-on:keyup.enter="submit" v-on:keyup.esc="cancel">
        </div>
    </div>
    <div id="btn-chat" class="ui-hide" v-else>
        <a class="btn-ui-secondary"  @click="isOpen = isOpen !== true">
            <svg width="30" height="30" aria-hidden="true" focusable="false" data-prefix="far" data-icon="comments" class="svg-inline--fa fa-comments fa-w-18" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512">
                <path fill="currentColor" d="M416 192c0-88.4-93.1-160-208-160S0 103.6 0 192c0 34.3 14.1 65.9 38 92-13.4 30.2-35.5 54.2-35.8 54.5-2.2 2.3-2.8 5.7-1.5 8.7S4.8 352 8 352c36.6 0 66.9-12.3 88.7-25 32.2 15.7 70.3 25 111.3 25 114.9 0 208-71.6 208-160zm122 220c23.9-26 38-57.7 38-92 0-66.9-53.5-124.2-129.3-148.1.9 6.6 1.3 13.3 1.3 20.1 0 105.9-107.7 192-240 192-10.8 0-21.3-.8-31.7-1.9C207.8 439.6 281.8 480 368 480c41 0 79.1-9.2 111.3-25 21.8 12.7 52.1 25 88.7 25 3.2 0 6.1-1.9 7.3-4.8 1.3-2.9.7-6.3-1.5-8.7-.3-.3-22.4-24.2-35.8-54.5z"></path>
            </svg>
        </a>
    </div>
</template>
<script>
export default {
  name: "Chat",
  props: ['world', 'chatLog'],
  data () {
    return {
      isOpen: false
    }
  },
  watch: {
    chatLog: {
      deep: true,
      handler() {
        if (this.atBottom()) {
          this.$nextTick(async () => {
            this.scrollToBottom();
          });
        }
      }
    },
    isOpen() {
      if(this.isOpen) {
        this.$nextTick(async () => {
          document.querySelector("#chatbox .chat-input input").focus();
          this.scrollToBottom();
        });
      }
      document.getElementById('renderCanvas').focus();
    }
  },
  mounted() {
    document.getElementById('renderCanvas').focus();
    document.addEventListener('keyup', (event) => {
      if(event.key === 't') {
        if(this.isOpen) {
          document.querySelector("#chatbox .chat-input input").focus();
        } else {
          this.isOpen = true;
        }
      }
    })
  },
  unmounted() {
    document.getElementById('renderCanvas').focus();
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
    },
    createLinks(text) { // https://www.labnol.org/code/20294-regex-extract-links-javascript
      return (text || "").replace(
        /([^\S]|^)(((https?\:\/\/)|(www\.))(\S+))/gi,
        function (match, space, url) {
          var hyperlink = url;
          if (!hyperlink.match("^https?://")) {
            hyperlink = "http://" + hyperlink;
          }
          return space + '<a href="' + hyperlink + '" class="text-indigo-500 underline" target="_blank">' + url + "</a>";
        }
      );
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