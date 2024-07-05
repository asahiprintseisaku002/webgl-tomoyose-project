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
    position: new THREE.Vector3(0.0, -2, 16.0),
    lookAt: new THREE.Vector3(0.0, 0.0, 0.0),
  };

  static CAMERA_PARAM2 = {
    fovy: 60,
    aspect: window.innerWidth / window.innerHeight,
    near: 0.1,
    far: 300.0,
    position: new THREE.Vector3(0.0, 0.0, 17.0),
    lookAt: new THREE.Vector3(0.0, 0.0, 0.0),
  };

  /**
   * レンダラー定義のための定数
   */
  static RENDERER_PARAM = {
    clearColor: 0x0b0b0b, // パーティクルが目立つように背景は黒に @@@
    width: window.innerWidth,
    height: window.innerHeight,
    antialias: true
  };

  static FOG_PARAM = {
    color: 0x000000,
    near: 20.0,
    far: 200.0,
  };
  /**
   * マテリアル定義のための定数（パーティクル用） @@@
   */
  static MATERIAL_PARAM = {
    color: 0x50b63f,      // パーティクルの色
    size: 0.25,           // 基準となるサイズ
    sizeAttenuation: true // 遠近感を出すかどうかの真偽値
  };

  static MATERIAL_PARAM2 = {
    color: 0xb0b0b0,
    side: THREE.DoubleSide,
    transparent: true
  }

  //ライト
  static DIRECTIONAL_LIGHT_PARAM = {
    color: 0xffffff,
    intensity: 1.0,
    position: new THREE.Vector3(1.0, 1.0, 1.0),
  };

    //ライト
    static DIRECTIONAL_LIGHT_PARAM2 = {
        color: 0xffffff,
        intensity: 1.5,
        position: new THREE.Vector3(1.0, 5.0, 5.0),
      };

  static AMBIENT_LIGHT_PARAM = {
    color: 0xffffff,
    intensity: 0.1,
  };
  //ライトここまで

  static INTERSECTION_MATERIAL_PARAM = {
    color: 0x00ffff,
  };
  /**
   * レンダーターゲットの大きさ @@@
   */
  static RENDER_TARGET_SIZE = 1024;


  wrapper;          // canvas の親要素
  renderer;         // レンダラ
  scene;            // シーン
  camera;           // カメラ
  geometry;         // ジオメトリ
  material;         // マテリアル
  plane;
  planes;
  planeGroup;
  planeGeometry;
  planeMaretial;
  planeMaretials;
  pointsGroup;
  texture;
  points;           // パーティクルの実態（点群のメッシュに相当） @@@
  controls;         // オービットコントロール
  axesHelper;       // 軸ヘルパー
  gltfLoader;
  gltfs;
  sceneGltf;
  sceneGltfPath;
  monitorGroup;
  gridGroup;
  sceneAddposition;
  imageLoader;
  images;
  scaleFactor;
  originalplane;
  moon;
  moonplane;
  star;
  starplane;
  starGeometry;
  starVertices;
  diamond;
  diamondplane;
  raycaster;
  mouse;
  hitMaterial;
  size;

  divisions;
  gridHelper;
  colorCenterLine;
  colorGrid;

  vertices;
  startPositions;
  endPositions;
  time;
  particleCount;

  offscreenScene;   // オフスクリーン用のシーン @@@
  offscreenCamera;  // オフスクリーン用のカメラ @@@
  offscreenPlane;            // 板ポリゴン @@@
  renderTarget;     // オフスクリーン用のレンダーターゲット @@@
  blackColor;       // 背景色出し分けのため @@@
  whiteColor;       // 背景色出し分けのため @@@

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
    
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    
    // マウスオーバーイベント
    window.addEventListener('mousemove', (mouseEvent) => {
      const x = mouseEvent.clientX / window.innerWidth * 2.0 - 1.0;
      const y = mouseEvent.clientY / window.innerHeight * 2.0 - 1.0;
      const v = new THREE.Vector2(x, -y);
      this.raycaster.setFromCamera(v, this.camera);
      const intersects = this.raycaster.intersectObjects(this.planes);
    
      // 全てのplaneを元の色に戻す
      for (let i = 0; i < this.planes.length; i++){
        this.planes[i].material.color.set(0xffffff);
      }
    
      // マウスオーバーしたplaneを赤くする
      if (intersects.length > 0) {
        intersects[0].object.material.color.set(0xff00a0);
      }
    }, false);
    
    // クリックイベント
    window.addEventListener('click', (mouseEvent) => {
      const x = mouseEvent.clientX / window.innerWidth * 2.0 - 1.0;
      const y = mouseEvent.clientY / window.innerHeight * 2.0 - 1.0;
      const v = new THREE.Vector2(x, -y);
      this.raycaster.setFromCamera(v, this.camera);
      const intersects = this.raycaster.intersectObjects(this.planes);
    
      // クリックしたplaneを黄色くする
      if (intersects.length > 0 && intersects[0].object.material.color.getHex() === 0xff00a0) {
        intersects[0].object.material.color.set(0x43a047);
        // パーティクルのジオメトリを更新
        const clickedPlane = intersects[0].object;
        let geometryIndex;
        if (clickedPlane === this.moonplane) {
          geometryIndex = 1;
        } else if (clickedPlane === this.starplane) {
          geometryIndex = 2;
        } else if (clickedPlane === this.diamondplane) {
          geometryIndex = 3;
        }
        this.points.geometry = this.geometries[geometryIndex];
      }  else {
        // plane以外の場所がクリックされた場合、パーティクルを初期状態に戻す
        this.points.geometry = this.geometries[0];
      }
    }, false);

    // ウィンドウのリサイズを検出できるようにする
    window.addEventListener('resize', () => {
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
    }, false);

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

    // フォグ
    this.scene.fog = new THREE.Fog(
        ThreeApp.FOG_PARAM.color,
        ThreeApp.FOG_PARAM.near,
        ThreeApp.FOG_PARAM.far
    );

    // オフスクリーン用のシーン @@@
    // 以下、各種オブジェクトやライトはオフスクリーン用のシーンに add しておく
    this.offscreenScene = new THREE.Scene();

    // カメラ
    this.camera = new THREE.PerspectiveCamera(
      ThreeApp.CAMERA_PARAM.fovy,
      ThreeApp.CAMERA_PARAM.aspect,
      ThreeApp.CAMERA_PARAM.near,
      ThreeApp.CAMERA_PARAM.far,
    );
    this.camera.position.copy(ThreeApp.CAMERA_PARAM.position);
    this.camera.lookAt(ThreeApp.CAMERA_PARAM.lookAt);

    this.offCamera = new THREE.PerspectiveCamera(
        ThreeApp.CAMERA_PARAM2.fovy,
        ThreeApp.CAMERA_PARAM2.aspect,
        ThreeApp.CAMERA_PARAM2.near,
        ThreeApp.CAMERA_PARAM2.far,
      );
      this.offCamera.position.copy(ThreeApp.CAMERA_PARAM2.position);
      this.offCamera.lookAt(ThreeApp.CAMERA_PARAM2.lookAt);

    // ディレクショナルライト（平行光源）
    this.directionalLight = new THREE.DirectionalLight(
      ThreeApp.DIRECTIONAL_LIGHT_PARAM.color,
      ThreeApp.DIRECTIONAL_LIGHT_PARAM.intensity
    );
    this.directionalLight.position.copy(ThreeApp.DIRECTIONAL_LIGHT_PARAM.position);
    this.offscreenScene.add(this.directionalLight);

    // アンビエントライト（環境光）
    this.ambientLight = new THREE.AmbientLight(
      ThreeApp.AMBIENT_LIGHT_PARAM.color,
      ThreeApp.AMBIENT_LIGHT_PARAM.intensity,
    );
    this.offscreenScene.add(this.ambientLight);

    // ディレクショナルライト2（平行光源）
    this.directionalLight2 = new THREE.DirectionalLight(
        ThreeApp.DIRECTIONAL_LIGHT_PARAM2.color,
        ThreeApp.DIRECTIONAL_LIGHT_PARAM2.intensity
        );
        this.directionalLight2.position.copy(ThreeApp.DIRECTIONAL_LIGHT_PARAM2.position);
        this.scene.add(this.directionalLight2);
    
        // アンビエントライト2（環境光）
        this.ambientLight2 = new THREE.AmbientLight(
        ThreeApp.AMBIENT_LIGHT_PARAM.color,
        ThreeApp.AMBIENT_LIGHT_PARAM.intensity,
        );
        this.scene.add(this.ambientLight2);

    // 交差時に表示するためのマテリアルを定義 @@@
    this.hitMaterial = new THREE.MeshPhongMaterial(ThreeApp.INTERSECTION_MATERIAL_PARAM);
    this.hitMaterial.map = this.texture;

    this.planes = [];
    this.planeMaretials = [];
    this.planeGeometry = new THREE.PlaneGeometry(1, 1);

    for (let i = 1; i < 4; i++){
      this.planeMaretial = new THREE.MeshBasicMaterial(ThreeApp.MATERIAL_PARAM2);
      this.plane = new THREE.Mesh(this.planeGeometry, this.planeMaretial);
      this.plane.position.x = i * 2 - 4;
      this.plane.position.y = -3.2;
      this.plane.position.z = 2.5;
      //this.plane.rotation.y = 1.0;
      this.planes.push(this.plane);
      this.planeMaretials.push(this.planeMaretial);
      this.scene.add(this.plane);
      //if (i === 0) this.originalplane = this.plane;
      if (i === 1) this.moonplane = this.plane;
      else if (i === 2) this.starplane = this.plane;
      else if (i === 3) this.diamondplane = this.plane;
    }

    this.images = ['./moon.svg', './star.svg', './diamond.svg'];

    for (let i = 0; i < 3; i++) {
      const image = new Image();
      image.src = this.images[i];
      image.onload = function() {
        const texture = new THREE.Texture(image);
        texture.needsUpdate = true;
        this.planeMaretials[i].map = texture;
        this.planeMaretials[i].needsUpdate = true;
      }.bind(this);
    }

    // パーティクル用のマテリアル
    this.material = new THREE.PointsMaterial(ThreeApp.MATERIAL_PARAM);

    // パーティクルの定義
    this.geometries = []; // 複数のジオメトリを格納する配列
    const COUNT = 10;    // パーティクルの行と列のカウント数
    const WIDTH = 10.0;  // どの程度の範囲に配置するかの幅

    // 3つの異なる形状のジオメトリを作成
