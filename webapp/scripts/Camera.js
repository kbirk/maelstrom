'use strict';

const mat = require('./mat');

const ROTATION_FRICTION = 0.03;
const DESKTOP_FACTOR = 10000;
const MOBILE_FACTOR = -5000;
const EPSILON = 0.00001;

class Camera {
    constructor() {
        this.horizontalRotation = 0;
        this.verticalRotation = 0;
        this.transform = mat.rotateWorld(mat.new(), Math.PI, [ 0, 1, 0 ]);
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
        const xAxis = [ 1, 0, 0 ];
        const yAxis = [ 0, 1, 0 ];
        // rotate camera based on current drag rotation
        mat.rotateLocal(this.transform, tDelta * -this.horizontalRotation * (Math.PI / 180), yAxis);
        mat.rotateLocal(this.transform, tDelta * -this.verticalRotation * (Math.PI / 180), xAxis);
    }
    applyFriction() {
        // update rotation velocity
        this.verticalRotation = this.verticalRotation * (1 - ROTATION_FRICTION);
        this.horizontalRotation = this.horizontalRotation * (1 - ROTATION_FRICTION);
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
