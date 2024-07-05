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
    position: new THREE.Vector3(0.0, 2.0, 20.0),
    lookAt: new THREE.Vector3(0.0, 0.0, 0.0),
  };
  /**
   * レンダラー定義のための定数
   */
  static RENDERER_PARAM = {
    clearColor: 0x0b0b0b, // パーティクルが目立つように背景は黒に @@@
    width: window.innerWidth,
    height: window.innerHeight,
  };
  /**
   * マテリアル定義のための定数（パーティクル用） @@@
   */
  static MATERIAL_PARAM = {
    color: 0xffffff,      // パーティクルの色
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

  static AMBIENT_LIGHT_PARAM = {
    color: 0xffffff,
    intensity: 0.1,
  };
  //ライトここまで

  static INTERSECTION_MATERIAL_PARAM = {
    color: 0x00ffff,
  };

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
  texture;
  points;           // パーティクルの実態（点群のメッシュに相当） @@@
  controls;         // オービットコントロール
  axesHelper;       // 軸ヘルパー
  svg;
  svgLoader;
  svgGroup;
  gltfLoader;
  gltfs;
  imageLoader;
  images;
  originalplane;
  moon;
  moonplane;
  star;
  starplane;
  diamond;
  diamondplane;
  raycaster;
  hitMaterial;
  currentGeometryIndex;
  mouse;


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
    /*
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
        intersects[0].object.material.color.set(0xff0000);
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
      if (intersects.length > 0 && intersects[0].object.material.color.getHex() === 0xff0000) {
        intersects[0].object.material.color.set(0xffff00);
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
    */
    // ウィンドウのリサイズを検出できるようにする
    window.addEventListener('resize', () => {
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
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

 

    // 軸ヘルパー
    const axesBarLength = 20.0;
    this.axesHelper = new THREE.AxesHelper(axesBarLength);
    this.scene.add(this.axesHelper);

    // コントロール
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    this.material = new THREE.PointsMaterial(ThreeApp.MATERIAL_PARAM);

    this.geometry = new THREE.BufferGeometry(); 
    const COUNT = 10;  
    const WIDTH = 10.0; 
    const vertices = []; 
    for (let i = 0; i <= COUNT; ++i) {
      const x = (i / COUNT - 0.5) * WIDTH;
      for(let j = 0; j <= COUNT; ++j){
        const y = (j / COUNT - 0.5) * WIDTH;
        vertices.push(x, y, 0.0);
      }
    }

    const stride = 3;
    const attribute = new THREE.BufferAttribute(new Float32Array(vertices), stride);
 
    this.geometry.setAttribute('position', attribute);
    this.points = new THREE.Points(this.geometry, this.material);
    this.scene.add(this.points);
  }

  async load(){
    const svgUrl = './moon.svg';
    this.svgLoader = new SVGLoader();

    const svgData = await new Promise((resolve)=>{
        this.svgLoader.load(svgUrl, resolve);
    })

    const group = new THREE.Group();
    let renderOrder = 0;

    for ( const path of svgData.paths ) {

        const fillColor = path.userData.style.fill;

        if ( fillColor !== undefined && fillColor !== 'none' ) {

            const material = new THREE.MeshBasicMaterial( {
                color: new THREE.Color().setStyle( fillColor ),
                opacity: path.userData.style.fillOpacity,
                transparent: true,
                side: THREE.DoubleSide,
                depthWrite: false,
                wireframe: false
            } );

            const shapes = path.toShapes(true);

            for ( const shape of shapes ) {
                const geometry = new THREE.ShapeGeometry( shape );
                const mesh = new THREE.Mesh( geometry, material );
                mesh.renderOrder = renderOrder ++;
                group.add( mesh );
            }
        }

        const strokeColor = path.userData.style.stroke;

        if ( strokeColor !== undefined && strokeColor !== 'none' ) {

            const material = new THREE.MeshBasicMaterial( {
                color: new THREE.Color().setStyle( strokeColor ),
                opacity: path.userData.style.strokeOpacity,
                transparent: true,
                side: THREE.DoubleSide,
                depthWrite: false,
                wireframe: false
            } );

            for ( const subPath of path.subPaths ) {
                const geometry = this.svgLoader.pointsToStroke( subPath.getPoints(), path.userData.style );
                if ( geometry ) {
                    const mesh = new THREE.Mesh( geometry, material );
                    mesh.renderOrder = renderOrder ++;
                    group.add( mesh );
                }
            }
        }
    }

    this.scene.add( group );
    this.render();
}

 

  /**
   * 描画処理
   */
  render() {
    // 恒常ループ
    requestAnimationFrame(this.render);

    // コントロールを更新
    this.controls.update();

    // レンダラーで描画
    this.renderer.render(this.scene, this.camera);
  }
}
