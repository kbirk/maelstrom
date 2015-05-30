attribute highp vec3 aVertexPosition;
attribute highp vec3 aVertexNormal;
attribute highp vec2 aTextureCoord;
attribute highp vec4 aJointIndex;
attribute highp vec4 aJointWeight;

uniform highp mat4 uViewMatrix;
uniform highp mat4 uModelMatrix;
uniform highp mat4 uProjectionMatrix;
uniform highp mat4 uJointMatrices[36];

varying highp vec3 vMVPosition;
varying highp vec3 vMVNormal;
varying highp vec2 vTexCoord;

void main() {
    highp mat4 skinMat = aJointWeight.x * uJointMatrices[ int( aJointIndex.x ) ];
    skinMat += aJointWeight.y * uJointMatrices[ int( aJointIndex.y ) ];
    skinMat += aJointWeight.z * uJointMatrices[ int( aJointIndex.z ) ];
    skinMat += aJointWeight.w * uJointMatrices[ int( aJointIndex.w ) ];
    highp vec4 mvPos = uViewMatrix * uModelMatrix * skinMat * vec4( aVertexPosition, 1.0 );
    vMVPosition = vec3( mvPos ) / mvPos.w;
    vMVNormal =  mat3( uViewMatrix * uModelMatrix * skinMat ) * aVertexNormal;
    vTexCoord = aTextureCoord;
    gl_Position = uProjectionMatrix * mvPos;
}
