// Import Three.js using the ES module syntax
import * as THREE from 'three';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import {RenderPass} from 'three/examples/jsm/postprocessing/RenderPass'
import {EffectComposer} from 'three/examples/jsm/postprocessing/EffectComposer'
import {UnrealBloomPass} from "three/examples/jsm/postprocessing/UnrealBloomPass"
import {OutputPass} from "three/examples/jsm/postprocessing/OutputPass"
import {ShaderPass} from "three/examples/jsm/postprocessing/ShaderPass.js"
import { GUI } from 'dat.gui';
// Specifing canvas element
const canvas = document.getElementById("solarsystem");


// Set up scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer({canvas});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

//Creating renderpass and efectcomposer
const renderScene = new RenderPass(scene,camera);
const composer = new EffectComposer(renderer);
composer.addPass(renderScene)

//Creating the BloomPass
const BloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth,window.innerHeight),
  1.0,
  0.1,
  0.1,
)
composer.addPass(BloomPass)

composer.renderToScreen = false;

const mixpass = new ShaderPass(
  new THREE.ShaderMaterial({
    uniforms:{
      baseTexture: {value:null},
      bloomTexture: {value: composer.renderTarget2.texture}
    },
    vertexShader:document.getElementById('vertexshader').textContent,
    fragmentShader:document.getElementById('fragmentshader').textContent
  }), 'baseTexture'
);

const finalComposer = new EffectComposer(renderer);
finalComposer.addPass(renderScene)
finalComposer.addPass(mixpass);

const outputpass = new OutputPass();
finalComposer.addPass(outputpass);

const BLOOM_SCENE = 1;
const bloomLayer = new THREE.Layers();
bloomLayer.set(BLOOM_SCENE)
const darkMaterial = new THREE.MeshBasicMaterial({color:0x000000});
const materials = {};

function nonBloomed(obj){
  if(obj.isMesh && bloomLayer.test(obj.layers)=== false){
    materials[obj.uuid] = obj.material;
    obj.material = darkMaterial;
  }
}

function restoreMaterial(obj){
  if(materials[obj.uuid]){
    obj.material = materials[obj.uuid]
    delete materials[obj.uuid];
  }
}

//star Background
const starTexture = new THREE.TextureLoader().load("./assets/starsmap.jpg")
scene.background = starTexture;
scene.backgroundIntensity = 0.5

//create sun    
const sunGeometry = new THREE.SphereGeometry(5,32,64);
const sunMaterial = new THREE.MeshStandardMaterial({
    map:new THREE.TextureLoader().load("./assets/sunmap.jpg")
})
const sun = new THREE.Mesh(sunGeometry,sunMaterial)
sun.layers.enable(1);
scene.add(sun)

//CREATE PLANETS FUNCTION
const TexturedPlanet = (radius, texture, normaltexture, distance, hasRing = false, ringtexture)=>{
    const planetGeometry = new THREE.SphereGeometry(radius, 32, 64)
    const planetMaterial = new THREE.MeshStandardMaterial({
        map: new THREE.TextureLoader().load(texture),
        normalMap: new THREE.TextureLoader().load(normaltexture)
    });
    const planet = new THREE.Mesh(planetGeometry, planetMaterial)
    planet.position.x = distance;
    
    //FOR ORBIT
    const orbitGeometry = new THREE.RingGeometry(distance,distance+0.1,124)
    const orbitMaterial = new THREE.MeshBasicMaterial({color:0xD3D3D3, side: THREE.DoubleSide})
    const orbit = new THREE.Mesh(orbitGeometry,orbitMaterial)
    orbit.rotation.x = Math.PI / 2;
    orbit.position.set(0,0,0);

    //FOR RINGED PLANET
    let ring;
    if(hasRing){
        const ringGeometry = new THREE.RingGeometry(radius * 1.8, radius * 2.5, 124)
        const ringMaterial = new THREE.MeshStandardMaterial({
            map: new THREE.TextureLoader().load(ringtexture),
            side: THREE.DoubleSide,
        });
        ring = new THREE.Mesh(ringGeometry, ringMaterial)
        ring.rotation.x = -10;
        ring.position.x = distance;
    }
    return {planet, orbit, ring};
}

//CREATING ALL PLANETS
const mercury = TexturedPlanet(0.5, './assets/mercurymap.jpg','./assets/mercurybump.jpg', 10);
const venus = TexturedPlanet(0.7, "./assets/venusmap.jpg", "./assets/venusbump.jpg", 15);
const earth = TexturedPlanet(0.7, "./assets/earthmap.jpg", "./assets/earthbump.jpg", 20);
const mars = TexturedPlanet(0.6,  "./assets/marsmap.jpg","./assets/marsbump.jpg", 25);
const jupiter = TexturedPlanet(2,  "./assets/jupitermap.jpg","./assets/jupiterbump.png", 31);
const saturn = TexturedPlanet(1.5, "./assets/saturnmap.jpg", "./assets/saturnbump.png", 38,true,'./assets/saturnRingmap.png');
const uranus = TexturedPlanet(1, "./assets/uranusmap.jpg","./assets/uranusbump.png", 43);
const neptune = TexturedPlanet(1,"./assets/neptunemap.jpg","./assets/neptunebump.png", 48);


