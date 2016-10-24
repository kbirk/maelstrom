precision highp float;

uniform samplerCube uCubeMapSampler;
uniform float uOpacity;

varying vec3 vPosition;

void main() {
    gl_FragColor = vec4(textureCube(uCubeMapSampler, vPosition).rgb, uOpacity);
}
