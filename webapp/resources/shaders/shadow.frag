highp vec4 EncodeFloatRGBA( highp float v ) {
    highp vec4 enc = vec4( 1.0, 255.0, 65025.0, 160581375.0 ) * v;
    enc = fract( enc );
    enc -= enc.yzww * vec4( 1.0/255.0, 1.0/255.0, 1.0/255.0, 0.0 );
    return enc;
}
void main() {
    gl_FragColor = EncodeFloatRGBA( gl_FragCoord.z );
}
