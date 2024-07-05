//
//
//
//
//
//

import * as THREE from '../lib/three.module.js';
import { OrbitControls } from '../lib/OrbitControls.js';
import { SVGLoader } from '../lib/SVGLoader.js';
import { GLTFLoader } from '../lib/GLTFLoader.js';

window.addEventListener('DOMContentLoaded', /*async*/ () => {
  const wrapper = document.querySelector('#webgl');
  const app = new ThreeApp(wrapper);
  //await app.load();
  app.init();
  app.render();
}, false);

class ThreeApp {
  /**
   * カメラ定義のための定数
   */
  static CAMERA_PARAM = {
    fovy: 60,
    aspect: window.innerWidth / window.innerHeight,
    near: 0.1,
    far: 300.0,
    position: new THREE.Vector3(0.0, 2.0, 20.0),
    lookAt: new THREE.Vector3(0.0, 0.0, 0.0),
  };
  /**
   * レンダラー定義のための定数
   */
  static RENDERER_PARAM = {
    clearColor: 0x0b0b0b, // パーティクルが目立つように背景は黒に @@@
    width: window.innerWidth,
    height: window.innerHeight,
  };
  /**
   * マテリアル定義のための定数（パーティクル用） @@@
   */
  static MATERIAL_PARAM = {
    color: 0xffffff,      // パーティクルの色
    size: 0.25,           // 基準となるサイズ
    sizeAttenuation: true // 遠近感を出すかどうかの真偽値
  };

  static MATERIAL_PARAM2 = {
    color: 0xb0b0b0,
    side: THREE.DoubleSide,
    transparent: true
  }

  //ライト
  static DIRECTIONAL_LIGHT_PARAM = {
    color: 0xffffff,
    intensity: 1.0,
    position: new THREE.Vector3(1.0, 1.0, 1.0),
  };

  static AMBIENT_LIGHT_PARAM = {
    color: 0xffffff,
    intensity: 0.1,
  };
  //ライトここまで

  static INTERSECTION_MATERIAL_PARAM = {
    color: 0x00ffff,
  };

  wrapper;          // canvas の親要素
  renderer;         // レンダラ
  scene;            // シーン
  camera;           // カメラ
  geometry;         // ジオメトリ
  material;         // マテリアル
  plane;
  planes;
  planeGroup;
  planeGeometry;
  planeMaretial;
  planeMaretials;
  texture;
  points;           // パーティクルの実態（点群のメッシュに相当） @@@
  controls;         // オービットコントロール
  axesHelper;       // 軸ヘルパー
  svg;
  svgLoader;
  svgGroup;
  gltfLoader;
  gltfs;
  imageLoader;
  images;
  originalplane;
  moon;
  moonplane;
  star;
  starplane;
  diamond;
  diamondplane;
  raycaster;
  hitMaterial;
  currentGeometryIndex;
  mouse;
  elapsed;
  startTime;
  t;
  vertices;
  initialX;
  initialY;
  initialZ;
  deg;
  dist;
  x;
  y;
  radius;
  spikes;
  starVertices;

  /**
   * コンストラクタ
   * @constructor
   * @param {HTMLElement} wrapper - canvas 要素を append する親要素
   */
  constructor(wrapper) {
    // 初期化時に canvas を append できるようにプロパティに保持
    this.wrapper = wrapper;

    // this のバインド
    this.render = this.render.bind(this);
    
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    
    // マウスオーバーイベント
    window.addEventListener('mousemove', (mouseEvent) => {
      const x = mouseEvent.clientX / window.innerWidth * 2.0 - 1.0;
      const y = mouseEvent.clientY / window.innerHeight * 2.0 - 1.0;
      const v = new THREE.Vector2(x, -y);
      this.raycaster.setFromCamera(v, this.camera);
      const intersects = this.raycaster.intersectObjects(this.planes);
    
      // 全てのplaneを元の色に戻す
      for (let i = 0; i < this.planes.length; i++){
        this.planes[i].material.color.set(0xffffff);
      }
    
      // マウスオーバーしたplaneを赤くする
      if (intersects.length > 0) {
        intersects[0].object.material.color.set(0xff0000);
      }
    }, false);
    
    // クリックイベント
    window.addEventListener('click', (mouseEvent) => {
      const x = mouseEvent.clientX / window.innerWidth * 2.0 - 1.0;
      const y = mouseEvent.clientY / window.innerHeight * 2.0 - 1.0;
      const v = new THREE.Vector2(x, -y);
      this.raycaster.setFromCamera(v, this.camera);
      const intersects = this.raycaster.intersectObjects(this.planes);
    
      // クリックしたplaneを黄色くする
      if (intersects.length > 0 && intersects[0].object.material.color.getHex() === 0xff0000) {
        intersects[0].object.material.color.set(0xffff00);
        // パーティクルのジオメトリを更新
        const clickedPlane = intersects[0].object;
        let geometryIndex;
        if (clickedPlane === this.moonplane) {
          geometryIndex = 1;
        } else if (clickedPlane === this.starplane) {
          geometryIndex = 2;
        } else if (clickedPlane === this.diamondplane) {
          geometryIndex = 3;
        }
        this.points.geometry = this.geometries[geometryIndex];
      }  else {
        // plane以外の場所がクリックされた場合、パーティクルを初期状態に戻す
        this.points.geometry = this.geometries[0];
      }
    }, false);

    // ウィンドウのリサイズを検出できるようにする
    window.addEventListener('resize', () => {
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
    }, false);
  }

