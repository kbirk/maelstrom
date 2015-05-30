attribute highp vec3 aVertexPosition;
attribute highp vec3 aVertexNormal;

uniform highp mat4 uModelMatrix;
uniform highp mat4 uViewMatrix;
uniform highp mat4 uProjectionMatrix;

varying highp vec3 vEyePosition;
varying highp vec3 vEyeNormal;

void main() {
  vEyePosition = vec3( uViewMatrix * uModelMatrix * vec4( aVertexPosition, 1.0 ) );
  vEyeNormal = vec3( uViewMatrix * uModelMatrix * vec4 ( aVertexNormal, 0.0 ) );
  gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * vec4( aVertexPosition, 1.0 );
}
