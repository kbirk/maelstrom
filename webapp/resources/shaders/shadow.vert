attribute highp vec3 aVertexPosition;

uniform highp mat4 uLightViewMatrix;
uniform highp mat4 uLightProjectionMatrix;
uniform highp mat4 uModelMatrix;

void main() {
    gl_Position = uLightProjectionMatrix * uLightViewMatrix * uModelMatrix * vec4( aVertexPosition, 1.0 );
}
