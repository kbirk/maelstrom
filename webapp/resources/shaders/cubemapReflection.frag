uniform samplerCube uCubeMapSampler;
uniform highp mat4 uViewMatrix;
uniform highp mat4 uInverseViewMatrix;

varying highp vec3 vEyePosition;
varying highp vec3 vEyeNormal;

void main () {
  // reflect ray around normal from eye to surface
  highp vec3 incidentEye = normalize( vEyePosition );
  highp vec3 normal = normalize( vEyeNormal );
  highp vec3 reflected = reflect( incidentEye, normal );
  // convert from eye to world space
  reflected = vec3( uInverseViewMatrix * vec4( reflected, 0.0 ) );
  gl_FragColor = textureCube( uCubeMapSampler, reflected );
}
