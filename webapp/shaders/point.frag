uniform sampler2D uPointSampler;
uniform highp float uOpacity;

varying highp vec3 vColor;

void main() {
    highp vec3 texelColor = texture2D(uPointSampler, gl_PointCoord).rgb;
    gl_FragColor = vec4(texelColor + texelColor * vColor, uOpacity);
}
