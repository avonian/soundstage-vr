export class Customizer {
  constructor (world) {
    this.world = world;
    this.scene = world.scene;
    this.eventConfig = world.eventConfig;
    this.userSettings = world.userSettings;
  }
  init () {
    if(this.eventConfig.posters) {
      this.posters();
    }
    if(this.userSettings.graphicsQuality === 'high') {
      this.barLights();
    }
  }
  posters () {
    const posters = this.eventConfig.posters;
    let posterGallery = new BABYLON.TransformNode("posterGallery");
    for (let i = 0; i < posters.length; i++) {
      if (!this.scene.getMeshByName(posters[i].name)) {
        let galleryPoster = BABYLON.MeshBuilder.CreatePlane(posters[i].name, { width: posters[i].width, height: posters[i].height });
        galleryPoster.position.x = posters[i].posX;
        galleryPoster.position.y = posters[i].posY;
        galleryPoster.position.z = posters[i].posZ;
        galleryPoster.rotation.y = BABYLON.Tools.ToRadians(posters[i].rotationY);
        galleryPoster.material = new BABYLON.StandardMaterial(posters[i].name + "_mat", this.scene);
        galleryPoster.material.emissiveTexture = new BABYLON.Texture(posters[i].url, this.scene);
        galleryPoster.parent = posterGallery;
      }
    }
  }
  barLights () {
    let selectionLight = new BABYLON.SpotLight("selectLight", new BABYLON.Vector3(0.864, 2, -6.131),
      new BABYLON.Vector3(0, -1, 0),BABYLON.Tools.ToRadians(45), 1, this.scene);
    selectionLight.intensity = 100;
    selectionLight.angle = BABYLON.Tools.ToRadians(120);
    selectionLight.diffuse = BABYLON.Color3.Purple();

    let tealLight = selectionLight.clone("tealLight");
    tealLight.position = new BABYLON.Vector3(-0.6, 1.787, -6.131);
    tealLight.diffuse = BABYLON.Color3.Teal();
    /*
    let purpleLight = selectionLight.clone("purpleLight");
    purpleLight.position = new BABYLON.Vector3(1.6, 1.787, -6.131);
    purpleLight.diffuse = BABYLON.Color3.Purple();
    */
    let tealLight2 = selectionLight.clone("tealLight2");
    tealLight2.position = new BABYLON.Vector3(3.25, 1.787, -6.131);
    tealLight2.diffuse = BABYLON.Color3.Blue();

    const shadowGenerator = new BABYLON.ShadowGenerator(1024, selectionLight);
    shadowGenerator.usePercentageCloserFiltering = true;
    //  shadowGenerator.filteringQuality = BABYLON.ShadowGenerator.QUALITY_HIGH;

    this.scene.meshes.forEach(mesh => {
      shadowGenerator.getShadowMap().renderList.push(mesh);
      mesh.receiveShadows = true;
      console.log(mesh.name + " receiveShadows " + mesh.receiveShadows);
    });

    const shadowGeneratorBlue = new BABYLON.ShadowGenerator(1024, tealLight2);
    shadowGeneratorBlue.usePercentageCloserFiltering = true;
    //  shadowGenerator.filteringQuality = BABYLON.ShadowGenerator.QUALITY_HIGH;

    this.scene.meshes.forEach(mesh => {
      shadowGeneratorBlue.getShadowMap().renderList.push(mesh);
      mesh.receiveShadows = true;
      console.log(mesh.name + " receiveShadows " + mesh.receiveShadows);
    });

    const shadowGeneratorTeal = new BABYLON.ShadowGenerator(1024, tealLight);
    shadowGeneratorTeal.usePercentageCloserFiltering = true;
    //  shadowGenerator.filteringQuality = BABYLON.ShadowGenerator.QUALITY_HIGH;

    this.scene.meshes.forEach(mesh => {
      shadowGeneratorTeal.getShadowMap().renderList.push(mesh);
      mesh.receiveShadows = true;
      console.log(mesh.name + " receiveShadows " + mesh.receiveShadows);
    });
  }
}

export default Customizer;