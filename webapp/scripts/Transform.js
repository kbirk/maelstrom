'use strict';

const mat4 = require('./math/mat4');
const quat = require('./math/quat');
const vec3 = require('./math/vec3');

class Transform {
    constructor() {
        this.quat = quat.new();
        this.matrix = mat4.new();
        this.view = mat4.new();
        this.xAxis = vec3.new();
        this.yAxis = vec3.new();
        this.zAxis = vec3.new();
    }
    rotate(axis, angle) {
        quat.rotate(this.quat, this.quat, axis, angle);
    }
    rotateX(angle) {
        quat.rotateX(this.quat, this.quat, angle);
    }
    rotateY(angle) {
        quat.rotateY(this.quat, this.quat, angle);
    }
    rotateZ(angle) {
        quat.rotateZ(this.quat, this.quat, angle);
    }
    calcView() {
        quat.view(this.view, this.quat);
    }
    calcMatrix() {
        quat.matrix(this.matrix, this.quat);
    }
}

module.exports = Transform;
