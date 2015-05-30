attribute highp vec3 aVertexPosition;

uniform highp mat4 uModelMatrix;
uniform highp mat4 uViewMatrix;
uniform highp mat4 uProjectionMatrix;

void main(){
    gl_Position = uProjectionMatrix *  uViewMatrix * uModelMatrix * vec4( aVertexPosition, 1.0 );
}