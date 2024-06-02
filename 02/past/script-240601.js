
// = 011 ======================================================================
// three.js を使っているかどうかにかかわらず、3D プログラミングとはそもそもかな
// り難易度の高いジャンルです。
// その中でも、特に最初のころに引っかかりやすいのが「回転や位置」の扱いです。
// ここではそれを体験する意味も含め、グループの使い方を知っておきましょう。この
// グループという概念を用いることで、three.js ではオブジェクトの制御をかなり簡単
// に行うことができるようになっています。
// ============================================================================

import * as THREE from '../lib/three.module.js';
import { OrbitControls } from '../lib/OrbitControls.js';

window.addEventListener('DOMContentLoaded', async () => {
  const wrapper = document.querySelector('#webgl');
  const app = new ThreeApp(wrapper);
  await app.load();
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
    far: 50.0,
    position: new THREE.Vector3(0.0, 2.0, 10.0),
    lookAt: new THREE.Vector3(0.0, 0.0, 0.0),
  };
  /**
   * レンダラー定義のための定数
   */
  static RENDERER_PARAM = {
    clearColor: 0x666666,
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
    intensity: 0.1,
  };
  /**
   * マテリアル定義のための定数
   */
  static MATERIAL_PARAM = {
    color: 0xffffff,
  };

  static MATERIAL2_PARAM = {
    color: 0xcbf869,
  };

  static MATERIAL3_PARAM = {
    color: 0x69e8f8,
  };

  static MATERIAL4_PARAM = {
    color: 0xff0000,
  };

  static MATERIAL5_PARAM = {
    color: 0x000000,
  };

  static MATERIAL6_PARAM = {
    color: 0x00ffff,
  };

  renderer;         // レンダラ
  scene;            // シーン
  camera;           // カメラ   
  directionalLight; // 平行光源（ディレクショナルライト）
  ambientLight;     // 環境光（アンビエントライト）
  material;         // マテリアル
  material2; 
  material3; 
  material4;
  material5;
  material6;   
  boardMaterials;
  torusGeometry;    // トーラスジオメトリ
  torusArray;       // トーラスメッシュの配列
  boxGeometry;
  boxisArray;
  board;
  cylinderGeometry;
  cylinder;
  controls;         // オービットコントロール
  axesHelper;       // 軸ヘルパー
  isDown;           // キーの押下状態用フラグ
  group;            // グループ @@@

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
    this.material2 = new THREE.MeshPhongMaterial(ThreeApp.MATERIAL2_PARAM);
    this.material3 = new THREE.MeshPhongMaterial(ThreeApp.MATERIAL3_PARAM);
    this.material4 = new THREE.MeshPhongMaterial(ThreeApp.MATERIAL4_PARAM);
    this.material5 = new THREE.MeshPhongMaterial(ThreeApp.MATERIAL5_PARAM);
    this.material6 = new THREE.MeshPhongMaterial(ThreeApp.MATERIAL6_PARAM);

    this.boardMaterials = [
      this.material4 = new THREE.MeshPhongMaterial(ThreeApp.MATERIAL4_PARAM),
      this.material4 = new THREE.MeshPhongMaterial(ThreeApp.MATERIAL4_PARAM),
      this.material4 = new THREE.MeshPhongMaterial(ThreeApp.MATERIAL4_PARAM),
      this.material4 = new THREE.MeshPhongMaterial(ThreeApp.MATERIAL4_PARAM),
      this.material = new THREE.MeshPhongMaterial(ThreeApp.MATERIAL_PARAM), //前面
      this.material4 = new THREE.MeshPhongMaterial(ThreeApp.MATERIAL4_PARAM) //背面
    ];

    this.boardMaterials2 = [
      this.material4 = new THREE.MeshPhongMaterial(ThreeApp.MATERIAL4_PARAM),
      this.material4 = new THREE.MeshPhongMaterial(ThreeApp.MATERIAL4_PARAM),
      this.material4 = new THREE.MeshPhongMaterial(ThreeApp.MATERIAL4_PARAM),
      this.material4 = new THREE.MeshPhongMaterial(ThreeApp.MATERIAL4_PARAM),
      this.material2 = new THREE.MeshPhongMaterial(ThreeApp.MATERIAL2_PARAM), //前面
      this.material4 = new THREE.MeshPhongMaterial(ThreeApp.MATERIAL4_PARAM) //背面
    ];
    
    // グループ @@@
    // - グループを使う -------------------------------------------------------
    // three.js のオブジェクトは、グループにひとまとめにすることができます。
    // グループを使わないと実現できない挙動、というのも一部にはありますのでここ
    // で使い方だけでもしっかり覚えておきましょう。
    // 特に、グループに追加したことによって「回転や平行移動の概念が変わる」とい
    // うことが非常に重要です。
    // three.js ではこのグループ（より正確には Object3D）を親子関係のある階層構
    // 造（入れ子構造）することによって位置や回転を制御する仕組みになっています。
    // ------------------------------------------------------------------------
    this.group = new THREE.Group();
    // グループはメッシュなどと同様に Object3D を継承しているのでシーンに追加できる
    this.scene.add(this.group);
    
    this.groupBig = new THREE.Group();

    this.scene.add(this.groupBig);

    // 共通のジオメトリ、マテリアルから、複数のメッシュインスタンスを作成する 
    this.BC = 8;
    
    this.boxGeometry = new THREE.BoxGeometry(2, 4, 0.1);
    this.boxisArray = [];
    this.radius = 7;
    for (let i = 0; i < this.BC; i++) {
        this.angle = 2 * Math.PI * i / this.BC;
        this.board = new THREE.Mesh(this.boxGeometry, this.boardMaterials);
        this.board.position.x = this.radius * Math.cos(this.angle);
        this.board.position.z = this.radius * Math.sin(this.angle);
        this.board.lookAt(new THREE.Vector3(0, 0, 0)); //原点を向かせる
        this.board.rotateY(Math.PI); //原点を向かせた後に回転
        
        this.group.add(this.board); // グループに追加する
       
    }

    const degreeOffset = 22.5 * (Math.PI / 180);

    for (let i = 0; i < this.BC; i++) {
        this.angle = 2 * Math.PI * i / this.BC + degreeOffset;
        this.board = new THREE.Mesh(this.boxGeometry, this.boardMaterials2);
        this.board.position.x = this.radius * Math.cos(this.angle);
        this.board.position.z = this.radius * Math.sin(this.angle);
        this.board.lookAt(new THREE.Vector3(0, 0, 0)); //原点を向かせる
        this.board.rotateY(Math.PI); //原点を向かせた後に回転
        
        this.group.add(this.board); // グループに追加する
       
    }

    this.cylinderGeometry = new THREE.CylinderGeometry( 5.2, 5.2, 4, 32 ); 
    this.cylinder = new THREE.Mesh(this.cylinderGeometry, this.material5);
    this.cylinder.position.y = 0
    this.group.add(this.cylinder);

    this.group.position.y = 2;


    this.groupBig.add(this.group);

    // 軸ヘルパー
    const axesBarLength = 5.0;
    this.axesHelper = new THREE.AxesHelper(axesBarLength);
    this.scene.add(this.axesHelper);

    const size = 100; const divisions = 50; 
    const gridHelper = new THREE.GridHelper( size, divisions ); 
    this.scene.add( gridHelper );

    // コントロール
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    // this のバインド
    this.render = this.render.bind(this);

    // キーの押下状態を保持するフラグ
    this.isDown = false;

    // アニメーションの状態を管理するフラグ
    this.isAnimating = false;
    // thisの参照を保持する
    const self = this;

    // キーの押下や離す操作を検出できるようにする
    window.addEventListener('keydown', function(event) {
        if(event.code === 'Space'){
            self.isDown = true;
            self.isAnimating = !self.isAnimating;
        }
    });
    // キーが離されたことを検出
    window.addEventListener('keyup', function(event) {
        if (event.code === 'Space') {
            self.isDown = false;
        }
    });

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
    // 恒常ループ
    requestAnimationFrame(this.render);

    // コントロールを更新
    this.controls.update();

    // groupBigの回転の最小値と最大値を定義
    const minRotationZ = -Math.PI / 3;
    const maxRotationZ = Math.PI / 3; // 45度
    //let startRotationZ = this.groupBig.rotation.z;   
    
    // フラグに応じてオブジェクトの状態を変化させる
    if (this.isAnimating) {
      // 個々のトーラスではなくグループを回転させると…… @@@
      this.boxisArray.forEach((board) => {
        board.rotation.y += 0.03;
      });
      this.group.rotation.y += 0.5;
      //this.scene.rotation.z += 0.001;
      //this.groupBig.rotation.z += 0.1; // 時間に基づいてrotation.zを更新
      //わかりにくいのでシーンを回すことに
      this.scene.rotation.y = /*minRotationZ +*/ (Math.sin(Date.now() * 0.001) * (maxRotationZ - minRotationZ) / 2);// + (maxRotationZ - minRotationZ) / 2);
    } 
    
    // レンダラーで描画
    this.renderer.render(this.scene, this.camera);
  }
}
