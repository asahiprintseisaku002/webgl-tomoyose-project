
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
import { Pane } from '../lib/tweakpane-4.0.3.min.js';

window.addEventListener('DOMContentLoaded', async () => {
  const wrapper = document.querySelector('#webgl');
  const app = new ThreeApp(wrapper);
  await app.load();
  app.init();
  app.render();
}, false);

class ThreeApp {
  static EARTH_RADIUS = 0.5;

  // @@@ 高さとピッチについての定数
  static MIN_HEIGHT = 0.6;
  static MAX_HEIGHT = 1.2;
  static MIN_PITCH = Math.PI * 0.5 - (Math.PI / 6);
  static MAX_PITCH = Math.PI * 0.5;

  /**
   * カメラ定義のための定数
   */
  static CAMERA_PARAM = {
    fovy: 60,
    aspect: window.innerWidth / window.innerHeight,
    near: 0.1,
    far: 50.0,
    position: new THREE.Vector3(0.0, 1.0, 3.0),
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
    color: 0xffffff,
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
  coneGeometry;       // コーンジオメトリ
  earth;              // 地球
  earthMaterial;      // 地球用マテリアル
  earthTexture;       // 地球用テクスチャ
  satellite;          // 人工衛星
  satelliteMaterial;  // 人工衛星用マテリアル
  satelliteInner;
  satelliteOuter;
  target;
  targetMaterial;
  time;
  height;
  pitch;

  satelliteWorld;
  targetWorld;
  toSatellite;
  toTarget;
  tangent;
  binormal;
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

    // リサイズイベント
    window.addEventListener('resize', () => {
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
    }, false);

    this.time = 0.0;
    this.height = ThreeApp.MIN_HEIGHT;
    this.pitch = ThreeApp.MIN_PITCH;

    const pane = new Pane();
    const PARAMS = {
      time: this.time,
      height: this.height,
      pitch: this.pitch,
    };
    pane.addBinding(PARAMS, 'time', {
      min: 0.0,
      max: 1.0,
    }).on('change', (v) => {
      this.setTime(v.value);
    });
    pane.addBinding(PARAMS, 'height', {
      min: ThreeApp.MIN_HEIGHT,
      max: ThreeApp.MAX_HEIGHT,
    }).on('change', (v) => {
      this.satelliteInner.position.y = v.value;
    });
    pane.addBinding(PARAMS, 'pitch', {
      min: ThreeApp.MIN_PITCH,
      max: ThreeApp.MAX_PITCH,
    }).on('change', (v) => {
      this.satellite.rotation.x = v.value;
    });
    pane.addButton({
      title: 'random',
    }).on('click', () => {
      this.randomizeTarget();
      this.setYaw();
      this.setTime(0.0);
    });
  }

