(function() {
    'use strict';

    function createContainer() {
        if ( $('.loader-container').length === 0 ) {
            $( document.body ).append( $('<div class="loader-container"></div>') );
        }
    }

    var LoadingBar = function() {
        this.percent = 0;
        this.minDuration = 600;
        this.$loader = $('<div class="loader-bar"></div>');
        createContainer();
        $('.loader-container').append( this.$loader );
    };

    LoadingBar.prototype.update = function( percent ) {
        if ( this.percent <= percent ) {
            var diff = percent - this.percent;
            this.percent = percent;
            var timestamp = Date.now();
            var delta = timestamp - this.last;
            this.$loader.animate({
                    width: this.percent * 100 + '%',
                    opacity: 1.0 - ( this.percent/2 )
                },
                Math.max( delta, this.minDuration * diff ),
                'linear' );
            this.last = timestamp;
            if ( this.percent === 1 ) {
                this.finish();
            }
        }
    };

    LoadingBar.prototype.finish = function() {
        var that = this;
        var diff = 1 - this.percent;
        var timestamp = Date.now();
        var delta = timestamp - this.last;
        this.$loader.animate({
                width: '100%',
            },
            Math.max( delta, this.minDuration * diff ),
            'linear' );
        this.$loader.animate({
                opacity: 0
            },
            400,
            function() {
                that.$loader.remove();
                that.$loader = null;
            });
    };

    window.LoadingBar = LoadingBar;

}());
