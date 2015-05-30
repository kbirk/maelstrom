uniform sampler2D uColorTextureSampler;

varying highp vec2 vTexCoord;

void main(void) {
    highp vec4 texelColor = texture2D( uColorTextureSampler, vTexCoord );
    gl_FragColor = texelColor;
}
