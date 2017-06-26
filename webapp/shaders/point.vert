precision highp float;

attribute vec4 aPositionAndRadius;
attribute vec4 aColorAndRotation;

uniform mat4 uModelMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;
uniform float uDelta;

varying vec3 vColor;

#define TAU                6.28318530718
#define FLUCTUATION_FACTOR 10.0

float rand(vec3 p) {
    return fract(sin(dot(p.xyx, vec3(12.9898, 78.233, 45.2341))) * 43758.5453) * TAU;
}

float fluctuation(float radius, vec3 pos) {
    return (sin(uDelta * (FLUCTUATION_FACTOR / sqrt(radius)) + rand(pos)) + 1.0) * 0.5;
}

void main() {
    vec3 pos = aPositionAndRadius.xyz;
    float radius = aPositionAndRadius.w;
    // set the size of the point
    gl_PointSize = radius + (radius * fluctuation(radius, pos));
    // set position
    gl_Position = uProjectionMatrix *  uViewMatrix * uModelMatrix * vec4(pos, 1.0);
    // set color
    vColor = aColorAndRotation.rgb;
}
