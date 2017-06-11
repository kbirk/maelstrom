'use strict';

const mat = require('./mat');
const vec = require('./vec');

const ROTATION_FRICTION = 0.03;
const DESKTOP_FACTOR = 10000;
const MOBILE_FACTOR = 5000;
const EPSILON = 0.00001;
const DEGREES_TO_RADIANS = Math.PI / 180.0;
const X_AXIS = vec.new(1, 0, 0);
const Y_AXIS = vec.new(0, 1, 0);

class Camera {
    constructor() {
        this.horizontalRotation = 0;
        this.verticalRotation = 0;
        this.transform = mat.rotateWorld(mat.new(), Math.PI, Y_AXIS);
        this.view = mat.new();
        let prevX;
        let prevY;
        let down;
        // add mouse down handler
        document.addEventListener('mousedown', event => {
            prevX = event.screenX;
            prevY = event.screenY;
            down = true;
        });
        // add mouse move handler
        document.addEventListener('mousemove', event => {
            if (down) {
                const dx = event.screenX - prevX;
                const dy = event.screenY - prevY;
                this.horizontalRotation += dx / DESKTOP_FACTOR;
                this.verticalRotation += dy / DESKTOP_FACTOR;
                prevX = event.screenX;
                prevY = event.screenY;
            }
        });
        // add mouse up handler
        document.addEventListener('mouseup', () => {
            down = false;
            prevX = undefined;
            prevY = undefined;
        });
        // add touch start handler
        document.addEventListener('touchmove', event => {
            event.preventDefault();
            const touch = event.touches[0];
            if (prevX === undefined && prevY === undefined) {
                prevX = touch.clientX;
                prevY = touch.clientY;
                return;
            }
            const dx = touch.clientX - prevX;
            const dy = touch.clientY - prevY;
            this.horizontalRotation += dx / MOBILE_FACTOR;
            this.verticalRotation += dy / MOBILE_FACTOR;
            prevX = touch.clientX;
            prevY = touch.clientY;
        });
        // add touch end handler
        document.addEventListener('touchend', () => {
            prevX = undefined;
            prevY = undefined;
        });
    }
    applyRotation(tDelta) {
        // rotate camera based on current drag rotation
        mat.rotateLocal(this.transform, tDelta * this.horizontalRotation * DEGREES_TO_RADIANS, Y_AXIS);
        mat.rotateLocal(this.transform, tDelta * this.verticalRotation * DEGREES_TO_RADIANS, X_AXIS);
    }
    applyFriction() {
        // update rotation velocity
        this.verticalRotation *= (1 - ROTATION_FRICTION);
        this.horizontalRotation *= (1 - ROTATION_FRICTION);
        if (Math.abs(this.verticalRotation) < EPSILON) {
            this.verticalRotation = 0;
        }
        if (Math.abs(this.horizontalRotation) < EPSILON) {
            this.horizontalRotation = 0;
        }
    }
    getViewMatrix() {
        // get view matrix
        return mat.view(this.view, this.transform);
    }
}

module.exports = Camera;
