precision mediump float;

uniform vec3 eyePosition;
uniform mat4 normalMatrix;
varying vec3 vPosition;
varying vec3 vNormal;
varying vec4 vColor;

const vec3 light = vec3(1.0, 1.0, 1.0);

void main() {
  vec3 n = normalize((normalMatrix * vec4(normalize(vNormal), 0.0)).xyz);
  float d = dot(n, normalize(light));
  d = d * 0.25 + 0.25;

  vec3 e = normalize(vPosition - eyePosition);
  e = reflect(e, n);
  float s = clamp(dot (e, normalize(light)), 0.0, 1.0);
  s = pow(s, 10.0);
  //vColor = vec4(color.rgb * d, color.a);
  vec4 color = vec4(vColor.rgb * d + s, vColor.a);
  float gamma = 1.0 / 2.2;
  vec3 rgb = pow(color.rgb, vec3(gamma));
  gl_FragColor = vec4(rgb, color.a);
}

