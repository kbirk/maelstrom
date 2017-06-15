precision highp float;

uniform samplerCube uCubeMapSampler;
uniform float uDelta;
uniform float uOpacity;
uniform float uIndex;

varying vec3 vPosition;

#define AMPL        0.004 // height of the ripples
#define PERIOD      0.15  // spacing of the ripples
#define SPEED       0.75  // speed of ripples
#define TAU_PERIOD  (2.0 * 3.1415926 / PERIOD) // tau divided by the period

float noise(float a, float b) {
    float timeOffset = uDelta + uIndex;
    return AMPL *
        sin((a * TAU_PERIOD) + (timeOffset * SPEED)) *
        cos((b * TAU_PERIOD) + (timeOffset * SPEED));
}

void main() {
    vec3 texCoord = vec3(
        vPosition.x + noise(vPosition.x, vPosition.y),
        vPosition.y + noise(vPosition.y, vPosition.z),
        vPosition.z + noise(vPosition.z, vPosition.x));
    gl_FragColor = vec4(textureCube(uCubeMapSampler, texCoord).rgb, uOpacity);
}
