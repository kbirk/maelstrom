(function() {

    'use strict';

    var mat = require('./mat');

    var ROTATION_FRICTION = 0.03;
    var DESKTOP_FACTOR = 10000;
    var MOBILE_FACTOR = -5000;
    var EPSILON = 0.00001;
    var xAxis;
    var yAxis;

    function Camera() {
        var that = this;
        this.horizontalRotation = 0;
        this.verticalRotation = 0;
        this.transform = mat.rotateWorld(mat.new(), Math.PI, [ 0, 1, 0 ]);
        this.view = mat.new();
        var prevX;
        var prevY;
        var down;
        // add mouse down handler
        document.addEventListener('mousedown', function(event) {
            prevX = event.screenX;
            prevY = event.screenY;
            down = true;
        });
        // add mouse move handler
        document.addEventListener('mousemove', function(event) {
            if (down) {
                var dx = event.screenX - prevX;
                var dy = event.screenY - prevY;
                that.horizontalRotation += dx / DESKTOP_FACTOR;
                that.verticalRotation += dy / DESKTOP_FACTOR;
                prevX = event.screenX;
                prevY = event.screenY;
            }
        });
        // add mouse up handler
        document.addEventListener('mouseup', function() {
            down = false;
            prevX = undefined;
            prevY = undefined;
        });
        // add touch start handler
        document.addEventListener('touchmove', function(event) {
            event.preventDefault();
            var touch = event.touches[0];
            if (prevX === undefined && prevY === undefined) {
                prevX = touch.clientX;
                prevY = touch.clientY;
                return;
            }
            var dx = touch.clientX - prevX;
            var dy = touch.clientY - prevY;
            that.horizontalRotation += dx / MOBILE_FACTOR;
            that.verticalRotation += dy / MOBILE_FACTOR;
            prevX = touch.clientX;
            prevY = touch.clientY;
        });
        // add touch end handler
        document.addEventListener('touchend', function() {
            prevX = undefined;
            prevY = undefined;
        });
    }

    Camera.prototype.applyRotation = function(tDelta) {
        // reset axes
        xAxis = [ 1, 0, 0 ];
        yAxis = [ 0, 1, 0 ];
        // rotate camera based on current drag rotation
        mat.rotateLocal(this.transform, tDelta * -this.horizontalRotation * (Math.PI / 180), yAxis);
        mat.rotateLocal(this.transform, tDelta * -this.verticalRotation * (Math.PI / 180), xAxis);
    };

    Camera.prototype.applyFriction = function() {
        // update rotation velocity
        this.verticalRotation = this.verticalRotation * (1 - ROTATION_FRICTION);
        this.horizontalRotation = this.horizontalRotation * (1 - ROTATION_FRICTION);
        if (Math.abs(this.verticalRotation) < EPSILON) {
            this.verticalRotation = 0;
        }
        if (Math.abs(this.horizontalRotation) < EPSILON) {
            this.horizontalRotation = 0;
        }
    };

    Camera.prototype.getViewMatrix = function() {
        // get view matrix
        return mat.view(this.view, this.transform);
    };

    module.exports = Camera;

}());
