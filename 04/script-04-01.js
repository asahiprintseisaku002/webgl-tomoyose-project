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

window.addEventListener('DOMContentLoaded', async () => {
  const wrapper = document.querySelector('#webgl');
  const app = new ThreeApp(wrapper);
  await app.load();
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

  wrapper;          // canvas の親要素
  renderer;         // レンダラ
  scene;            // シーン
  camera;           // カメラ
  geometry;         // ジオメトリ
  material;         // マテリアル
  points;           // パーティクルの実態（点群のメッシュに相当） @@@
  controls;         // オービットコントロール
  axesHelper;       // 軸ヘルパー
  svg;
  loader;
  moon;
  star;
  diamond;

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

    // パーティクル用のマテリアル @@@
    this.material = new THREE.PointsMaterial(ThreeApp.MATERIAL_PARAM);

    // パーティクルの定義 @@@
    this.geometry = new THREE.BufferGeometry(); // 特定の形状を持たないジオメトリ
    const COUNT = 10;    // パーティクルの行と列のカウント数
    const WIDTH = 10.0;  // どの程度の範囲に配置するかの幅
    const vertices = []; // まず頂点情報を格納する単なる配列（Array）
    for (let i = 0; i <= COUNT; ++i) {
      // カウンタ変数 i から X 座標を算出
      const x = (i / COUNT - 0.5) * WIDTH;
      for(let j = 0; j <= COUNT; ++j){
        // カウンタ変数 j から Y 座標を算出
        const y = (j / COUNT - 0.5) * WIDTH;
        // 配列に頂点を加える
        vertices.push(x, y, 0.0);
      }
    }

    // この頂点情報がいくつの要素からなるか（XYZ なので、３を指定）
    const stride = 3;

    const attribute = new THREE.BufferAttribute(new Float32Array(vertices), stride);
    this.geometry.setAttribute('position', attribute);
    this.points = new THREE.Points(this.geometry, this.material);
   
    this.scene.add(this.points);

    this.scene.add(this.gltf.scene);

    // 軸ヘルパー
    const axesBarLength = 20.0;
    this.axesHelper = new THREE.AxesHelper(axesBarLength);
    this.scene.add(this.axesHelper);

    // コントロール
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

  }

  load() {
    const paths = ['./moon.glb', './star.glb', './diamond.glb'];
    return Promise.all(paths.map((path, index) => this.loadModel(path, index)));
  }
  
  loadModel(path, index) {
    return new Promise((resolve) => {
      const loader = new GLTFLoader();
      loader.load(path, (gltf) => {
        // モデルの位置を設定
        gltf.scene.position.x = index * 2; // 2はモデル間の距離を表します。必要に応じて調整してください。
  
        // あとで使えるようにプロパティに代入しておく
        this.gltf = gltf;
        resolve();
      });
    });
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
