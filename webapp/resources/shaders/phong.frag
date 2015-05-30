uniform highp mat4 uViewMatrix;
uniform highp vec3 uLightPosition;

uniform bool uUseTexture;
uniform highp vec4 uDiffuseColor;
uniform sampler2D uDiffuseTextureSampler;
uniform highp vec4 uSpecularColor;
uniform highp float uSpecularComponent;

varying highp vec3 vMVPosition;
varying highp vec3 vMVNormal;
varying highp vec2 vTexCoord;

void main() {

    highp vec4 texelColor;
    if ( uUseTexture ) {
        texelColor = texture2D( uDiffuseTextureSampler, vTexCoord );
    } else {
        texelColor = uDiffuseColor;
    }
    highp vec3 normal = normalize( vMVNormal );

    highp vec3 vLight = vec3( uViewMatrix * vec4( uLightPosition, 1.0 ) );
    highp vec3 lightDir = normalize( vLight - vMVPosition );
    highp vec3 reflectDir = reflect( -lightDir, normal );
    highp vec3 viewDir = normalize( -vMVPosition );

    highp float diffuse = max( dot( lightDir, normal ), 0.0 );
    highp float specular = 0.0;

    if( diffuse > 0.0 ) {
        highp float specAngle = max( dot( reflectDir, viewDir ), 0.0 );
        specular = pow( specAngle, uSpecularComponent );
    }
    gl_FragColor = vec4(
        texelColor.rgb * 0.1 +
        diffuse * texelColor.rgb +
        specular * uSpecularColor.rgb, texelColor.a );

}
