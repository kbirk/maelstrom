( function() {

    "use strict";

    var gulp = require('gulp');

    gulp.task('lint', function() {
        var jshint = require('gulp-jshint');
        return gulp.src( [ './webapp/**/*.js',
            '!./webapp/vendor/**/*.js'] )
            .pipe( jshint() )
            .pipe( jshint('.jshintrc') )
            .pipe( jshint.reporter('jshint-stylish') );
    });

    gulp.task('serve', function() {

        /*
        var express = require( 'express' ),
            bodyParser = require( 'body-parser' ),
            app = express();
        app.use( bodyParser.json() ); // support JSON-encoded bodies
        app.use( bodyParser.urlencoded({ extended: false }) ); // support URL-encoded bodies
        app.use( express.static( __dirname + '/webapp' ) );
        app.listen( 8080, function() {
            console.log( 'Listening on port %d', 8080 );
        });
        */

        var express = require( 'express' ),
            bodyParser = require( 'body-parser' ),
            ws = require('ws'),
            app = express(),
            wss;
        app.use( bodyParser.json() ); // support JSON-encoded bodies
        app.use( bodyParser.urlencoded({ extended: false }) ); // support URL-encoded bodies
        app.use( express.static( __dirname + '/webapp' ) );

        var WS_PORT = '8888';

        app.get('/examples/ws/port', function ( req, res ) {
            var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
            console.log( 'Port GET request from IP: ' + ip );
            res.json( { port: WS_PORT } );
        });

        app.listen( 8080, function() {
            console.log( 'Listening on port %d', 8080 );
        });

        wss = new ws.Server({ port: WS_PORT });

        wss.on( 'connection', function connection( ws ) {
            ws.on( 'message', function incoming( message ) {
                console.log( 'Received: ' + message );
                ws.send( 'Message: "' + message + '" received' );
            });
        });
    });

    gulp.task('default', [ 'serve' ], function() {
    });

}());
