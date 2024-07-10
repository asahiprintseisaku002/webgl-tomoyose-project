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

    window.addEventListener('mousemove', (event) => {
        // マウスの位置を正規化します（-1から+1の範囲）。
        this.rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x =  (event.clientX - this.rect.left) / this.rect.width  * 2 - 1;
        this.mouse.y = -(event.clientY - this.rect.top) / this.rect.height * 2 + 1;
        this.angle = Math.atan2(this.mouse.y, this.mouse.x);
      }, false);
      /*
    // キーの押下や離す操作を検出できるようにする
    window.addEventListener('keydown', (keyEvent) => {
        switch (keyEvent.key) {
        case ' ':
         
            if (this.isDown) {
            // スペースキーが離されたときにカメラの位置と向きを元に戻す
            this.camera.position.copy(this.initialCameraPosition);
            this.camera.lookAt(this.initialLookAtPosition);
            this.isDown = false;
    
            } else {
                if (this.satellite) {
                    this.camera.position.copy(this.satellite.position); // カメラを月の位置に移動
                    this.camera.lookAt(this.endPoint); // カメラを終点に向ける
                    this.isDown = true;
                }
            }
          
            break;
        default:
        }
      
    }, false);

    // クリックの回数を保持する変数
    this.clickCount = 0;

    // クリックイベントのリスナー
    window.addEventListener('click', () => {
    this.clickCount++;

    // クリックの回数に応じてテキストを更新
    if (this.clickCount === 1) {
        document.getElementById('instruction').innerHTML = '2回目のクリックで終点を設定';
    } else if (this.clickCount === 2) {
        document.getElementById('instruction').innerHTML = 'スペースキーで視点の切り替え';
    }
    });
      */
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
        pitch: this.pitch 
    };
    pane.addBinding(PARAMS, 'time',{
        min: 0.0,
        max: 1.0,
    }).on('change', (v) =>{
        this.setTime(v.value);
    });
    pane.addBinding(PARAMS, 'height', {
        min: this.height,
        max: this.height * 2.0,
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
    pane.addButton({
        title: 'GO!'
    }).on('click', ()=>{
        this.setTime(0.0);
        this.setHeight(1.5);
        this.setPitch(Math.PI / 6);
        this.startAnimation();
    });

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

    // ディレクショナルライト（平行光源）
    this.directionalLight2 = new THREE.DirectionalLight(
        ThreeApp.DIRECTIONAL_LIGHT_PARAM2.color,
        ThreeApp.DIRECTIONAL_LIGHT_PARAM2.intensity
        );
        this.directionalLight2.position.copy(ThreeApp.DIRECTIONAL_LIGHT_PARAM.position);
        this.scene.add(this.directionalLight2);

    // アンビエントライト（環境光）
    this.ambientLight = new THREE.AmbientLight(
      ThreeApp.AMBIENT_LIGHT_PARAM.color,
      ThreeApp.AMBIENT_LIGHT_PARAM.intensity,
    );
    this.scene.add(this.ambientLight);

    // 球体のジオメトリを生成
    this.sphereGeometry = new THREE.SphereGeometry(1.5, 32, 32);

    // コーンのジオメトリを生成 @@@
    this.coneGeometry = new THREE.ConeGeometry(0.2, 0.5, 3);

    // 地球のマテリアルとメッシュ
    this.earthMaterial = new THREE.MeshPhongMaterial(ThreeApp.MATERIAL_PARAM);
    //this.earthMaterial.map = this.earthTexture;
    this.earth = new THREE.Mesh(this.sphereGeometry, this.earthMaterial);
    this.scene.add(this.earth);
    
    // 月のマテリアルとメッシュ
    this.satelliteMaterial = new THREE.MeshPhongMaterial(ThreeApp.MATERIAL_PARAM2);
    this.satellite = new THREE.Mesh(this.coneGeometry, this.satelliteMaterial);
    this.satellite.scale.setScalar(0.8 );
    
    this.satelliteInner = new THREE.Group();
    this.satelliteOuter = new THREE.Group();
    this.scene.add(this.satelliteOuter);
    this.satelliteOuter.add(this.satelliteInner);
    this.satelliteInner.add(this.satellite);

    // satellite 自体でピッチは制御
    // 既定では頭を上に向けているので、X 軸回転で手前に倒す
    this.satellite.rotation.x = Math.PI * 0.5;
    // inner でヨーと高さを制御
    this.satelliteInner.position.set(0.0, 2.5, 0.0);

    // 目的地
    this.targetMaterial = new THREE.MeshPhongMaterial(ThreeApp.MATERIAL_PARAM3);
    this.target = new THREE.Mesh(this.sphereGeometry, this.targetMaterial);
    this.target.scale.setScalar(0.1);
    this.scene.add(this.target);
    this.randomizeTarget();
    this.setYaw();
    this.setTime(0.0);


    this.coneGeometry2 = new THREE.ConeGeometry(0.1, 0.2, 6);
    this.satelliteMaterial2 = new THREE.MeshPhongMaterial(ThreeApp.MATERIAL_PARAM4);
    this.satellite2 = new THREE.Mesh(this.coneGeometry2, this.satelliteMaterial2 );
    this.satellite2.position.set(0, 0, 0);
    this.satellite2.rotation.x = Math.PI;
    this.scene.add(this.satellite2);


    //this.placeRandomBoxes() ;
    
    this.group = new THREE.Group();
    this.group.add(this.earth);
    this.group.add(this.placeRandomBoxes());
    this.group.add(this.startMarker);
    this.group.add(this.endMarker);
    this.scene.add(this.group);
    
    
    this.group2 = new THREE.Group();
    this.group2.add(this.satellite2);
    this.scene.add(this.group2);

    // コントロール
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    // ヘルパー
    const axesBarLength = 20.0;
    this.axesHelper = new THREE.AxesHelper(axesBarLength);
    this.scene.add(this.axesHelper);
    
    // キーの押下状態を保持するフラグ
    this.isDown = false;

    // Clock オブジェクトの生成
    this.clock = new THREE.Clock();

     // レイキャスターとマウスの初期化
     this.raycaster = new THREE.Raycaster();
     this.mouse = new THREE.Vector2();
     this.isStartPointSet = false;
     this.isAnimating = false;
 
     // マーカーのジオメトリとマテリアルの初期化
     //this.markerMaterial = new THREE.MeshBasicMaterial(ThreeApp.MATERIAL_PARAM3);
 
     // イベントリスナーを追加
     //this.renderer.domElement.addEventListener('click', this.setRaycaster.bind(this), false);
   }
 
   
  
  
  render() {
    // 恒常ループ
    requestAnimationFrame(this.render);

    // コントロールを更新
    this.controls.update();
    this.satellite2.rotation.y += 0.1;

    //this.group.rotation.y += 0.01;
    const time = this.clock.getElapsedTime() / 2;
    // 経過時間をそのままラジアンとしてサインとコサインを求める
    const sin = Math.sin(time);
    const cos = Math.cos(time);
    
    this.group2.position.set(
      cos * ThreeApp.MOON_DISTANCE * 3,
      sin * ThreeApp.MOON_DISTANCE * 2,
      sin * ThreeApp.MOON_DISTANCE * 3
    );

    this.directionalLight2.position.set(
        cos * ThreeApp.MOON_DISTANCE,
        sin * ThreeApp.MOON_DISTANCE,
        sin * ThreeApp.MOON_DISTANCE
      );

    //this.group2.rotation.x = this.angle;
    //this.group2.rotation.x = this.angle * Math.PI;
    //マウスの動きに追従
    this.group2.rotation.z = this.angle * Math.PI;

    // レンダラーで描画
    this.renderer.render(this.scene, this.camera);
  }

  randomizeTarget() {
    const targetPoint = new THREE.Vector3(
        Math.random() * 2.0 - 1.0,
        Math.random() * 2.0 - 1.0,
        Math.random() * 2.0 - 1.0,
    ).normalize();
    this.target.position.copy(targetPoint.multiplyScalar(ThreeApp.EARTH_RADIUS * 3))
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

  startAnimation() {
    const animate = () => {
        this.setTime(this.time + 0.005);
        if (this.time < 1.0) {
            requestAnimationFrame(animate);
        }
    };
    animate();
  }
}
