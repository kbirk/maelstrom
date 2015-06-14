uniform samplerCube uCubeMapSampler;

uniform highp float uDelta;
uniform highp float uOpacity;
uniform highp float uIndex;

varying highp vec3 vPosition;

highp float noise( highp float a, highp float b ) {
    highp float AMPL = 0.004; // height of the ripples
    highp float PERIOD = 0.15; // spacing of the ripples
    highp float SPEED = 0.75; // speed
    highp float timeOffset = uDelta + uIndex;
    return AMPL *
        sin( ( a * ( 2.0 * 3.141 / PERIOD ) ) + ( timeOffset * SPEED ) ) *
        cos( ( b * ( 2.0 * 3.141 / PERIOD ) ) + ( timeOffset * SPEED ) );
}

void main() {
    highp vec3 texCoord = vec3(
        vPosition.x + noise( vPosition.y, vPosition.y ),
        vPosition.y + noise( vPosition.x, vPosition.z ),
        vPosition.z + noise( vPosition.x, vPosition.y ) );
    gl_FragColor = vec4( textureCube( uCubeMapSampler, texCoord ).rgb, uOpacity );
}