// 3つの異なる形状のジオメトリを作成
for (let g = 0; g < 4; ++g) {
    const vertices = []; // 頂点情報を格納する配列
    this.scaleFactor = 5;    
    for (let i = 0; i <= COUNT; ++i) {
      let x = (i / COUNT - 0.5) * WIDTH;
      for(let j = 0; j <= COUNT; ++j){
        let y = (j / COUNT - 0.5) * WIDTH;
        let z;
        if (g === 0) {
          // 形状1
          z = 0.0;
          vertices.push(x, y, z);
        } else if (g === 1)  { 
          for(let k = 0; k < this.vertices[0].length; k += 3) {
            x = this.vertices[0][k] * this.scaleFactor;
            y = this.vertices[0][k + 1] * this.scaleFactor;
            z = this.vertices[0][k + 2] * this.scaleFactor;
            vertices.push(x, y, z);
          }
        } else if (g === 2) {
            for(let k = 0; k < this.vertices[1].length; k += 3) {
              x = this.vertices[1][k] * this.scaleFactor;
              y = this.vertices[1][k + 1] * this.scaleFactor;
              z = this.vertices[1][k + 2] * this.scaleFactor;
              vertices.push(x, y, z);
            }
        } else {  
            for(let k = 0; k < this.vertices[2].length; k += 3) {
              x = this.vertices[2][k] * this.scaleFactor;
              y = this.vertices[2][k + 1] * this.scaleFactor;
              z = this.vertices[2][k + 2] * this.scaleFactor;
              vertices.push(x, y, z);
            }
        }
      }
    }

      const stride = 3;
      const geometry = new THREE.BufferGeometry();
      const attribute = new THREE.BufferAttribute(new Float32Array(vertices), stride);
      geometry.setAttribute('position', attribute);
      this.geometries.push(geometry);
    }

    // 最初のジオメトリでパーティクルを作成
    this.points = new THREE.Points(this.geometries[0], this.material); 
    this.offscreenScene.add(this.points);

    this.pointsGroup = new THREE.Group();
    this.pointsGroup.add(this.points);
    this.offscreenScene.add(this.pointsGroup);

    //グリッドヘルパー
    this.size = 1000;
    this.divisions = 250;
    this.colorCenterLine = 0xff00a0;
    this.colorGrid = 0xff00a0;

    this.gridHelper = new THREE.GridHelper( this.size, this.divisions, this.colorCenterLine, this.colorGrid );
    this.gridHelper.position.set(0.0, -4.8, 0.0);
    this.scene.add( this.gridHelper );
    
    this.size2 = 1000;
    this.divisions2 = 250;
    this.colorCenterLine2 = 0xff00a0;
    this.colorGrid2 = 0xff00a0;

    this.gridHelper2 = new THREE.GridHelper( this.size2, this.divisions2, this.colorCenterLine2, this.colorGrid2 );
    this.gridHelper2.position.set(0.0, 30, 0.0);
    this.gridHelper2.rotation.set(0.0, 0.0, 0.0);
    this.scene.add( this.gridHelper2 );    
    this.gridHelper.add(this.gridHelper2);

    // コントロール
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    // レンダーターゲットをアスペクト比 1.0 の正方形で生成する @@@
    this.renderTarget = new THREE.WebGLRenderTarget(ThreeApp.RENDER_TARGET_SIZE, ThreeApp.RENDER_TARGET_SIZE);

    // オフスクリーン用のカメラは、この時点でのカメラの状態を（使いまわして手間軽減のため）クローンしておく @@@
    this.offscreenCamera = this.offCamera;

    // ただし、最終シーンがブラウザのクライアント領域のサイズなのに対し……
    // レンダーターゲットは正方形なので、アスペクト比は 1.0 に設定を上書きしておく
    this.offCamera.aspect = 1.0;
    this.offCamera.updateProjectionMatrix();

    // レンダリング結果を可視化するのに、板ポリゴンを使う @@@
    const planeGeometry = new THREE.PlaneGeometry(5.0, 5.0);
    const planeMaterial = new THREE.MeshBasicMaterial({color: 0xffffff});
    this.offscreenPlane = new THREE.Mesh(planeGeometry, planeMaterial);

    // 板ポリゴンのマテリアルには、レンダーターゲットに描き込まれた結果を投影したいので……
    // マテリアルの map プロパティにレンダーターゲットのテクスチャを割り当てておく @@@
    planeMaterial.map = this.renderTarget.texture;

    // 板ポリゴンをシーンに追加
    this.scene.add(this.offscreenPlane);
    this.offscreenPlane.position.set(0.0, 0.0, 2.4);

    this.sceneGltf.scene.scale.set(2.5, 2.5, 2.5);
    this.sceneGltf.scene.position.set(0.0, 0.0, 0.0);

    this.scene.add(this.sceneGltf.scene);

    this.monitorGroup = new THREE.Group();
    this.monitorGroup.add(this.offscreenPlane);
    this.monitorGroup.add(this.sceneGltf.scene);
    this.monitorGroup.add(this.plane);
    
    for (let i = 0; i < this.planes.length; i++){
        this.monitorGroup.add(this.planes[i]);
      }
    
    this.scene.add(this.monitorGroup);
    this.monitorGroup.rotation.set(0.0, 0.5, 0.0);

    // 背景色を出し分けるため、あらかじめ Color オブジェクトを作っておく @@@
    this.blackColor = new THREE.Color(0x000000);
    this.whiteColor = new THREE.Color(0x000000);

  }

  async load() {
    const loader = new GLTFLoader();
    // 読み込むファイルのパス @@@
    const gltfPaths = ['./moon.glb','./star.glb','./diamond.glb'];
    this.geometries = [];
    this.vertices = [];
  
    for (let i = 0; i < gltfPaths.length; i++) {
      const gltfPath = gltfPaths[i];
      const gltf = await new Promise((resolve, reject) => {
        loader.load(gltfPath, resolve, undefined, reject);
      });

      // あとで使えるようにプロパティに代入しておく
      this.gltf = gltf;
      this.geometries[i] = gltf.scene.children[0].geometry;
      this.vertices[i] = this.geometries[i].attributes.position.array;
    }
    
    const sceneGltfPath = './monitor.glb';
    this.sceneGltf = await new Promise((resolve, reject) => {
        loader.load(sceneGltfPath, resolve, undefined, reject);
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

    if (this.isDown === true) {
        this.monitorGroup.rotation.y += 0.01;
      }

    this.pointsGroup.rotation.y += 0.01;

    // まず最初に、オフスクリーンレンダリングを行う @@@
    this.renderer.setRenderTarget(this.renderTarget);
    // オフスクリーンレンダリングは常に固定サイズ
    this.renderer.setSize(ThreeApp.RENDER_TARGET_SIZE, ThreeApp.RENDER_TARGET_SIZE);
    // わかりやすくするために、背景を黒にしておく
    this.renderer.setClearColor(this.blackColor, 1.0);
    // オフスクリーン用のシーン（Duck が含まれるほう）を描画する
    this.renderer.render(this.offscreenScene, this.offscreenCamera);

    // 次に最終的な画面の出力用のシーンをレンダリングするため null を指定しもとに戻す @@@
    this.renderer.setRenderTarget(null);
    // 最終的な出力はウィンドウサイズ
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    // わかりやすくするために、背景を白にしておく
    this.renderer.setClearColor(this.whiteColor, 1.0);

    // レンダラーで描画
    this.renderer.render(this.scene, this.camera);
  }
}
