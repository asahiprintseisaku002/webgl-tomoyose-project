//
//
//
//
//
// 必要なモジュールを読み込み
import * as THREE from '../lib/three.module.js';
import { OrbitControls } from '../lib/OrbitControls.js';
import { Pane } from '../lib/tweakpane-4.0.3.min.js';

window.addEventListener('DOMContentLoaded', /*async*/ () => {
  const wrapper = document.querySelector('#webgl');
  const app = new ThreeApp(wrapper);
  //await app.load();
  app.init();
  app.render();
}, false);

class ThreeApp {
  static EARTH_RADIUS = 0.5;

  static MOON_SCALE = 0.5;

  static MOON_DISTANCE = 1.2;

  static MIN_HEIGHT = 1.7;
  static MAX_HEIGHT = 3;
  static MIN_PITCH = Math.PI * 0.5 - (Math.PI / 6);
  static MAX_PITCH = Math.PI * 0.5;
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

  static ORTHOCAMERA_PARAM = {
    left:2,
    light:-2,
    top:2,
    bottom:-2,
    near:0.1,
    far:50.0
  };

  /**
   * レンダラー定義のための定数
   */
  static RENDERER_PARAM = {
    clearColor: 0xfc375b,
    width: window.innerWidth,
    height: window.innerHeight,
  };
  /**
   * 平行光源定義のための定数
   */
  static DIRECTIONAL_LIGHT_PARAM = {
    color: 0xffffff,
    intensity: 2.0,
    position: new THREE.Vector3(1.0, 1.0, 1.0),
  };

  static DIRECTIONAL_LIGHT_PARAM2 = {
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
    color: 0xe1ff1c,
    transparent: true,
    opacity: 0.7
  };

  static MATERIAL_PARAM2 = {
    color: 0x07f1ff,
    emissive: 0x07f1ff,
  };

  static MATERIAL_PARAM3 = {
    color: 0x5b3df1,
    transparent: true,
    opacity: 0.7
  };

  static MATERIAL_PARAM4 = {
    color: 0xe728ff,
  };

  /**
   * フォグの定義のための定数
   */
  static FOG_PARAM = {
    color: 0xfc375b,
    near: 20.0,
    far: 50.0,
  };

    // Boxを配置する関数
    placeRandomBoxes() {
    const earthRadius = 1.5; // Earthの半径
    for (let i = 0; i < 200; i++) {
        // ランダムな位置を生成
        const theta = Math.random() * Math.PI * 2; // 経度
        const phi = Math.acos((Math.random() * 2) - 1); // 緯度

        // 球面座標系から直交座標系への変換
        const x = earthRadius * Math.sin(phi) * Math.cos(theta);
        const y = earthRadius * Math.sin(phi) * Math.sin(theta);
        const z = earthRadius * Math.cos(phi);

        // Boxのジオメトリとマテリアルを作成
    // 高さはランダムに0.05から0.15の間
        const boxHeightX = Math.random() * 0.2 + 0.05;
        const boxHeightY = Math.random() * 0.2 + 0.05;
        const boxHeightZ = Math.random() * 1.3 + 0.05;
        const boxGeometry = new THREE.BoxGeometry(boxHeightX, boxHeightY, boxHeightZ);
        const boxMaterial = new THREE.MeshPhongMaterial(ThreeApp.MATERIAL_PARAM);

        // Boxメッシュを作成
        const box = new THREE.Mesh(boxGeometry, boxMaterial);

        // BoxをEarthの表面に配置
        box.position.set(x, y, z);
        box.lookAt(new THREE.Vector3(0, 0, 0)); // BoxがEarthの中心を向くようにする

        // Boxをシーンに追加
        this.scene.add(box);
        }
    }

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
  coneGeometry;
  coneGeometry2;       // コーンジオメトリ
  earth;              // 地球
  earthMaterial;      // 地球用マテリアル
  earthTexture;       // 地球用テクスチャ
  moon;               // 月
  moonDirection;
  moonMaterial;       // 月用マテリアル
  moonTexture;        // 月用テクスチャ
  satellite;          // 人工衛星
  satelliteMaterial;  // 人工衛星用マテリアル
  //satelliteDirection; // 人工衛星の進行方向
  group;
  group2;
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
  markerGeometry;     // マーカージオメトリ
  markerMaterial;     // マーカーマテリアル
  startMarker;        // 始点マーカー
  endMarker;          // 終点マーカー
  target;
  targetMaterial;
  targetWorld;
  toTarget;
  isStartPointSet;    // 始点が設定されているかのフラグ
  animationId;        // アニメーションID
  isAnimating;
  rect;
  angle;
  clickState;
  quaternion;
  initialCameraPosition;
  initialLookAtPosition;
  satelliteInner;
  satelliteOuter;
  satelliteWorid;
  toSatellite;

  time;
  height;
  pitch;
  time;

  tangent;
  binomal;
  baseQuaternion;

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

    this.mouse = new THREE.Vector2();
    this.raycaster = new THREE.Raycaster();
    this.angle = 0;
    this.clickState = 0;
    this.initialCameraPosition = ThreeApp.CAMERA_PARAM.position.clone();
    this.initialLookAtPosition = ThreeApp.CAMERA_PARAM.lookAt.clone();

