'use strict';

function vec3(x = 0, y = 0, z = 0) {
    const v = new Float32Array(3);
    v[0] = x;
    v[1] = y;
    v[2] = z;
    return v;
}

function normalize(out) {
    const x = out[0];
    const y = out[1];
    const z = out[2];
    const len = (x * x) + (y * y) + (z * z);
    if (len > 0) {
        const invLen = 1 / Math.sqrt(len);
        out[0] = x * invLen;
        out[1] = y * invLen;
        out[2] = z * invLen;
    }
    return out;
}

function add(out, a, b) {
    out.x = a.x + b.x;
    out.y = a.y + b.y;
    out.z = a.z + b.z;
    return out;
}

function sub(out, a, b) {
    out.x = a.x - b.x;
    out.y = a.y - b.y;
    out.z = a.z - b.z;
    return out;
}

function scale(out, a, s) {
    out.x = a.x * s;
    out.y = a.y * s;
    out.z = a.z * s;
    return out;
}

module.exports = {
    new: vec3,
    normalize: normalize,
    add: add,
    sub: sub,
    scale: scale
};
