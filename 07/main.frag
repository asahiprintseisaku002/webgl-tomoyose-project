precision mediump float;

uniform bool        reflection;   // 法線による反射を行うかどうか
uniform vec3        eyePosition;  // 視点の座標
uniform samplerCube u_texture1;   // キューブマップテクスチャ
uniform samplerCube u_texture2;
uniform samplerCube u_texture3;
uniform float       progress;
uniform float       u_time;       // 時間
uniform bool        applyRipple;  // リップルを適用するかどうか
varying vec3        vPosition;    // モデル座標変換後の頂点の位置
varying vec3        vNormal;      // 法線

void main() {
  // 視線ベクトルを算出
  vec3 eyeDirection = normalize(vPosition - eyePosition);
  vec3 normal = normalize(vNormal);
  vec3 reflectVector = normal;

  if (reflection) {
    reflectVector = reflect(eyeDirection, normal);
  }
  //reflectVector.y = -reflectVector.y;
  vec3 rippleVector = reflectVector;

  if (applyRipple) {
    // リップルの中心からの距離を計算
    float dist = distance(vPosition, vec3(0.0, 0.0, 0.0));

    // 時間と距離に基づいてリップルを計算
    float speed = 20.0;    // リップルが広がる速度
    float frequency = 20.0; // 波の周波数
    float phase = dist * frequency - u_time * speed;
    
    // 波の減衰と強さ
    float attenuation = exp(-dist * 2.0); // 距離による減衰
    float ripple = sin(phase) * attenuation;

    // リップル効果を反映したベクトルでテクスチャをサンプリング
    rippleVector = reflectVector + ripple * normal;
  }
  rippleVector.y = -rippleVector.y; // Y軸を反転

  vec4 color1 = textureCube(u_texture1, rippleVector);
  vec4 color2 = textureCube(u_texture2, rippleVector);
  vec4 color3 = textureCube(u_texture3, rippleVector);

  vec4 finalColor;
  if (progress < 1.0) {
    finalColor = mix(color1, color2, progress);
  } else {
    finalColor = mix(color2, color3, progress - 1.0);
  }

  gl_FragColor = finalColor;
  //gl_FragColor = vec4(progress, 0.0, 0.0, 1.0); //デバッグ用

}
