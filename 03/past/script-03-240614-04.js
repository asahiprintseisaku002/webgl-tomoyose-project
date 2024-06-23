
// = 023 ======================================================================
// 注意：これはオマケのサンプルです！
// クォータニオンや、ベクトルの内積・外積などが登場しますので、かなり数学的に難
// しい内容となっています。このサンプルはあくまでもオマケです。
// 一見して意味がわからなくても気に病む必要はまったくありませんので、あまり過度
// に落ち込んだり心配したりしないようにしてください。
// このサンプルでは、人工衛星を三角錐で作られたロケットに置き換え、進行方向にき
// ちんと頭を向けるようにしています。
// 内積や外積といったベクトル演算は、実際にどのような使いみちがあるのかわかりに
// くかったりもするので、このサンプルを通じて雰囲気だけでも掴んでおくと、いつか
// 自分でなにか特殊な挙動を実現したい、となったときにヒントになるかもしれません。
// 内積・外積だけでもかなりいろんなことが実現できますので、絶対に損はしません。
// ============================================================================

// 必要なモジュールを読み込み
import * as THREE from '../lib/three.module.js';
import { OrbitControls } from '../lib/OrbitControls.js';

window.addEventListener('DOMContentLoaded', /*async*/ () => {
  const wrapper = document.querySelector('#webgl');
  const app = new ThreeApp(wrapper);
  //await app.load();
  app.init();
  app.render();
}, false);

class ThreeApp {
  /**
   * 月に掛けるスケール
   */
  static MOON_SCALE = 0.5;
  /**
   * 月と地球の間の距離
   */
  static MOON_DISTANCE = 1.2;
  /**
   * 人工衛星の移動速度
   */
  static SATELLITE_SPEED = 0.05;
  /**
   * 人工衛星の曲がる力
   */
  static SATELLITE_TURN_SCALE = 0.1;
  /**
   * カメラ定義のための定数
   */
  static CAMERA_PARAM = {
    fovy: 60,
    aspect: window.innerWidth / window.innerHeight,
    near: 0.1,
    far: 50.0,
    position: new THREE.Vector3(0.0, 2.0, 7.0),
    lookAt: new THREE.Vector3(0.0, 0.0, 0.0),
  };
  /**
   * レンダラー定義のための定数
   */
  static RENDERER_PARAM = {
    clearColor: 0xffffff,
    width: window.innerWidth,
    height: window.innerHeight,
  };
  /**
   * 平行光源定義のための定数
   */
  static DIRECTIONAL_LIGHT_PARAM = {
    color: 0xffffff,
    intensity: 1.0,
    position: new THREE.Vector3(1.0, 1.0, 1.0),
  };
  /**
   * アンビエントライト定義のための定数
   */
  static AMBIENT_LIGHT_PARAM = {
    color: 0xffffff,
    intensity: 0.3,
  };
  /**
   * マテリアル定義のための定数
   */
  static MATERIAL_PARAM = {
    color: 0x19a8e7,
  };

  static MATERIAL_PARAM2 = {
    color: 0xc9c9c9,
  };
  /**
   * フォグの定義のための定数
   */
  static FOG_PARAM = {
    color: 0xffffff,
    near: 10.0,
    far: 20.0,
  };

  wrapper;            // canvas の親要素
  renderer;           // レンダラ
  scene;              // シーン
  camera;             // カメラ
  directionalLight;   // 平行光源（ディレクショナルライト）
  ambientLight;       // 環境光（アンビエントライト）
  controls;           // オービットコントロール
  axesHelper;         // 軸ヘルパー
  isDown;             // キーの押下状態用フラグ
  clock;              // 時間管理用
  sphereGeometry;     // ジオメトリ
  coneGeometry;       // コーンジオメトリ @@@
  earth;              // 地球
  earthMaterial;      // 地球用マテリアル
  earthTexture;       // 地球用テクスチャ
  moon;               // 月
  moonMaterial;       // 月用マテリアル
  moonTexture;        // 月用テクスチャ
  satellite;          // 人工衛星
  satelliteMaterial;  // 人工衛星用マテリアル
  satelliteDirection; // 人工衛星の進行方向
  group;
  startTime;
  raycaster;
  mouse;
  startPoint;
  endPoint;
  intersects;
  point;
  direction;
  distance;
  moveDuration;

