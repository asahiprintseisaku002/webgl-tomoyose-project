
// = 009 ======================================================================
// これまでのサンプルでは、メッシュは「１つのジオメトリから１つ」ずつ生成してい
// ましたが、実際の案件では、同じジオメトリを再利用しながら「複数のメッシュ」を
// 生成する場面のほうが多いかもしれません。
// このとき、3D シーンに複数のオブジェクトを追加する際にやってしまいがちな間違い
// として「ジオメトリやマテリアルも複数回生成してしまう」というものがあります。
// メモリ効率よく複数のオブジェクトをシーンに追加する方法をしっかりおさえておき
// ましょう。
// ============================================================================

import * as THREE from '../lib/three.module.js';
import { OrbitControls } from '../lib/OrbitControls.js';

window.addEventListener('DOMContentLoaded', () => {
  const wrapper = document.querySelector('#webgl');
  const app = new ThreeApp(wrapper);
  app.render();
}, false);

class ThreeApp {
  /**
   * カメラ定義のための定数
   */
  static CAMERA_PARAM = {
    // fovy は Field of View Y のことで、縦方向の視野角を意味する
    fovy: 60,
    // 描画する空間のアスペクト比（縦横比）
    aspect: window.innerWidth / window.innerHeight,
    // 描画する空間のニアクリップ面（最近面）
    near: 0.1,
    // 描画する空間のファークリップ面（最遠面）
    far: 500.0,
    // カメラの座標
    position: new THREE.Vector3(0.0, 0.0, 100.0),
    // カメラの注視点
    lookAt: new THREE.Vector3(0.0, 0.0, 0.0),
  };
  /**
   * レンダラー定義のための定数
   */
  static RENDERER_PARAM = {
    clearColor: 0x070b2d,       // 画面をクリアする色
    width: window.innerWidth,   // レンダラーに設定する幅
    height: window.innerHeight, // レンダラーに設定する高さ
  };
  /**
   * 平行光源定義のための定数
   */
  static DIRECTIONAL_LIGHT_PARAM = {
    color: 0xffffff,                            // 光の色
    intensity: 1.0,                             // 光の強度
    position: new THREE.Vector3(100.0, 100.0, -100.0), // 光の向き
  };
  /**
   * アンビエントライト定義のための定数
   */
  static AMBIENT_LIGHT_PARAM = {
    color: 0xffffff, // 光の色
    intensity: 0.1,  // 光の強度
  };
  /**
   * マテリアル定義のための定数
   */
  static MATERIAL_PARAM = {
    color: 0x3399ff, // マテリアルの基本色
    emissive: 0x3399ff, //@@@
    opacity: 1,
    transparent: true
  };

  renderer;         // レンダラ
  scene;            // シーン
  camera;           // カメラ
  directionalLight; // 平行光源（ディレクショナルライト）
  ambientLight;     // 環境光（アンビエントライト）
  pointLight;
  material;         // マテリアル
  boxGeometry;
  boxArray;
  radius;           //花火の半径
  maxRadius;        //花火の最大半径
  speed;            //広がるスピード
  angle;
  controls;         // オービットコントロール
  axesHelper;       // 軸ヘルパー
  isDown;           // キーの押下状態用フラグ

