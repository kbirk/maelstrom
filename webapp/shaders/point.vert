attribute highp vec3 aVertexPosition;
attribute highp vec4 aColorAndRadius;

uniform highp mat4 uModelMatrix;
uniform highp mat4 uViewMatrix;
uniform highp mat4 uProjectionMatrix;

uniform highp float uDelta;

varying highp vec3 vColor;

highp float rand(highp vec3 p){
    return fract(sin(dot(p.xyx , vec3(12.9898, 78.233, 45.2341))) * 43758.5453)*1000.0;
}

void main() {
    // set color
    vColor = aColorAndRadius.rgb;
    // set the size of the point
    highp float fluctuation = (sin(uDelta*length(aVertexPosition)/300.0 + rand(aVertexPosition)) + 1.0) / 2.0;
    gl_PointSize = aColorAndRadius.w + (aColorAndRadius.w * fluctuation);
    // set position
    gl_Position = uProjectionMatrix *  uViewMatrix * uModelMatrix * vec4(aVertexPosition, 1.0);
}
