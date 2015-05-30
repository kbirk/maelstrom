attribute highp vec3 aVertexPosition;
attribute highp vec3 aVertexNormal;
attribute highp vec2 aTextureCoord;

uniform highp mat4 uViewMatrix;
uniform highp mat4 uModelMatrix;
uniform highp mat4 uProjectionMatrix;

varying highp vec3 vMVPosition;
varying highp vec3 vMVNormal;
varying highp vec2 vTexCoord;

void main() {
    highp vec4 mvPos = uViewMatrix * uModelMatrix * vec4( aVertexPosition, 1.0 );
    gl_Position = uProjectionMatrix * mvPos;
    vMVPosition = vec3( mvPos ) / mvPos.w;
    vMVNormal = mat3( uViewMatrix * uModelMatrix ) * aVertexNormal;
    vTexCoord = aTextureCoord;
}
