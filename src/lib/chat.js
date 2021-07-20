export default class {
  constructor (world) {
    this.world = world;
  }
  executeAndSend(event) {
    this.execute(event);
    this.world.worldManager.VRSPACE.sendMy('chatEvent', event);
  }
  async execute( event ) {
    switch (event.action) {
      case "log":
        console.log(event);
        break;
    }
  }
}