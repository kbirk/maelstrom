( function() {

    "use strict";

    function getTypingPause() {
        return Math.random() * 100 + 100;
    }

    function typeText( $elem, text, callback ) {

        function typeLetter() {
            if ( numLetters > text.length ) {
                callback();
                return;
            }
            elem.nodeValue = text.substring( 0, numLetters );
            numLetters++;
            setTimeout( typeLetter, getTypingPause() );
        }

        var elem = $elem.contents()[0],
            numLetters = 0;
        typeLetter( elem, 0, callback );
    }

    function getDeletingPause() {
        return Math.random() * 50 + 20;
    }

    function deleteText( $elem, text, callback ) {

        function deleteLetter() {
            if ( numLetters < 0 ) {
                callback();
                return;
            }
            elem.nodeValue = text.substring( 0, numLetters );
            numLetters--;
            setTimeout( deleteLetter, getDeletingPause() );
        }

        var elem = $elem.contents()[0],
            numLetters = text.length;
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

    window.animatedTyping = animatedTyping;

}());
