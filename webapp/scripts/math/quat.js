'use strict';

const vec3 = require('./vec3');

// use to store temp values rather than allocate everytime
const temp = quat();
const tx = vec3.new();
const ty = vec3.new();
const tz = vec3.new();

function quat() {
    const q = new Float32Array(4);
    q[0] = 0;
    q[1] = 0;
    q[2] = 0;
    q[3] = 1;
    return q;
}

function identity(out) {
    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
    out[3] = 1;
    return out;
}

function multiply(out, a, b) {
    const ax = a[0];
    const ay = a[1];
    const az = a[2];
    const aw = a[3];
    const bx = b[0];
    const by = b[1];
    const bz = b[2];
    const bw = b[3];
    out[0] = ax * bw + aw * bx + ay * bz - az * by;
    out[1] = ay * bw + aw * by + az * bx - ax * bz;
    out[2] = az * bw + aw * bz + ax * by - ay * bx;
    out[3] = aw * bw - ax * bx - ay * by - az * bz;
    return normalize(out);
};

function rotation(out, axis, angle) {
    angle = angle * 0.5;
    axis = vec3.normalize(axis);
    const s = Math.sin(angle);
    out[0] = s * axis[0];
    out[1] = s * axis[1];
    out[2] = s * axis[2];
    out[3] = Math.cos(angle);
    return normalize(out);
}

function rotate(out, q, axis, angle) {
    const r = rotation(temp, axis, angle);
    return multiply(q, q, r);
}

function rotateX(out, a, rad) {
    rad *= 0.5;
    const ax = a[0];
    const ay = a[1];
    const az = a[2];
    const aw = a[3];
    const bx = Math.sin(rad);
    const bw = Math.cos(rad);
    out[0] = ax * bw + aw * bx;
    out[1] = ay * bw + az * bx;
    out[2] = az * bw - ay * bx;
    out[3] = aw * bw - ax * bx;
    return normalize(out);
}

function rotateY(out, a, rad) {
    rad *= 0.5;
    const ax = a[0];
    const ay = a[1];
    const az = a[2];
    const aw = a[3];
    const by = Math.sin(rad);
    const bw = Math.cos(rad);
    out[0] = ax * bw - az * by;
    out[1] = ay * bw + aw * by;
    out[2] = az * bw + ax * by;
    out[3] = aw * bw - ay * by;
    return normalize(out);
}

function rotateZ(out, a, rad) {
    rad *= 0.5;
    const ax = a[0];
    const ay = a[1];
    const az = a[2];
    const aw = a[3];
    const bz = Math.sin(rad);
    const bw = Math.cos(rad);
    out[0] = ax * bw + ay * bz;
    out[1] = ay * bw - ax * bz;
    out[2] = az * bw + aw * bz;
    out[3] = aw * bw - az * bz;
    return normalize(out);
}

function matrix(out, q) {
    const x = q[0];
    const y = q[1];
    const z = q[2];
    const w = q[3];
    const x2 = x + x;
    const y2 = y + y;
    const z2 = z + z;
    const xx = x * x2;
    const yx = y * x2;
    const yy = y * y2;
    const zx = z * x2;
    const zy = z * y2;
    const zz = z * z2;
    const wx = w * x2;
    const wy = w * y2;
    const wz = w * z2;
    out[0] = 1 - yy - zz;
    out[1] = yx + wz;
    out[2] = zx - wy;
    out[3] = 0;
    out[4] = yx - wz;
    out[5] = 1 - xx - zz;
    out[6] = zy + wx;
    out[7] = 0;
    out[8] = zx + wy;
    out[9] = zy - wx;
    out[10] = 1 - xx - yy;
    out[11] = 0;
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = 1;
    return out;
}

function axes(ax, ay, az, q) {
    const x = q[0];
    const y = q[1];
    const z = q[2];
    const w = q[3];
    const x2 = x + x;
    const y2 = y + y;
    const z2 = z + z;
    const xx = x * x2;
    const yx = y * x2;
    const yy = y * y2;
    const zx = z * x2;
    const zy = z * y2;
    const zz = z * z2;
    const wx = w * x2;
    const wy = w * y2;
    const wz = w * z2;
    ax[0] = 1 - yy - zz;
    ax[1] = yx + wz;
    ax[2] = zx - wy;
    vec3.normalize(ax);
    ay[0] = yx - wz;
    ay[1] = 1 - xx - zz;
    ay[2] = zy + wx;
    vec3.normalize(ay);
    az[0] = zx + wy;
    az[1] = zy - wx;
    az[2] = 1 - xx - yy;
    vec3.normalize(az);
}

function view(out, q) {
    axes(tx, ty, tz, q);
    out[0] = tx[0];
    out[1] = ty[0];
    out[2] = tz[0];
    out[3] = 0;
    out[4] = tx[1];
    out[5] = ty[1];
    out[6] = tz[1];
    out[7] = 0;
    out[8] = tx[2];
    out[9] = ty[2];
    out[10] = tz[2];
    out[11] = 0;
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = 1;
    return out;
}

function normalize(out) {
    const x = out[0];
    const y = out[1];
    const z = out[2];
    const w = out[3];
    const len = (x * x) + (y * y) + (z * z) + (w * w);
    if (len > 0) {
        const invLen = 1 / Math.sqrt(len);
        out[0] = x * invLen;
        out[1] = y * invLen;
        out[2] = z * invLen;
        out[3] = w * invLen;
    }
    return out;
}

module.exports = {
    new: quat,
    identity: identity,
    rotation: rotation,
    rotate: rotate,
    rotateX: rotateX,
    rotateY: rotateY,
    rotateZ: rotateZ,
    axes: axes,
    matrix: matrix,
    view: view,
    normalize: normalize
};
