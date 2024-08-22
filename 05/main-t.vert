
attribute vec3 position;
attribute vec4 color;
varying vec4 vColor;

void main() {
  // フラグメントシェーダに送る色の情報を varying 変数に代入
  vColor = color;
  color = vec4(normal, 1.0);
  // 頂点座標の出力
  gl_Position = vec4(position, 1.0);
}

