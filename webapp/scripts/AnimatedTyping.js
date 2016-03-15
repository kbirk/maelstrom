( function() {

    'use strict';

    function getTypingPause() {
        return Math.random() * 100 + 100;
    }

    function typeText( $elem, text, callback ) {

        var $text = $elem.children().first();
        var numLetters = 0;

        function typeLetter() {
            if ( numLetters > text.length ) {
                callback();
                return;
            }
            $text.text( text.substring( 0, numLetters ) );
            numLetters++;
            setTimeout( typeLetter, getTypingPause() );
        }

        typeLetter();
    }

    function getDeletingPause() {
        return Math.random() * 50 + 20;
    }

    function deleteText( $elem, text, callback ) {

        var $text = $elem.children().first();
        var numLetters = text.length;

        function deleteLetter() {
            if ( numLetters < 0 ) {
                callback();
                return;
            }
            $text.text( text.substring( 0, numLetters ) );
            numLetters--;
            setTimeout( deleteLetter, getDeletingPause() );
        }

        deleteLetter();
    }

    function getLongPause() {
        return Math.random() * 2000 + 3000;
    }

    function getShortPause() {
        return Math.random() * 1000;
    }

    function animatedTyping( $elem, text ) {
        function type( index ) {
            typeText( $elem, text[ index ], function() {
                setTimeout( function() {
                    deleteText( $elem, text[ index ], function() {
                        setTimeout( function() {
                            type( (index+1) % text.length );
                        }, getShortPause() );
                    });
                }, getLongPause() );
            });
        }
        type( 0 );
    }

    module.exports = animatedTyping;

}());
