precision mediump float;

uniform bool        reflection;    // 法線による反射を行うかどうか
uniform vec3        eyePosition;   // 視点の座標
uniform vec3        rippleCenter;  // リップルの中心位置
uniform samplerCube u_texture1;    // キューブマップテクスチャ
uniform samplerCube u_texture2;
uniform samplerCube u_texture3;
uniform float       progress;      // 進捗状況（背景の切り替えに使用）
uniform float       u_time;
varying vec3        vPosition;     // モデル座標変換後の頂点の位置
varying vec3        vNormal;       // 法線

void main() {
    // 頂点座標とカメラの位置から視線ベクトルを算出
    vec3 eyeDirection = normalize(vPosition - eyePosition);

    // 法線を単位化して利用
    vec3 normal = normalize(vNormal);

    // 反射ベクトル
    vec3 reflectVector = reflect(eyeDirection, normal);

    // リップルの中心からの距離を計算
    float dist = distance(vPosition, rippleCenter);

    // リップルの強度計算 - u_timeに基づいてリップルが広がるようにする
    float ripple = sin(dist * 20.0 - u_time * 5.0) * 0.1;  // u_timeを使用してリップルが広がる

    // テクスチャのサンプリングにリップルを適用
    vec4 color1 = textureCube(u_texture1, reflectVector + ripple * normal);
    vec4 color2 = textureCube(u_texture2, reflectVector + ripple * normal);
    vec4 color3 = textureCube(u_texture3, reflectVector + ripple * normal);

    // progressに基づいて背景のテクスチャを切り替え
    vec4 finalColor;
    if (progress < 1.0) {
        finalColor = mix(color1, color2, progress);
    } else {
        finalColor = mix(color2, color3, progress - 1.0);
    }

    gl_FragColor = finalColor;
}
