
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
  static SATELLITE_SPEED = 0.005;
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
  isStartPointSet;    // 始点が設定されているかのフラグ
  animationId;        // アニメーションID
  isAnimating;
  rect;
  angle;
  clickState;

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

    window.addEventListener('mousemove', (event) => {
        // マウスの位置を正規化します（-1から+1の範囲）。
        this.rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x =  (event.clientX - this.rect.left) / this.rect.width  * 2 - 1;
        this.mouse.y = -(event.clientY - this.rect.top) / this.rect.height * 2 + 1;
        this.angle = Math.atan2(this.mouse.y, this.mouse.x);
      }, false);

    // キーの押下や離す操作を検出できるようにする
    window.addEventListener('keydown', (keyEvent) => {
        switch (keyEvent.key) {
        case ' ':
         
            if (this.isDown) {
            // スペースキーが離されたときにカメラの位置と向きを元に戻す
            this.camera.position.copy(ThreeApp.CAMERA_PARAM.position);
            this.camera.lookAt(ThreeApp.CAMERA_PARAM.lookAt);
            this.isDown = false;

            } else {
            // スペースキーが押されたときにカメラの位置と向きを更新
            this.camera.position.copy(this.moon.position); // カメラを月の位置に移動
            this.camera.lookAt(this.endPoint); // カメラを終点に向ける
            this.isDown = true;

            // 現在のカメラの位置と視点を保存
            this.currentCameraPosition = this.camera.position.clone();
            this.currentLookAtPosition = this.endPoint.clone();

            }
          
            break;
        default:
        }
      
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
    this.direction = new THREE.Vector3();

    this.coneGeometry2 = new THREE.ConeGeometry(0.1, 0.2, 6);
    this.satelliteMaterial = new THREE.MeshPhongMaterial(ThreeApp.MATERIAL_PARAM4);
    this.satellite = new THREE.Mesh(this.coneGeometry2, this.satelliteMaterial );
    this.satellite.position.set(0, 0, 0);
    this.satellite.rotation.x = Math.PI;
    this.scene.add(this.satellite);


    //this.placeRandomBoxes() ;
    
    this.group = new THREE.Group();
    this.group.add(this.earth);
    this.group.add(this.placeRandomBoxes());
    this.group.add(this.startMarker);
    this.group.add(this.endMarker);
    this.scene.add(this.group);
    
    
    this.group2 = new THREE.Group();
    this.group2.add(this.satellite);
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
     this.markerGeometry = new THREE.SphereGeometry(0.1, 32, 32);
     this.markerMaterial = new THREE.MeshBasicMaterial(ThreeApp.MATERIAL_PARAM3);
 
     // イベントリスナーを追加
     this.renderer.domElement.addEventListener('click', this.setRaycaster.bind(this), false);
   }
 
   setRaycaster(event) {

    if (this.isAnimating) {
        return;
      }

     // マウス位置を正規化
     this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
     this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
 
     // レイキャスターを更新
     this.raycaster.setFromCamera(this.mouse, this.camera);
 
     // earthMeshとの交差点を計算
     this.intersects = this.raycaster.intersectObject(this.earth);

     if (this.animationId !== undefined) {
        cancelAnimationFrame(this.animationId);
        this.animationId = undefined;
      }
 
      if (this.intersects.length > 0) {
        let intersectPoint = this.intersects[0].point;
        let earthRadius = 1.5; // Earthの半径を適切な値に設定
    
        // Earthの中心からの半径と方向で点を再計算
        let landingPoint = intersectPoint.clone().normalize().multiplyScalar(earthRadius);

        
    
        if (!this.isStartPointSet) {
          // 始点をEarthの表面に着地させる
          this.startPoint = landingPoint;
          this.startMarker = new THREE.Mesh(this.markerGeometry, this.markerMaterial);
          this.startMarker.position.copy(this.startPoint);
          this.scene.add(this.startMarker);
          this.moon.position.copy(this.startPoint); // 月の位置を始点にリセット
          this.moon.visible = true;
          this.isStartPointSet = true;
        } else {
          // 終点をEarthの表面に着地させる
          this.endPoint = landingPoint;
          this.endMarker = new THREE.Mesh(this.markerGeometry, this.markerMaterial);
          this.endMarker.position.copy(this.endPoint);
          this.scene.add(this.endMarker);
    
          // moveMoonメソッドを呼び出して月の移動を開始
          this.moveMoon();
       }
     }
   }
 
   moveMoon() {
    // アニメーション開始時に isAnimating を true に設定
    this.isAnimating = true;
  
    let speed = 0.005; // 移動速度
    let height = 3; // 移動パスの頂点の高さ
  
    let t = 0; // 始点からの移動距離の比率（0から1）
  
    const animate = () => {
      this.animationId = requestAnimationFrame(animate);
  
      // 移動距離の比率を更新
      t += speed;
  
      // 月の位置を更新
      this.moon.position.lerpVectors(this.startPoint, this.endPoint, t);
      this.moon.position.y += height * Math.sin(Math.PI * t); // 頂点の高さを調

      // 月の向きを終点に向ける
      this.moon.lookAt(this.endPoint);

      // スペースキーが押されている場合、カメラの位置を月の位置に更新
      if (this.isDown) {
        this.camera.position.copy(this.moon.position);
        this.camera.lookAt(this.endPoint);
      }
  
      // 終点に到達したかチェック
      if (t >= 1) { // 終点に到達したらアニメーションを停止
        cancelAnimationFrame(this.animationId);
        this.animationId = undefined;
  
        // 1秒後にリセット処理を行う
        setTimeout(() => {

          // マーカーと月のメッシュをシーンから削除
          this.scene.remove(this.startMarker);
          this.scene.remove(this.endMarker);
          this.moon.visible = false;
  
          // 始点をリセット
          this.isStartPointSet = false;
  
          // アニメーションが完了したので、isAnimating を false に設定
          this.isAnimating = false;

          if (this.isDown) {
            this.camera.position.copy(this.currentCameraPosition);
            this.camera.lookAt(this.currentLookAtPosition);
        }

        }, 300); 
      }
    };
  
    animate();
  }
  
  render() {
    // 恒常ループ
    requestAnimationFrame(this.render);

    // コントロールを更新
    this.controls.update();
    this.satellite.rotation.y += 0.01;

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

    //this.group2.rotation.x = this.angle;
    this.group2.rotation.x = this.angle * Math.PI;
    //this.group2.lookAt(this.mouse);

    // レンダラーで描画
    this.renderer.render(this.scene, this.camera);
  }
}
