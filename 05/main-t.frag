precision mediump float;

// 経過時間を uniform 変数（の浮動小数点）として受け取る
uniform float time;

varying vec4 vColor;

void main() {
  // 時間の経過からサイン波を作り、絶対値で点滅させるようにする
  //vec3 rgb = vColor.rgb * abs(sin(time));
  vec3 rgb  = (1.0 - abs(sin(2.0 * time))) * vec3(1.0, 0.41, 0.0) + abs(sin(2.0 * time)) * vColor.rgb;
  // フラグメントの色
  gl_FragColor = vec4(rgb, vColor.a);
}

