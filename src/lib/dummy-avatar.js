import HoloAvatar from './holo-avatar'

export class DummyAvatar extends HoloAvatar {
  async displayVideo() {
    let avatarTexture = new BABYLON.VideoTexture(this.mesh.id + "-VideoTexture", this.videoUrl,
      this.scene, true, true, null,
      {
        autoUpdateTexture: true,
        autoPlay: true,
        muted: true,
        loop: true
      });
    if ( this.mesh.material.diffuseTexture ) {
      this.mesh.material.diffuseTexture.dispose();
    }
    this.mesh.material.diffuseTexture = avatarTexture;
  }
}

export default DummyAvatar;