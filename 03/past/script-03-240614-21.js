
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
  //satellite;          // 人工衛星
  //satelliteMaterial;  // 人工衛星用マテリアル
  //satelliteDirection; // 人工衛星の進行方向
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
  markerGeometry;     // マーカージオメトリ
  markerMaterial;     // マーカーマテリアル
  startMarker;        // 始点マーカー
  endMarker;          // 終点マーカー
  isStartPointSet;    // 始点が設定されているかのフラグ
  animationId;        // アニメーションID
  isAnimating;
  intersectPoint;
  earthQuaternion;
  point;
  group;
  

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

    // カメラの'change'イベントをリッスンします。
    this.camera.addEventListener('change', () => {
        // レイキャスターを更新します。
        this.raycaster.setFromCamera(this.mouse, this.camera);
    });

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
    //this.moon.rotateX(Math.PI / 3); 
    //this.moon.position.set(0, 1, 0);
    this.direction = new THREE.Vector3();
    /*
    this.group =new THREE.Group();
    this.group.add(this.moon);
    this.group.rotateZ(Math.PI);
    this.scene.add(this.group);
    */
    

    // コントロール
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    this.controls.addEventListener('change', () => {
        // レイキャスターを更新します。
        this.raycaster.setFromCamera(this.mouse, this.camera);
    });

    // ヘルパー
    const axesBarLength = 5.0;
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
     this.markerMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
 
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

    // 球体の現在の回転を保存
    let currentRotation = this.earth.quaternion.clone();

    // 球体の回転を一時的に元に戻す
    this.earth.quaternion.set(0, 0, 0, 1);

    // earthMeshとの交差点を計算
    this.intersects = this.raycaster.intersectObject(this.earth);

    // 球体の回転を再適用
    this.earth.quaternion.copy(currentRotation);

    if (this.intersects.length > 0) {
        let intersectPoint = this.intersects[0].point.clone();

        // Earthが存在することを確認します。
        if (this.earth) {
            intersectPoint.applyQuaternion(this.earth.quaternion.clone().invert());
            let earthRadius = 1.5; // Earthの半径を適切な値に設定

            // Earthの中心からの半径と方向で点を再計算
            let landingPoint = intersectPoint.clone().normalize().multiplyScalar(earthRadius);
            /*
                // X軸とZ軸を交換
                var temp = landingPoint.x;
                landingPoint.x = landingPoint.z;
                landingPoint.z = temp;
            */
            if (!this.isStartPointSet) {
                // 始点をEarthの表面に着地させる
                this.startPoint = landingPoint;
                this.startMarker = new THREE.Mesh(this.markerGeometry, this.markerMaterial);
                this.startMarker.position.copy(this.startPoint);
                this.scene.add(this.startMarker);
                this.moon.position.copy(this.startPoint); // 月の位置を始点にリセット
                this.moon.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI); // 月の姿勢を設定

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
}

 
moveMoon() {
    // アニメーション開始時に isAnimating を true に設定
    this.isAnimating = true;

    // 始点と終点のベクトル
    let startPoint = this.startPoint;
    let endPoint = this.endPoint;

    // 始点から終点へのベクトル
    let startToEnd = new THREE.Vector3().subVectors(endPoint, startPoint);

    // 軌道の形状を定義するための外積
    let orbitNormal = new THREE.Vector3().crossVectors(startPoint, endPoint).normalize();

    // 軌道の中心点
    let orbitCenter = new THREE.Vector3().addVectors(startPoint, endPoint).multiplyScalar(0.5);

    // 軌道の半径
    let orbitRadius = startPoint.distanceTo(endPoint) / 2;

    // 軌道を描くためのジオメトリとマテリアル
    let orbitGeometry = new THREE.TorusGeometry(orbitRadius, 0.01, 16, 100, Math.PI * 2);
    let orbitMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });

    // 軌道のメッシュを作成
    let orbit = new THREE.Mesh(orbitGeometry, orbitMaterial);

    // 軌道のメッシュを回転させて正しい位置に配置
    orbit.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), orbitNormal);

    // 軌道のメッシュをシーンに追加
    this.scene.add(orbit);

    // 月の位置を更新
    this.moon.position.copy(this.startPoint);

    // Earthの半径を設定
    let earthRadius = 0.001;

    // 始点と終点の中間点を計算
    let midPoint = new THREE.Vector3().addVectors(this.startPoint, this.endPoint).multiplyScalar(0.5);
    let distanceX = this.startPoint.distanceTo(this.endPoint) / 2; // x軸の半径
    let distanceY = -distanceX * 3;
    let angle = Math.PI; // 始点から移動を開始するためにPIから開始
    let speed = 0.02; // 移動速度

    // 始点と終点の座標をEarthの半径に合わせて調整
    this.startPoint.multiplyScalar(earthRadius / this.startPoint.length());
    this.endPoint.multiplyScalar(earthRadius / this.endPoint.length());

    // Y軸と始点から終点へのベクトルとの間の最小角を計算
    let angleBetween = Math.acos(new THREE.Vector3(0, 1, 0).dot(startToEnd));

    // 回転軸を計算（Y軸と始点から終点へのベクトルの外積）
    let rotationAxis = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), startToEnd).normalize();

    // 回転するためのクォータニオンを作成
    let quaternion = new THREE.Quaternion().setFromAxisAngle(rotationAxis, angleBetween);

    // 月の姿勢をクォータニオンで更新
    this.moon.quaternion.multiplyQuaternions(quaternion, this.moon.quaternion);

    // 月の位置を更新（必要に応じて）
    this.moon.position.copy(this.startPoint);

    // アニメーションのための時間変数を設定
    var t = 0;

    const animate = () => {
        this.animationId = requestAnimationFrame(animate);

        // 角度を更新
        angle += speed; // 角度を増加させることで始点から終点へ移動

        // 月のメッシュを楕円軌道上に移動
        this.moon.position.x = midPoint.x + (earthRadius + distanceX) * Math.cos(angle);
        this.moon.position.y = midPoint.y + (earthRadius + distanceY) * Math.sin(angle);
        this.moon.position.z = midPoint.z;

        // 月の向きを更新
        if (angle <= Math.PI) {
            this.moon.rotation.z = t; // 始点で180度回転
        } else if (angle > Math.PI && angle <= 1.5 * Math.PI) {
            this.moon.rotation.z = t + Math.PI; // 頂点で90度回転
        } else {
            this.moon.rotation.z = t - Math.PI / 2; // 終点で始点の向きに戻る
        }

        // 時間変数を更新
        t += 0.01;

        // 終点に到達したかチェック
        if (angle >= Math.PI * 2) { // 一周したらアニメーションを停止
            cancelAnimationFrame(this.animationId);
            this.animationId = undefined;

            // マーカーと月のメッシュをシーンから削除
            this.scene.remove(this.startMarker);
            this.scene.remove(this.endMarker);
            this.moon.visible = false;

            // 始点をリセット
            this.isStartPointSet = false;

            // アニメーションが完了したので、isAnimating を false に設定
            this.isAnimating = false;

        }

    };

    animate();
}


  

  render() {
    // 恒常ループ
    requestAnimationFrame(this.render);
    

    // コントロールを更新
    this.controls.update();

    //this.earth.rotation.y += 0.001;


    // レンダラーで描画
    this.renderer.render(this.scene, this.camera);
  }
}