  /**
   * コンストラクタ
   * @constructor
   * @param {HTMLElement} wrapper - canvas 要素を append する親要素
   */
  constructor(wrapper) {
    // レンダラー
    const color = new THREE.Color(ThreeApp.RENDERER_PARAM.clearColor);
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setClearColor(color);
    this.renderer.setSize(ThreeApp.RENDERER_PARAM.width, ThreeApp.RENDERER_PARAM.height);
    wrapper.appendChild(this.renderer.domElement);

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

    // マテリアル
    this.material = new THREE.MeshPhongMaterial(ThreeApp.MATERIAL_PARAM);

    //Boxについて
    this.BOX_NUM = 130;   
    this.boxGroup = new THREE.Group();
    this.radius = 0;
    this.maxRadius = 40;
    this.speed = 1.3;
    this.isRising = false;
    this.riseHeight = 0;
    this.maxRiseHeight = 40;
    this.riseSpeed = 1;

    for(let i = 0; i < this.BOX_NUM; i++){
        this.angle = 2 * Math.PI * i / this.BOX_NUM;
        this.boxGeometry = new THREE.BoxGeometry(1,1,1);
        this.box = new THREE.Mesh(this.boxGeometry, this.material);
        this.box.position.x = this.radius * Math.cos(this.angle);
        this.box.position.y = this.radius * Math.sin(this.angle);
        this.boxGroup.add(this.box);
      }
      
      this.scene.add(this.boxGroup);


    // 軸ヘルパー
    const axesBarLength = 10.0;
    this.axesHelper = new THREE.AxesHelper(axesBarLength);
    this.scene.add(this.axesHelper);
      /*
    const size = 1000;
    const divisions = 100;
    this.gridHelper = new THREE.GridHelper( size, divisions );
    this.scene.add( this.gridHelper );
      */
    // コントロール
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    // this のバインド
    this.render = this.render.bind(this);

    // キーの押下状態を保持するフラグ
    this.isDown = false;
    this.isAnimating = false; // アニメーション中かどうかを示すフラグ
      
    // キーの押下や離す操作を検出できるようにする
    window.addEventListener('keydown', (keyEvent) => {
      if (!this.isAnimating && !this.isRising) { 
        switch (keyEvent.key) {
          case ' ':
            this.isDown = true;
            this.isRising = true;
            document.querySelector('.text').style.opacity = '0';
            break;
          default:
        }
      }
    }, false);

    window.addEventListener('keyup', (keyEvent) => {
      this.isDown = false;
    }, false);

    // タップ操作を検出できるようにする
    window.addEventListener('touchstart', (touchEvent) => {
      if (!this.isAnimating && !this.isRising) { 
        this.isDown = true;
        this.isRising = true;
        document.querySelector('.text').style.opacity = '0';
      }
    }, false);

    window.addEventListener('touchend', (touchEvent) => {
      this.isDown = false;
    }, false);
        
    // ウィンドウのリサイズを検出できるようにする
    window.addEventListener('resize', () => {
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
    }, false);
  }

  /**
   * 描画処理
   */
  render() {
    // 恒常ループの設定
    requestAnimationFrame(this.render);
    if(this.isRising === true){    
        if(this.riseHeight < this.maxRiseHeight) {
            this.riseHeight += this.riseSpeed;
            this.boxGroup.position.y = this.riseHeight;
        } else {
            this.isRising = false;
            this.isAnimating = true;
        }
    } else if(this.isAnimating === true){
        if(this.radius < this.maxRadius) {
            this.radius += this.speed;
            this.boxGroup.children.forEach((box, i) => {
                this.angle = 2 * Math.PI * i / this.BOX_NUM;
                box.position.x = this.radius * Math.cos(this.angle);
                box.position.y = this.radius * Math.sin(this.angle);
                
                if(this.radius >= 30 && this.radius <= 40){
                    box.material.opacity = 1 - (this.radius - 30) / 9;
                    box.material.transparent = true;
                }

                if(this.radius >= 40){
                    this.isAnimating = false;
                    this.radius = 0;
                    this.riseHeight = 0;
                    box.position.x = this.radius * Math.cos(this.angle);
                    box.position.y = this.radius * Math.sin(this.angle);
                    this.boxGroup.position.x = Math.random() * 10 - 5; // -50から50の範囲
                    this.boxGroup.position.z = Math.random() * 10 - 5; 
                    this.boxGroup.rotation.y = Math.random() * 0.3 - 0.15;  
                    this.boxGroup.children.forEach((box) => {
                    });  
                }
            });
        }
    } else {
        this.box.material.opacity = 1;
        this.boxGroup.position.y = this.riseHeight;
        document.querySelector('.text').style.opacity = '1';
    }

    // コントロールを更新
    this.controls.update();

    // レンダラーで描画
    this.renderer.render(this.scene, this.camera);
  }
}

