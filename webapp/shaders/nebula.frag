precision highp float;

uniform samplerCube uCubeMapSampler;

uniform float uDelta;
uniform float uOpacity;
uniform float uIndex;

varying vec3 vPosition;

float noise(float a, float b) {
    float AMPL = 0.004; // height of the ripples
    float PERIOD = 0.15; // spacing of the ripples
    float SPEED = 0.75; // speed
    float timeOffset = uDelta + uIndex;
    return AMPL *
        sin((a * (2.0 * 3.1415926 / PERIOD)) + (timeOffset * SPEED)) *
        cos((b * (2.0 * 3.1415926 / PERIOD)) + (timeOffset * SPEED));
}

void main() {
    vec3 texCoord = vec3(
        vPosition.x + noise(vPosition.y, vPosition.y),
        vPosition.y + noise(vPosition.x, vPosition.z),
        vPosition.z + noise(vPosition.x, vPosition.y));
    gl_FragColor = vec4(textureCube(uCubeMapSampler, texCoord).rgb, uOpacity);
}
