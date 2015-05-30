uniform samplerCube uCubeMapSampler;

varying highp vec3 vPosition;

void main() {
    gl_FragColor = textureCube( uCubeMapSampler, vPosition );
}
