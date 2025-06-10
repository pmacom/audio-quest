// Simple default vertex shader
export const DefaultVertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

// Simple default fragment shader  
export const DefaultFragmentShader = `
uniform float uTime;
varying vec2 vUv;

void main() {
  vec2 uv = vUv;
  vec3 color = vec3(uv.x, uv.y, 0.5 + 0.5 * sin(uTime));
  gl_FragColor = vec4(color, 1.0);
}
`;
