precision highp float;

uniform sampler2D uPointSampler;
uniform float uOpacity;

varying vec3 vColor;

void main() {
    vec3 texelColor = texture2D(uPointSampler, gl_PointCoord).rgb;
    gl_FragColor = vec4(texelColor + texelColor * vColor, uOpacity);
}