//ORBIT CONTROLS
const controls = new OrbitControls(camera, renderer.domElement);

//ADDING THE PLANETS TO THE SCENE
scene.add(
    mercury.planet,
    mercury.orbit,
    venus.planet,
    venus.orbit,
    earth.planet,
    earth.orbit,
    mars.planet,
    mars.orbit,
    jupiter.planet,
    jupiter.orbit,
    saturn.planet,
    saturn.ring,
    saturn.orbit,
    uranus.planet,
    uranus.orbit,
    neptune.planet,
    neptune.orbit
  );

//POSITIONING THE CAMERA
camera.position.z = 60;
camera.position.y = 30;

//ADDING THE LIGHT SOURCES 

//This is for Sun as the light source
const sunLight = new THREE.PointLight("white", 1000,1000);
sunLight.position.set(0, 0, 0); // Position at the center
sunLight.castShadow = true;
const ambientLight = new THREE.AmbientLight("white", 1);
scene.add(sunLight, ambientLight)


//FOR WINDOW RESIZE
window.addEventListener("resize", () => {
    const newWidth = window.innerWidth;
    const newHeight = window.innerHeight;
    camera.aspect = newWidth / newHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(newWidth, newHeight);
    finalComposer.setSize(newWidth, newHeight);
  });


//GUI CONTGROLS
const gui = new GUI();

gui.add(camera.position,'x',0,100).name("cameraPositionX");
gui.add(camera.position,'y',0,100).name("cameraPositiony");
gui.add(camera.position,'z',0,100).name("cameraPositionz");

// Render loop
const animate = () => {
  requestAnimationFrame(animate);
  controls.update();

  //FOR ROTATION AND REVOLUTION
  // Rotate planets for animation
  mercury.planet.rotation.y += 0.01;
  venus.planet.rotation.y += 0.008;
  earth.planet.rotation.y += 0.005;
  mars.planet.rotation.y += 0.005;
  jupiter.planet.rotation.y += 0.004;
  saturn.planet.rotation.y += 0.003;
  uranus.planet.rotation.y += 0.003;
  neptune.planet.rotation.y += 0.003;

   // Orbital motion
   const orbitalSpeed = 0.005;

   mercury.planet.position.x = 10 * Math.cos(orbitalSpeed * Date.now() * 0.27);
   mercury.planet.position.z = 10 * Math.sin(orbitalSpeed * Date.now() * 0.27);
 
   venus.planet.position.x = 15 * Math.cos(orbitalSpeed * Date.now() * 0.11);
   venus.planet.position.z = 15 * Math.sin(orbitalSpeed * Date.now() * 0.11);
 
   earth.planet.position.x = 20 * Math.cos(orbitalSpeed * Date.now() * 0.07);
   earth.planet.position.z = 20 * Math.sin(orbitalSpeed * Date.now() * 0.07);

   mars.planet.position.z = 25 * Math.sin(orbitalSpeed * Date.now() * 0.035);
   mars.planet.position.x = 25 * Math.cos(orbitalSpeed * Date.now() * 0.035);

   jupiter.planet.position.x = 31 * Math.cos(orbitalSpeed * Date.now() * 0.006);
   jupiter.planet.position.z = 31 * Math.sin(orbitalSpeed * Date.now() * 0.006);

   saturn.ring.position.x = 38 * Math.cos(orbitalSpeed * Date.now() * 0.002);
   saturn.ring.position.z = 38 * Math.sin(orbitalSpeed * Date.now() * 0.002);
   saturn.planet.position.x = 38 * Math.cos(orbitalSpeed * Date.now() * 0.002);
   saturn.planet.position.z = 38 * Math.sin(orbitalSpeed * Date.now() * 0.002);

   uranus.planet.position.x = 43 * Math.cos(orbitalSpeed * Date.now() * 0.0009);
   uranus.planet.position.z = 43 * Math.sin(orbitalSpeed * Date.now() * 0.0009);

   neptune.planet.position.x = 48 * Math.cos(orbitalSpeed * Date.now() * 0.0005);
   neptune.planet.position.z = 48 * Math.sin(orbitalSpeed * Date.now() * 0.0005);

  // Clear the bloom scene
  renderer.autoClear = true;
  BloomPass.selectedObjects = [];
  composer.render();

  // Render the main scene
  renderer.autoClear = false;
  BloomPass.selectedObjects = bloomLayer;

  scene.traverse(nonBloomed);

  composer.render();

  scene.traverse(restoreMaterial);
  finalComposer.render();
  // renderer.render(scene, camera);
};

animate();
