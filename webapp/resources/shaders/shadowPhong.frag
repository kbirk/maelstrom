uniform highp mat4 uViewMatrix;
uniform highp vec3 uLightPosition;

uniform bool uUseTexture;
uniform highp vec4 uDiffuseColor;
uniform sampler2D uDiffuseTextureSampler;
uniform highp vec4 uSpecularColor;
uniform highp float uSpecularComponent;

uniform sampler2D uShadowSampler;

uniform highp float uReflection;
uniform highp float uRefraction;

uniform samplerCube uCubeMapSampler;

uniform highp mat4 uInverseViewMatrix;

varying highp vec3 vMVPosition;
varying highp vec3 vMVNormal;
varying highp vec2 vTexCoord;
varying highp vec4 vShadowPosition;

highp float DecodeFloatRGBA( highp vec4 rgba ) {
    return dot( rgba, vec4( 1.0, 1.0/255.0, 1.0/65025.0, 1.0/160581375.0 ) );
}

void main() {

    // get the color of the texel
    highp vec4 texelColor;
    if ( uUseTexture ) {
        texelColor = texture2D( uDiffuseTextureSampler, vTexCoord );
    } else {
        texelColor = uDiffuseColor;
    }

    // exit early if pixel is clear
    if ( texelColor.a <= 0.0 ) {
        discard;
    }

    highp vec3 normal = normalize( vMVNormal );
    highp vec3 vLight = vec3( uViewMatrix * vec4( uLightPosition, 1.0 ) );
    highp vec3 lightDir = normalize( vLight - vMVPosition );

    highp vec3 shadowCoord = vec3( vShadowPosition ) / vShadowPosition.w;
    highp float visibility = 1.0;

    highp float BIAS_WEIGHT = 0.0002;
    highp float bias = BIAS_WEIGHT*tan(acos( dot( normal, lightDir ) ));
    bias = clamp( bias, 0.0, BIAS_WEIGHT );

    if ( shadowCoord.x > 1.0 || shadowCoord.x < 0.0 ||
         shadowCoord.y > 1.0 || shadowCoord.y < 0.0 ) {
        // outside of shadow map, consider it in shadow
        visibility = 0.0;
    } else {
        highp float depth = DecodeFloatRGBA( texture2D( uShadowSampler, shadowCoord.xy ) );
        if ( depth < shadowCoord.z - bias ) {
            visibility = 0.0;
        }
    }

    highp float ambient = 0.15;
    highp float diffuse = max( dot( lightDir, normal ), 0.0 );
    highp float specular = 0.0;

    if ( visibility > 0.0 ) {
        // only do specular if light actually hits the surface
        if ( diffuse > 0.0 ) {
            highp vec3 reflectDir = reflect( -lightDir, normal );
            highp vec3 viewDir = normalize( -vMVPosition );
            highp float specAngle = max( dot( reflectDir, viewDir ), 0.0 );
            specular = pow( specAngle, uSpecularComponent );
        }
    }

    highp vec3 incidentEye = normalize( vMVPosition );

    highp vec4 color = vec4(
        ambient * texelColor.rgb +
        diffuse * visibility * texelColor.rgb +
        specular * uSpecularColor.rgb, texelColor.a );

    // calculate reflection
    if ( uReflection > 0.0 ) {
        // reflect ray around normal from eye to surface
        highp vec3 reflected = reflect( incidentEye, normal );
        // convert from eye to world space
        reflected = vec3( uInverseViewMatrix * vec4( reflected, 0.0 ) );
        highp vec4 reflectionColor = textureCube( uCubeMapSampler, reflected );
        color.rgb = mix( color.rgb, reflectionColor.rgb, uReflection );
    }

    // calculate reflection
    if ( uRefraction > 0.0 ) {
        // refract ray around normal from eye to surface
        highp float refractionIndex = 0.6667;
        highp vec3 refracted = refract( incidentEye, normal, refractionIndex );
        // convert from eye to world space
        refracted = vec3( uInverseViewMatrix * vec4( refracted, 0.0 ) );
        highp vec4 refractionColor = textureCube( uCubeMapSampler, refracted, 1.0 );
        color.rgb = mix( color.rgb, refractionColor.rgb, uRefraction*0.5 );
    }

    gl_FragColor = color;
}
