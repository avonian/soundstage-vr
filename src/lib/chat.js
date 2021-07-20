export default class {
  constructor (world) {
    this.world = world;
    let vue = document.querySelector("#app")._vnode.component;
    this.chatLog = vue.data.chatLog;
  }
  executeAndSend(event) {
    this.execute(event);
    this.world.worldManager.VRSPACE.sendMy('chatEvent', event);
  }
  async execute( event ) {
    this.chatLog.push(event)
  }
}