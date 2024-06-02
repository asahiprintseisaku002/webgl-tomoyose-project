
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
import { EffectComposer } from '../lib/EffectComposer.js';
import { RenderPass } from '../lib/RenderPass.js';
import { FilmPass } from '../lib/FilmPass.js';
// ポストプロセス用のファイルを追加 @@@
import { DotScreenPass } from '../lib/DotScreenPass.js';

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
    position: new THREE.Vector3(0.0, 2.0, 23.8),
    lookAt: new THREE.Vector3(0.0, 0.0, 0.0),
  };
  /**
   * レンダラー定義のための定数
   */
  static RENDERER_PARAM = {
    clearColor: 0xffffff,
    width: window.innerWidth,
    height: window.innerHeight,
    antialias: true
  };

  static FOG_PARAM = {
    color: 0xffffff,
    near: 3.0,
    far: 17.0,
  };
  /**
   * 平行光源定義のための定数
   */
  static DIRECTIONAL_LIGHT_PARAM = {
    color: 0xffffff,
    intensity: 0.4,
    position: new THREE.Vector3(1.0, 1.0, 24.0),
  };

  static POINT_LIGHT_PARAM = {
    color: 0xffffff,
    intensity: 180.0,
    position: new THREE.Vector3(1.0, 1.0, 24.0),
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
    side: THREE.FrontSide
  };

  static MATERIAL2_PARAM = {
    color: 0xffffff,
    side: THREE.FrontSide
  };

  static MATERIAL3_PARAM = {
    color: 0xffffff,
    side: THREE.FrontSide
  };

  static MATERIAL4_PARAM = {
    color: 0xffffff,
    side: THREE.FrontSide
  };

  static MATERIAL5_PARAM = {
    color: 0x42dfe3,
    transparent: true,     // 透明を扱うかどうか
    opacity: 0.3,
    side: THREE.DoubleSide
  };

  static MATERIAL6_PARAM = {
    color: 0x42dfe3,
  };

  renderer;         // レンダラ
  scene;            // シーン
  camera;           // カメラ   
  directionalLight; // 平行光源（ディレクショナルライト）
  ambientLight;     // 環境光（アンビエントライト）
  pointLight;
  material;         // マテリアル
  material2; 
  material3; 
  material4;
  material5;
  material6; 
  texture;
  texture2;
  texture3;
  texture4; 
  texture6;  
  boxGeometry;
  boxisArray;
  board;
  cylinderGeometry;
  cylinder;
  planeGeometry;
  plane;
  controls;         // オービットコントロール
  axesHelper;       // 軸ヘルパー
  isDown;           // キーの押下状態用フラグ
  group;            // グループ @@@
  group2;

  /**
   * コンストラクタ
   * @constructor
   * @param {HTMLElement} wrapper - canvas 要素を append する親要素
   */
  constructor(wrapper) {
    // レンダラー
    const color = new THREE.Color(ThreeApp.RENDERER_PARAM.clearColor);
    this.renderer = new THREE.WebGLRenderer({antialias: ThreeApp.RENDERER_PARAM.antialias});
    this.renderer.setClearColor(color);
    this.renderer.setSize(ThreeApp.RENDERER_PARAM.width, ThreeApp.RENDERER_PARAM.height);
    wrapper.appendChild(this.renderer.domElement);

    // シーン
    this.scene = new THREE.Scene();

    // フォグ
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
    //this.scene.add(this.directionalLight);

    // アンビエントライト（環境光）
    this.ambientLight = new THREE.AmbientLight(
      ThreeApp.AMBIENT_LIGHT_PARAM.color,
      ThreeApp.AMBIENT_LIGHT_PARAM.intensity,
    );
    this.scene.add(this.ambientLight);

    this.pointLight = new THREE.PointLight(
        ThreeApp.POINT_LIGHT_PARAM.color,
        ThreeApp.POINT_LIGHT_PARAM.intensity, 
    );
    this.pointLight.position.copy(ThreeApp.POINT_LIGHT_PARAM.position);
    this.scene.add(this.pointLight);

    this.group = new THREE.Group();
    this.group2 = new THREE.Group();
    // グループはメッシュなどと同様に Object3D を継承しているのでシーンに追加できる
    this.scene.add(this.group);
    
    this.groupBig = new THREE.Group();

    this.scene.add(this.groupBig);

    this.material = new THREE.MeshPhongMaterial(ThreeApp.MATERIAL_PARAM);
    this.material2 = new THREE.MeshPhongMaterial(ThreeApp.MATERIAL2_PARAM);
    this.material3 = new THREE.MeshPhongMaterial(ThreeApp.MATERIAL3_PARAM);
    this.material4 = new THREE.MeshPhongMaterial(ThreeApp.MATERIAL4_PARAM);
    this.material5 = new THREE.MeshPhongMaterial(ThreeApp.MATERIAL5_PARAM);
    this.material6 = new THREE.MeshPhongMaterial(ThreeApp.MATERIAL6_PARAM);

    this.boardMaterials = [
      this.material5,
      this.material5,
      this.material5,
      this.material5,
      this.material,
      this.material5,
    ];

    this.boardMaterials2 = [
      this.material5,
      this.material5,
      this.material5,
      this.material5,
      this.material2,
      this.material5,
    ];

    this.boardMaterials3 = [
        this.material5,
        this.material5,
        this.material5,
        this.material5,
        this.material3,
        this.material5,
      ];
  
      this.boardMaterials4 = [
        this.material5,
        this.material5,
        this.material5,
        this.material5,
        this.material4,
        this.material5,
      ];

    // 共通のジオメトリ、マテリアルから、複数のメッシュインスタンスを作成する 
    this.BC = 8;
    
    this.boxGeometry = new THREE.BoxGeometry(2, 4, 0.1);
    this.boxisArray = [];
    this.radius = 10;
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

    for (let i = 0; i < this.BC; i++) {
        this.angle = 2 * Math.PI * i / this.BC;
        this.board = new THREE.Mesh(this.boxGeometry, this.boardMaterials3);
        this.board.position.x = this.radius * Math.cos(this.angle);
        this.board.position.z = this.radius * Math.sin(this.angle);
        this.board.lookAt(new THREE.Vector3(0, 0, 0)); //原点を向かせる
        this.board.rotateY(Math.PI); //原点を向かせた後に回転
        
        this.group2.add(this.board); // グループに追加する
       
    }

    for (let i = 0; i < this.BC; i++) {
        this.angle = 2 * Math.PI * i / this.BC + degreeOffset;
        this.board = new THREE.Mesh(this.boxGeometry, this.boardMaterials4);
        this.board.position.x = this.radius * Math.cos(this.angle);
        this.board.position.z = this.radius * Math.sin(this.angle);
        this.board.lookAt(new THREE.Vector3(0, 0, 0)); //原点を向かせる
        this.board.rotateY(Math.PI); //原点を向かせた後に回転
        
        this.group2.add(this.board); // グループに追加する
       
    }
    
    this.planeGeometry = new THREE.PlaneGeometry( 100, 100 ); 
    this.plane = new THREE.Mesh(this.planeGeometry, this.material6);
    this.plane.rotation.x = -Math.PI / 2; 
    this.scene.add(this.plane);


    this.group.position.x = -10.5;
    this.group.position.y = 2;
    this.group2.position.x = 10.5;
    this.group2.position.y = 2;

    this.groupBig.add(this.group);
    this.groupBig.add(this.group2);

    // コンポーザーの設定 @@@
    // 1. コンポーザーにレンダラを渡して初期化する
    this.composer = new EffectComposer(this.renderer);
    // 2. コンポーザーに、まず最初に「レンダーパス」を設定する
    this.renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(this.renderPass);
    // 3. コンポーザーに第２のパスとして「グリッチパス」を設定する
    this.filmPass = new FilmPass(2, false);
    this.composer.addPass(this.filmPass);
    // 4. コンポーザーに第３のパスとして「ドットスクリーンパス」を設定する
    //this.dotScreenPass = new DotScreenPass();
    //this.composer.addPass(this.dotScreenPass);
    // 5. パスの追加がすべて終わったら画面に描画結果を出すよう指示する
    //this.dotScreenPass.renderToScreen = true;
    this.filmPass.renderToScreen = true;

    // this のバインド

    // 軸ヘルパー
    const axesBarLength = 10.0;
    this.axesHelper = new THREE.AxesHelper(axesBarLength);
    this.scene.add(this.axesHelper);
 
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
            document.querySelector('.text').style.opacity = '0';
        }
    });
    // キーが離されたことを検出
    window.addEventListener('keyup', function(event) {
        if (event.code === 'Space' && !self.isAnimating) {
            self.isDown = false;
            document.querySelector('.text').style.opacity = '1';
        }
    });
