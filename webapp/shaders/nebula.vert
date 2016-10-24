precision highp float;

attribute vec3 aVertexPosition;

uniform mat4 uModelMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;

varying vec3 vPosition;

void main() {
    gl_Position = uProjectionMatrix *  uViewMatrix * uModelMatrix * vec4(aVertexPosition, 1.0);
    vPosition = aVertexPosition.xyz;
}
