
attribute vec3 position;
attribute vec3 normal;
attribute vec4 color;
uniform mat4 mMatrix;
uniform mat4 mvpMatrix;
varying vec3 vPosition;
varying vec3 vNormal;
varying vec4 vColor;


// ライトベクトルはひとまず定数で定義する
//const vec3 light = vec3(1.0, 1.0, 1.0);

void main() {
  // ワールド空間上での頂点の位置を求めてフラグメントシェーダへ
  vPosition = (mMatrix * vec4(position, 1.0)).xyz;

  // 法線と色はそのまま渡す
  vNormal = normal;
  vColor = color;
  

  // 変換した法線とライトベクトルで内積を取る @@@
  //float d = dot(normalize(n), normalize(light));
  //d = d * 0.5 + 0.5;

  // 内積の結果を頂点カラーの RGB 成分に乗算する
  //vColor = vec4(color.rgb * d, color.a);
  //vColor = vec4(normal, 1.0);

  // MVP 行列と頂点座標を乗算してから出力する
  gl_Position = mvpMatrix * vec4(position, 1.0);
}