/*
    // タップ操作を検出できるようにする
    window.addEventListener('touchstart', (touchEvent) => {
      if (self.isAnimating) { 
          self.isDown = true;
          self.isAnimating = !self.isAnimating;
          document.querySelector('.text').style.opacity = '0';
      }
  }, false);
  
  window.addEventListener('touchend', (touchEvent) => {
      if (!self.isAnimating && !self.isDown) {
          self.isDown = false;
          document.querySelector('.text').style.opacity = '1';
      }
  }, false);
*/
    // ウィンドウのリサイズを検出できるようにする
    window.addEventListener('resize', () => {
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
    }, false);
  }

  load() {
    return new Promise((resolve) => {
      const imagePaths = ['./r1.jpg', './r2.jpg', './w1.jpg', './w2.jpg', 'snowplane.jpg'];
      const loader = new THREE.TextureLoader();
      Promise.all(imagePaths.map(path => {
        return loader.loadAsync(path);
      })).then(textures => {
        this.material.map = textures[0];
        this.material2.map = textures[1];
        this.material3.map = textures[2];
        this.material4.map = textures[3];
        this.material6.map = textures[4];
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

    const lightOffset = new THREE.Vector3(0, 0, 3);
    this.pointLight.position.copy(this.camera.position).add(lightOffset);

    // groupBigの回転の最小値と最大値を定義
    const minRotationZ = Math.PI / 2;
    const maxRotationZ = -Math.PI / 2; // 45度
    //let startRotationZ = this.groupBig.rotation.z;   
    
    // フラグに応じてオブジェクトの状態を変化させる
    if (this.isAnimating) {
      // 個々のトーラスではなくグループを回転させると…… @@@
      this.boxisArray.forEach((board) => {
        board.rotation.y += 0.03;
      });
      this.group.rotation.y += 0.1;
      this.group2.rotation.y += 0.1;
      //this.scene.rotation.z += 0.001;
      this.groupBig.rotation.y = (Math.sin(Date.now() * 0.001) * (maxRotationZ - minRotationZ) / 2); // 時間に基づいてrotation.zを更新
      //確認用にシーンを回す
      //this.scene.rotation.y = /*minRotationZ +*/ (Math.sin(Date.now() * 0.001) * (maxRotationZ - minRotationZ) / 2);// + (maxRotationZ - minRotationZ) / 2);
    } 
    
    // レンダラーで描画
    //this.renderer.render(this.scene, this.camera);
    this.composer.render();
  }
}
