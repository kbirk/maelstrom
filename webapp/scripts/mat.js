'use strict';

const vec = require('./vec');

function mat() {
    const m = new Float32Array(16);
    m[0] = 1;
    m[1] = 0;
    m[2] = 0;
    m[3] = 0;
    m[4] = 0;
    m[5] = 1;
    m[6] = 0;
    m[7] = 0;
    m[8] = 0;
    m[9] = 0;
    m[10] = 1;
    m[11] = 0;
    m[12] = 0;
    m[13] = 0;
    m[14] = 0;
    m[15] = 1;
    return m;
}

function identity(out) {
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = 1;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = 1;
    out[11] = 0;
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = 1;
    return out;
}

function axes(x, y, z, m) {
    x[0] = m[0];
    x[1] = m[1];
    x[2] = m[2];
    vec.normalize(x);
    y[0] = m[4];
    y[1] = m[5];
    y[2] = m[6];
    vec.normalize(y);
    z[0] = m[8];
    z[1] = m[9];
    z[2] = m[10];
    vec.normalize(z);
}

function rotation(out, angle, axis) {
    vec.normalize(axis);
    const x = axis[0];
    const y = axis[1];
    const z = axis[2];
    const modAngle = (angle > 0) ? angle % (2 * Math.PI) : angle % (-2 * Math.PI);
    const s = Math.sin(modAngle);
    const c = Math.cos(modAngle);
    const xx = x * x;
    const yy = y * y;
    const zz = z * z;
    const xy = x * y;
    const yz = y * z;
    const zx = z * x;
    const xs = x * s;
    const ys = y * s;
    const zs = z * s;
    const oneC = 1.0 - c;
    out[0] = (oneC * xx) + c;
    out[1] = (oneC * xy) + zs;
    out[2] = (oneC * zx) - ys;
    out[3] = 0;
    out[4] = (oneC * xy) - zs;
    out[5] = (oneC * yy) + c;
    out[6] = (oneC * yz) + xs;
    out[7] = 0;
    out[8] = (oneC * zx) + ys;
    out[9] =  (oneC * yz) - xs;
    out[10] = (oneC * zz) + c;
    out[11] = 0;
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = 1;
    return out;
}

function multMat(out, a, b) {
    const a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
    const a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
    const a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
    const a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];
    let b0  = b[0], b1 = b[1], b2 = b[2], b3 = b[3];
    out[0] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    out[1] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
    out[2] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
    out[3] = b0*a03 + b1*a13 + b2*a23 + b3*a33;
    b0 = b[4]; b1 = b[5]; b2 = b[6]; b3 = b[7];
    out[4] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    out[5] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
    out[6] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
    out[7] = b0*a03 + b1*a13 + b2*a23 + b3*a33;
    b0 = b[8]; b1 = b[9]; b2 = b[10]; b3 = b[11];
    out[8] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    out[9] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
    out[10] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
    out[11] = b0*a03 + b1*a13 + b2*a23 + b3*a33;
    b0 = b[12]; b1 = b[13]; b2 = b[14]; b3 = b[15];
    out[12] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    out[13] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
    out[14] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
    out[15] = b0*a03 + b1*a13 + b2*a23 + b3*a33;
    return out;
}

function multVec(out, m, v) {
    const x = v[0];
    const y = v[1];
    const z = v[2];
    out[0] = m[0] * x + m[4] * y + m[8] * z + m[12];
    out[1] = m[1] * x + m[5] * y + m[9] * z + m[13];
    out[2] = m[2] * x + m[6] * y + m[10] * z + m[14];
    return out;
}

function view(out, m) {
    const vx = vec.new();
    const vy = vec.new();
    const vz = vec.new();
    axes(vx, vy, vz, m);
    out[0] = vx[0];
    out[1] = vy[0];
    out[2] = vz[0];
    out[3] = 0;
    out[4] = vx[1];
    out[5] = vy[1];
    out[6] = vz[1];
    out[7] = 0;
    out[8] = vx[2];
    out[9] = vy[2];
    out[10] = vz[2];
    out[11] = 0;
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = 1;
    return out;
}

function perspective(out, fovy, aspect, near, far) {
    const f = 1.0 / Math.tan(fovy / 2.0);
    const nf = 1.0 / (near - far);
    out[0] = f / aspect;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = f;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = (far + near) * nf;
    out[11] = -1;
    out[12] = 0;
    out[13] = 0;
    out[14] = (2.0 * far * near) * nf;
    out[15] = 0;
    return out;
}

function rotateWorld(out, angle, axis) {
    const rot = rotation(mat(), angle, axis);
    return multMat(out, rot, out);
}

function rotateLocal(out, angle, axis) {
    const temp = vec.new();
    return rotateWorld(out, angle, multVec(temp, out, axis));
}

module.exports = {
    new: mat,
    identity: identity,
    rotation: rotation,
    rotateLocal: rotateLocal,
    rotateWorld: rotateWorld,
    view: view,
    perspective: perspective
};