  /**
   * アセット（素材）のロードを行う Promise
   */
  load() {
    return new Promise((resolve) => {
      const earthPath = './earth.jpg';
      const loader = new THREE.TextureLoader();
      loader.load(earthPath, (earthTexture) => {
        // 地球用
        this.earthTexture = earthTexture;
        resolve();
      });
    });
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
    this.sphereGeometry = new THREE.SphereGeometry(ThreeApp.EARTH_RADIUS, 32, 32);

    // 地球のマテリアルとメッシュ
    this.earthMaterial = new THREE.MeshPhongMaterial(ThreeApp.MATERIAL_PARAM);
    this.earthMaterial.map = this.earthTexture;
    this.earth = new THREE.Mesh(this.sphereGeometry, this.earthMaterial);
    this.scene.add(this.earth);

    // コーンのジオメトリを生成
    this.coneGeometry = new THREE.ConeGeometry(0.2, 0.5, 32);
    // 人工衛星のマテリアルとメッシュ
    this.satelliteMaterial = new THREE.MeshPhongMaterial({color: 0xff00dd});
    this.satellite = new THREE.Mesh(this.coneGeometry, this.satelliteMaterial);
    this.satellite.scale.setScalar(0.25);

    this.satelliteInner = new THREE.Group();
    this.satelliteOuter = new THREE.Group();
    this.scene.add(this.satelliteOuter);
    this.satelliteOuter.add(this.satelliteInner);
    this.satelliteInner.add(this.satellite);

    // satellite 自体でピッチは制御
    // 既定では頭を上に向けているので、X 軸回転で手前に倒す
    this.satellite.rotation.x = Math.PI * 0.5;
    // inner でヨーと高さを制御
    this.satelliteInner.position.set(0.0, 0.6, 0.0);
    // outer で軌道をたどるような回転させる

    // 目的地
    this.targetMaterial = new THREE.MeshPhongMaterial({color: 0x00ff00});
    this.target = new THREE.Mesh(this.sphereGeometry, this.targetMaterial);
    this.target.scale.setScalar(0.1);
    this.scene.add(this.target);
    this.randomizeTarget();
    this.setYaw();
    this.setTime(0.0);

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

  /**
   * 描画処理
   */
  render() {
    // 恒常ループ
    requestAnimationFrame(this.render);

    // コントロールを更新
    this.controls.update();

    // フラグに応じてオブジェクトの状態を変化させる
    if (this.isDown === true) {
      this.earth.rotation.y += 0.05;
    }

    // レンダラーで描画
    this.renderer.render(this.scene, this.camera);
  }

  randomizeTarget() {
    const targetPoint = new THREE.Vector3(
      Math.random() * 2.0 - 1.0,
      Math.random() * 2.0 - 1.0,
      Math.random() * 2.0 - 1.0,
    ).normalize();
    this.target.position.copy(targetPoint.multiplyScalar(ThreeApp.EARTH_RADIUS));
  }

  setYaw() {
    // inner のワールド空間での位置を取得 @@@
    this.satelliteWorld = this.satelliteInner.getWorldPosition(new THREE.Vector3());
    // inner の位置を単位化することで、原点からそれを指し示す向きベクトルを作る
    this.toSatellite = this.satelliteWorld.clone().normalize();
    // 目的地のワールド空間の位置を取得
    this.targetWorld = this.target.getWorldPosition(new THREE.Vector3());
    // 目的地の位置を単位化することで、原点からそれを指し示す向きベクトルを作る
    this.toTarget = this.targetWorld.clone().normalize();
    // inner 向きベクトルと、目的地向きベクトルで外積を取ると、両者に垂直なベクトル（接線ベクトル）が出てくる
    this.tangent = new THREE.Vector3().crossVectors(this.toSatellite, this.toTarget).normalize();
    // 接線ベクトルと inner 向きベクトルとで外積を取ると、両者に垂直なベクトル（従法線ベクトル）が出てくる
    this.binormal = new THREE.Vector3().crossVectors(this.tangent, this.toSatellite).normalize();

    // 上記で算出した従法線ベクトルは、satellite が頭を向けるべき正面方向とみなせるベクトルなので……
    // 現在の satellite のワールド空間の位置に、従法線を足した座標を算出し、そこに向かって lookAt する
    const lookAtPoint = new THREE.Vector3().addVectors(this.satelliteWorld, this.binormal);
    // ここで satellite が頭を目的方向へ向ける
    this.satelliteInner.lookAt(lookAtPoint);

    // いま現在の outer の状態は、setTime するときに必要になるのでプロパティに保持しておく
    this.baseQuaternion = this.satelliteOuter.quaternion.clone();
  }

  setTime(time) {
    this.time = time;
    const dot = this.toSatellite.dot(this.toTarget);
    const radians = Math.acos(dot) * this.time;
    // setTime が呼び出された時点で、少なくとも一度は setYaw が呼び出されているので…… @@@
    // this.tangent には、接線ベクトルが必ず代入されているはずなので、これを使って outer の回転を行う
    const q = new THREE.Quaternion().setFromAxisAngle(this.tangent, radians);
    // 今現在の outer のクォータニオンに、上記で求めたクォータニオンの回転を加味させる
    const rotation = this.baseQuaternion.clone().premultiply(q);
    // outer のクォータニオンを更新
    this.satelliteOuter.quaternion.copy(rotation);

    // 時間の値をそのまま 0.0 ～ 1.0 の線形な値として使うのではなく sin を使う @@@
    const sin = Math.sin(this.time * Math.PI);

    // 設定された時間に応じて、自動的に高さとピッチを設定する @@@
    const heightRange = ThreeApp.MAX_HEIGHT - ThreeApp.MIN_HEIGHT;
    const currentHeight = ThreeApp.MIN_HEIGHT + heightRange * sin;
    this.setHeight(currentHeight);
    const pitchRange = ThreeApp.MAX_PITCH - ThreeApp.MIN_PITCH;
    const currentPitch = ThreeApp.MIN_PITCH + pitchRange * sin;
    this.setPitch(currentPitch);
  }

  setHeight(height) {
    // 高さを設定
    this.height = height;
    this.satelliteInner.position.y = this.height;
  }

  setPitch(pitch) {
    // ピッチを設定
    this.pitch = pitch;
    this.satellite.rotation.x = this.pitch;
  }
}