  /**
   * コンストラクタ
   * @constructor
   * @param {HTMLElement} wrapper - canvas 要素を append する親要素
   */
  constructor(wrapper) {
    // 初期化時に canvas を append できるようにプロパティに保持
    this.wrapper = wrapper;

    // 再帰呼び出しのための this 固定
    this.render = this.render.bind(this);

    this.moveDuration = 2000; // 移動時間を 2000 ミリ秒とする

    // キーの押下や離す操作を検出できるようにする
    window.addEventListener('keydown', (keyEvent) => {
      switch (keyEvent.key) {
        case ' ':
          this.isDown = true;
          break;
        default:
      }
    }, false);
    window.addEventListener('keyup', (keyEvent) => {
      this.isDown = false;
    }, false);

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    window.addEventListener('click', (event)=>{
      this.mouse.x = (event.clientX / window.innerWidth) * 2 -1;
      this.mouse.y = (event.clientY / window.innerHeight) * 2 -1;

      this.raycaster.setFromCamera(this.mouse, this.camera);

      const intersects = this.raycaster.intersectObject(this.earth);

      if(intersects.length > 0) {
        const point = intersects[0].point;
        if(!this.startPoint){
          this.startPoint = point;
        } else if (!this.endPoint){
          this.endPoint = point;
          moveMoon(this.startPoint, this.endPoint);
        }
      }
    });

    this.startPoint = null;
    this.endPoint = null;

    function moveMoon(start, end) {
      this.direction = new THREE.Vector3().subVectors(end, start).normalize();
      this.distance = start.distanceTo(end);
      this.moveDuration = 2000;
      this.startTime = Date.now();
      this.startPoint = start;
      this.endPoint = end;
      this.animate(); // animate 関数をここで呼び出す
    }
      
    // リサイズイベント
    window.addEventListener('resize', () => {
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
    }, false);
  }

  // animate メソッドをクラスのメソッドとして定義
  animate() {
    const elapsedTime = Date.now() - this.startTime;
    const fraction = elapsedTime / this.moveDuration;

    if (fraction < 1) {
      // moon を始点から終点に向かって移動させます。
      this.moon.position.lerpVectors(this.startPoint, this.endPoint, fraction);
      requestAnimationFrame(() => this.animate()); // アロー関数を使用して this のコンテキストを保持
    } else {
      // 移動を完了させます。
      this.moon.position.copy(this.endPoint);
      this.startPoint = null;
      this.endPoint = null;
    }
  }
  
  init() {
    // レンダラー
    const color = new THREE.Color(ThreeApp.RENDERER_PARAM.clearColor);
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setClearColor(color);
    this.renderer.setSize(ThreeApp.RENDERER_PARAM.width, ThreeApp.RENDERER_PARAM.height);
    this.wrapper.appendChild(this.renderer.domElement);

    // シーン
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(
      ThreeApp.FOG_PARAM.color,
      ThreeApp.FOG_PARAM.near,
      ThreeApp.FOG_PARAM.far
    );

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

    // 球体のジオメトリを生成
    this.sphereGeometry = new THREE.SphereGeometry(0.5, 32, 32);

    // コーンのジオメトリを生成 @@@
    this.coneGeometry = new THREE.ConeGeometry(0.2, 0.5, 3);

    // 地球のマテリアルとメッシュ
    this.earthMaterial = new THREE.MeshPhongMaterial(ThreeApp.MATERIAL_PARAM);
    //this.earthMaterial.map = this.earthTexture;
    this.earth = new THREE.Mesh(this.sphereGeometry, this.earthMaterial);
    this.scene.add(this.earth);
    
    // 月のマテリアルとメッシュ
    this.moonMaterial = new THREE.MeshPhongMaterial(ThreeApp.MATERIAL_PARAM2);
    //this.moonMaterial.map = this.moonTexture;
    this.moon = new THREE.Mesh(this.coneGeometry, this.moonMaterial);
    this.scene.add(this.moon);
    // 月はやや小さくして、さらに位置も動かす
    this.moon.scale.setScalar(ThreeApp.MOON_SCALE);
    //this.moon.position.set(0, 1, 0);

    const group =new THREE.Group();
    this.scene.add(group);

    // コントロール
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    // ヘルパー
    const axesBarLength = 5.0;
    this.axesHelper = new THREE.AxesHelper(axesBarLength);
    this.scene.add(this.axesHelper);

    // キーの押下状態を保持するフラグ
    this.isDown = false;

    // Clock オブジェクトの生成
    this.clock = new THREE.Clock();

  }

  render() {
    // 恒常ループ
    requestAnimationFrame(this.render);
    
    // animate メソッドを呼び出す際に、適切な引数を渡す
    if (this.startPoint && this.endPoint) {
      this.animate(this.startPoint, this.endPoint, 2000); // 例えば、移動時間を 2000 ミリ秒とする
    }

    // コントロールを更新
    this.controls.update();

    //this.earth.rotation.y += 0.01;

    // レンダラーで描画
    this.renderer.render(this.scene, this.camera);
  }
}
