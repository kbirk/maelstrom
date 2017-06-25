precision highp float;

attribute vec4 aPositionAndRadius;
attribute vec4 aColorAndRotation;

uniform mat4 uModelMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;
uniform float uDelta;

varying vec3 vColor;

float rand(vec3 p){
    return fract(sin(dot(p.xyx , vec3(12.9898, 78.233, 45.2341))) * 43758.5453) * 1000.0;
}

void main() {
    // set color
    vColor = aColorAndRotation.rgb;
    // radius
    vec3 position = aPositionAndRadius.xyz;
    float radius = aPositionAndRadius.w;
    // set the size of the point
    float fluctuation = (sin(uDelta * length(position) / 300.0 + rand(position)) + 1.0) / 2.0;
    gl_PointSize = radius + (radius * fluctuation);
    // set position
    gl_Position = uProjectionMatrix *  uViewMatrix * uModelMatrix * vec4(position, 1.0);
}