  /**
   * 初期化処理
   */
  init() {
    // レンダラー
    const color = new THREE.Color(ThreeApp.RENDERER_PARAM.clearColor);
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setClearColor(color);
    this.renderer.setSize(ThreeApp.RENDERER_PARAM.width, ThreeApp.RENDERER_PARAM.height);
    this.wrapper.appendChild(this.renderer.domElement);

    // シーン
    this.scene = new THREE.Scene();

    // カメラ
    this.camera = new THREE.PerspectiveCamera(
      ThreeApp.CAMERA_PARAM.fovy,
      ThreeApp.CAMERA_PARAM.aspect,
      ThreeApp.CAMERA_PARAM.near,
      ThreeApp.CAMERA_PARAM.far,
    );
    this.camera.position.copy(ThreeApp.CAMERA_PARAM.position);
    this.camera.lookAt(ThreeApp.CAMERA_PARAM.lookAt);

    // ディレクショナルライト（平行光源）
    this.directionalLight = new THREE.DirectionalLight(
      ThreeApp.DIRECTIONAL_LIGHT_PARAM.color,
      ThreeApp.DIRECTIONAL_LIGHT_PARAM.intensity
    );
    this.directionalLight.position.copy(ThreeApp.DIRECTIONAL_LIGHT_PARAM.position);
    this.scene.add(this.directionalLight);

    // アンビエントライト（環境光）
    this.ambientLight = new THREE.AmbientLight(
      ThreeApp.AMBIENT_LIGHT_PARAM.color,
      ThreeApp.AMBIENT_LIGHT_PARAM.intensity,
    );
    this.scene.add(this.ambientLight);

    // 交差時に表示するためのマテリアルを定義 @@@
    this.hitMaterial = new THREE.MeshPhongMaterial(ThreeApp.INTERSECTION_MATERIAL_PARAM);
    this.hitMaterial.map = this.texture;

    this.planes = [];
    this.planeMaretials = [];
    this.planeGeometry = new THREE.PlaneGeometry(1, 1);

    for (let i = 1; i < 4; i++){
      this.planeMaretial = new THREE.MeshBasicMaterial(ThreeApp.MATERIAL_PARAM2);
      this.plane = new THREE.Mesh(this.planeGeometry, this.planeMaretial);
      this.plane.position.x = i * 2 - 4;
      this.plane.position.y = -5;
      this.plane.position.z = 10;
      this.planes.push(this.plane);
      this.planeMaretials.push(this.planeMaretial);
      this.scene.add(this.plane);
      //if (i === 0) this.originalplane = this.plane;
      if (i === 1) this.moonplane = this.plane;
      else if (i === 2) this.starplane = this.plane;
      else if (i === 3) this.diamondplane = this.plane;
    }

    this.images = ['./moon.svg', './star.svg', './diamond.svg'];

    for (let i = 0; i < 3; i++) {
      const image = new Image();
      image.src = this.images[i];
      image.onload = function() {
        const texture = new THREE.Texture(image);
        texture.needsUpdate = true;
        this.planeMaretials[i].map = texture;
        this.planeMaretials[i].needsUpdate = true;
      }.bind(this);
    }
    

    // パーティクル用のマテリアル
    this.material = new THREE.PointsMaterial(ThreeApp.MATERIAL_PARAM);

    // パーティクルの定義
    this.geometries = []; // 複数のジオメトリを格納する配列
    const COUNT = 10;    // パーティクルの行と列のカウント数
    const WIDTH = 10.0;  // どの程度の範囲に配置するかの幅

    // 3つの異なる形状のジオメトリを作成
    for (let g = 0; g < 4; ++g) {
      const vertices = []; // 頂点情報を格納する配列
      for (let i = 0; i <= COUNT; ++i) {
        const x = (i / COUNT - 0.5) * WIDTH;
        for(let j = 0; j <= COUNT; ++j){
          const y = (j / COUNT - 0.5) * WIDTH;
          let z;
          if (g === 0) {
            // 形状1
            z = 0.0;
          } else if (g === 1) {
            // 形状2
            z = (j / COUNT - 0.5) * WIDTH;
          } else if (g === 2) {
            // 形状3
            z = Math.sin(j / COUNT * Math.PI) * WIDTH;
          } else {
            // 形状4
            z = Math.cos(j / COUNT * Math.PI) * WIDTH;
          }
          vertices.push(x, y, z);
        }
      }
      const stride = 3;
      const geometry = new THREE.BufferGeometry();
      const attribute = new THREE.BufferAttribute(new Float32Array(vertices), stride);
      geometry.setAttribute('position', attribute);
      this.geometries.push(geometry);
    }

    // 最初のジオメトリでパーティクルを作成
    this.points = new THREE.Points(this.geometries[0], this.material); 
    this.scene.add(this.points);

    // 軸ヘルパー
    const axesBarLength = 20.0;
    this.axesHelper = new THREE.AxesHelper(axesBarLength);
    this.scene.add(this.axesHelper);

    // コントロール
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

  }
  

  /**
   * 描画処理
   */
  render() {
    // 恒常ループ
    requestAnimationFrame(this.render);

    // コントロールを更新
    this.controls.update();

    // レンダラーで描画
    this.renderer.render(this.scene, this.camera);
  }
}
