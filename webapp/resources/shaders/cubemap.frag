uniform samplerCube uCubeMapSampler;
uniform highp float uOpacity;

varying highp vec3 vPosition;

void main() {
    gl_FragColor = vec4( textureCube( uCubeMapSampler, vPosition ).rgb, uOpacity );
}
