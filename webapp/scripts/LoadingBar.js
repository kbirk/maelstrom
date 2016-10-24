'use strict';

const $ = require('jquery');

class LoadingBar {
    constructor() {
        this.percent = 0;
        this.minDuration = 1000;
        this.last = Date.now();
        this.$loader = $('<div class="loader-bar"></div>');
        this.$container = $('<div class="loader-container"></div>');
        this.$container.append(this.$loader);
        $(document.body).append(this.$container);
    }
    update(percent) {
        if (this.percent <= percent) {
            const diff = percent - this.percent;
            this.percent = percent;
            const timestamp = Date.now();
            const delta = timestamp - this.last;
            this.$loader.animate(
                {
                    width: this.percent * 100 + '%',
                    opacity: 1.0 - (this.percent/2)
                },
                Math.max(delta, this.minDuration * diff),
                'linear');
            this.last = timestamp;
            if (this.percent === 1) {
                this.finish();
            }
        }
    }
    finish() {
        const diff = 1 - this.percent;
        const timestamp = Date.now();
        const delta = timestamp - this.last;
        this.$loader.animate(
            {
                width: '100%',
            },
            Math.max(delta, this.minDuration * diff),
            'linear');
        this.$loader.animate(
            {
                opacity: 0
            },
            400,
            () => {
                this.$loader.remove();
                this.$loader = null;
            });
    }
}

module.exports = LoadingBar;
