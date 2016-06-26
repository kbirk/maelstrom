(function() {

    'use strict';

    var vec = require('./vec');

    function mat() {
        var mat = new Float32Array(new ArrayBuffer(16 * 4));
        mat[0] = 1;
        mat[1] = 0;
        mat[2] = 0;
        mat[3] = 0;

        mat[4] = 0;
        mat[5] = 1;
        mat[6] = 0;
        mat[7] = 0;

        mat[8] = 0;
        mat[9] = 0;
        mat[10] = 1;
        mat[11] = 0;

        mat[12] = 0;
        mat[13] = 0;
        mat[14] = 0;
        mat[15] = 1;
        return mat;
    }

    function identity(mat) {
        mat[0] = 1;
        mat[1] = 0;
        mat[2] = 0;
        mat[3] = 0;

        mat[4] = 0;
        mat[5] = 1;
        mat[6] = 0;
        mat[7] = 0;

        mat[8] = 0;
        mat[9] = 0;
        mat[10] = 1;
        mat[11] = 0;

        mat[12] = 0;
        mat[13] = 0;
        mat[14] = 0;
        mat[15] = 1;
        return mat;
    }

    function axes(x, y, z, mat) {
        x[0] = mat[0];
        x[1] = mat[1];
        x[2] = mat[2];
        vec.normalize(x);
        y[0] = mat[4];
        y[1] = mat[5];
        y[2] = mat[6];
        vec.normalize(y);
        z[0] = mat[8];
        z[1] = mat[9];
        z[2] = mat[10];
        vec.normalize(z);
    }

    function rotation(out, angle, axis) {
        vec.normalize(axis);
        var x = axis[0];
        var y = axis[1];
        var z = axis[2];
        var modAngle = (angle > 0) ? angle % (2 * Math.PI) : angle % (-2 * Math.PI);
        var s = Math.sin(modAngle);
        var c = Math.cos(modAngle);
        var xx = x * x;
        var yy = y * y;
        var zz = z * z;
        var xy = x * y;
        var yz = y * z;
        var zx = z * x;
        var xs = x * s;
        var ys = y * s;
        var zs = z * s;
        var one_c = 1.0 - c;
        out[0] = (one_c * xx) + c;
        out[1] = (one_c * xy) + zs;
        out[2] = (one_c * zx) - ys;
        out[3] = 0;
        out[4] = (one_c * xy) - zs;
        out[5] = (one_c * yy) + c;
        out[6] = (one_c * yz) + xs;
        out[7] = 0;
        out[8] = (one_c * zx) + ys;
        out[9] =  (one_c * yz) - xs;
        out[10] = (one_c * zz) + c;
        out[11] = 0;
        out[12] = 0;
        out[13] = 0;
        out[14] = 0;
        out[15] = 1;
        return out;
    }

    function multMat(out, a, b) {
        var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
        var a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
        var a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
        var a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];
        var b0  = b[0], b1 = b[1], b2 = b[2], b3 = b[3];
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

    function multVec(out, mat, vec) {
        var x = vec[0];
        var y = vec[1];
        var z = vec[2];
        out[0] = mat[0] * x + mat[4] * y + mat[8] * z + mat[12];
        out[1] = mat[1] * x + mat[5] * y + mat[9] * z + mat[13];
        out[2] = mat[2] * x + mat[6] * y + mat[10] * z + mat[14];
        return out;
    }

    function view(out, mat) {
        var vx = vec.new();
        var vy = vec.new();
        var vz = vec.new();
        axes(vx, vy, vz, mat);

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
        var f = 1.0 / Math.tan(fovy / 2.0);
        var nf = 1.0 / (near - far);

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
        var rot = rotation(mat(), angle, axis);
        return multMat(out, rot, out);
    }

    function rotateLocal(out, angle, axis) {
        return rotateWorld(out, angle, multVec(axis, out, axis));
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

}());