    // マウスカーソルの動きを検出できるようにする
    window.addEventListener('pointermove', (pointerEvent) => {
      // ポインター（マウスカーソル）のクライアント領域上の座標
      const pointerX = pointerEvent.clientX;
      const pointerY = pointerEvent.clientY;
      // 3D のワールド空間に合わせてスケールを揃える
      const scaleX = pointerX / window.innerWidth * 2.0 - 1.0;
      const scaleY = pointerY / window.innerHeight * 2.0 - 1.0;
      // ベクトルを単位化する
      const vector = new THREE.Vector2(
        scaleX,
        scaleY,
      );
      vector.normalize();
      // スケールを揃えた値を月の座標に割り当てる
      /*
      this.moon.position.set(
        vector.x * ThreeApp.MOON_DISTANCE * 3,
        0.0,
        vector.y * ThreeApp.MOON_DISTANCE * 3,
      );
      */
    }, false);

    // マウスの動きを追跡するイベントリスナーを設定
    window.addEventListener('mousemove', (event) => {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        this.angle = Math.atan2(this.mouse.y, this.mouse.x);
    }, false);

    // リサイズイベント
    window.addEventListener('resize', () => {
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
    }, false);

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
    this.sphereGeometry = new THREE.SphereGeometry(1.5, 32, 32);
    this.sphereGeometry2 = new THREE.SphereGeometry(1.5, 32, 32);

    // コーンのジオメトリを生成 @@@
    this.coneGeometry = new THREE.ConeGeometry(0.2, 0.5, 3);

    // 地球のマテリアルとメッシュ
    this.earthMaterial = new THREE.MeshPhongMaterial(ThreeApp.MATERIAL_PARAM);
    this.earth = new THREE.Mesh(this.sphereGeometry, this.earthMaterial);
    this.scene.add(this.earth);
    /*
    this.pointMaterial = new THREE.MeshPhongMaterial(ThreeApp.MATERIAL_PARAM4);
    this.point = new THREE.Mesh(this.sphereGeometry2, this.pointMaterial);
    this.scene.add(this.point);
    */
    this.moonMaterial = new THREE. MeshPhongMaterial(ThreeApp.MATERIAL_PARAM2);
    this.moon = new THREE.Mesh(this.coneGeometry, this.moonMaterial);
    this.scene.add(this.moon);
    this.moon.position.set(0.0, ThreeApp.MOON_DISTANCE * 2, 0.0);
    this.moon.rotation.z = -Math.PI / 2;
    this.moonDirection = new THREE.Vector3(1.0, 1.0, 0.0).normalize();

    this.coneGeometry2 = new THREE.ConeGeometry(0.1, 0.2, 6);
    this.satelliteMaterial2 = new THREE.MeshPhongMaterial(ThreeApp.MATERIAL_PARAM4);
    this.satellite2 = new THREE.Mesh(this.coneGeometry2, this.satelliteMaterial2 );
    this.satellite2.position.set(0.0, 3.0, 0.0);
    this.satellite2.rotation.x = Math.PI;
    this.scene.add(this.satellite2);
    
    this.group2 = new THREE.Group();
    this.group2.add(this.satellite2);
    this.group2.position.set(0.0, 0.0, 0.0);
    this.scene.add(this.group2);
    this.group2Direction = new THREE.Vector3(0.0, -1.0, 0.0).normalize();
    

    this.moonGroup = new THREE.Group();
    this.moonGroup.add(this.moon);
    this.scene.add(this.moonGroup);
    this.moonGroup.position.set(0.0, 0.0, 0.0);

    // コントロール
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    // ヘルパー
    const axesBarLength = 20.0;
    this.axesHelper = new THREE.AxesHelper(axesBarLength);
    this.scene.add(this.axesHelper);
    
    // キーの押下状態を保持するフラグ
    this.isDown = false;

     // レイキャスターとマウスの初期化
     this.raycaster = new THREE.Raycaster();
     this.mouse = new THREE.Vector2();
     this.isStartPointSet = false;
     this.isAnimating = false;

     this.clock = new THREE.Clock();

     this.satellite2Direction = new THREE.Vector3(0.0, -1.0, 0.0).normalize();
   }
  
  
  render() {
    
    const time = this.clock.getElapsedTime() / 2;
    const sin = Math.sin(time);
    const cos = Math.cos(time);
    
    /*
    const previousDirection = this.satellite2Direction.clone();
    //const subVector = new THREE.Vector3().subVectors(this.moonGroup.position, this.satellite2.position);
    //subVector.normalize();
    
    const normalAxis = new THREE.Vector3().crossVectors(this.moonGroup.position, this.satellite2Direction);
    normalAxis.normalize();
    const cos = previousDirection.dot(this.satellite2Direction);
    const radians = Math.acos(cos);
    const qtn = new THREE.Quaternion().setFromAxisAngle(normalAxis, radians);
    this.satellite2.quaternion.premultiply(qtn);
    */    

    // 恒常ループ
    requestAnimationFrame(this.render);

    // コントロールを更新
    this.controls.update();

    this.moonGroup.rotation.z -= 0.01;
    const moonPosition = this.moonGroup.position.clone().add(this.moon.position);
    const group2Position = this.group2.position;
    const moonPositionInGroup2 = moonPosition.clone().sub(group2Position);
    this.satellite2.lookAt(moonPositionInGroup2);

    //this.group2.rotation.x -= 0.01;
    //this.group2.position.set(0.0, 3.0, 0.0);

    //this.group2.rotation.x = this.angle;
    //this.group2.rotation.x = this.angle * Math.PI;
    //マウスの動きに追従
    //this.group2.rotation.z = this.angle * Math.PI;

    // レンダラーで描画
    this.renderer.render(this.scene, this.camera);
  }

}
