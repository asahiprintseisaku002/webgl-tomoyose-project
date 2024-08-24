precision mediump float;

uniform bool        reflection;  // 法線による反射を行うかどうか
uniform vec3        eyePosition; // 視点の座標
uniform samplerCube u_texture1; // キューブマップテクスチャ
uniform samplerCube u_texture2;
uniform samplerCube u_texture3;
uniform float       progress;
uniform float       u_time; 
uniform vec2        u_resolution;
uniform float       radius;
uniform float       width;
varying vec3        vPosition;   // モデル座標変換後の頂点の位置
varying vec3        vNormal;     // 法線

float parabola( float x, float k ) {
  return pow( 4.0 * x * ( 1.0 - x ), k );
}

void main() {
  // 頂点座標とカメラの位置から視線ベクトルを算出
  vec3 eyeDirection = normalize(vPosition - eyePosition);

  // 念の為、確実に単位化してから使う
  vec3 normal = normalize(vNormal);

  // 反射ベクトルに用いる変数（初期状態は法線と同じにしておく）
  vec3 reflectVector = normal;

  // もし反射有効なら reflect で反射ベクトルを求める
  if (reflection) {
    reflectVector = reflect(eyeDirection, normal);
  }

  
  // リップルの起点をvPositionの特定の位置に設定
  vec3 rippleCenter = vec3(0.0, 0.0, 0.0);  // 中心点の設定

  // 中心からの距離を計算
  float dist = distance(vPosition, rippleCenter);

  // リップルの強度計算
  float ripple = sin(dist * 60.0 - u_time * 5.0) * 0.1;  // 波の周期と速度を調整

  // リップルエフェクトを反映したベクトルでテクスチャをサンプリング
  vec4 color1 = textureCube(u_texture1, reflectVector + ripple * normal);
  vec4 color2 = textureCube(u_texture2, reflectVector + ripple * normal);
  vec4 color3 = textureCube(u_texture3, reflectVector + ripple * normal);

  vec4 finalColor;
  //gl_FragColor = vec4(ripple, 0.0, 0.0, 1.0);
  // 進捗に応じて色をブレンド
  if (progress < 1.0) {
    finalColor = mix(color1, color2, progress);
  } else {
    finalColor = mix(color2, color3, progress - 1.0);
  }

  gl_FragColor = finalColor;
}
