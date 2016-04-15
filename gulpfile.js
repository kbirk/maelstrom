( function() {

    'use strict';

    var gulp = require('gulp');
    var concat = require('gulp-concat');
    var source = require('vinyl-source-stream');
    var buffer = require('vinyl-buffer');
    var del = require('del');
    var jshint = require('gulp-jshint');
    var browserify = require('browserify');
    var csso = require('gulp-csso');
    var runSequence = require('run-sequence');
    var uglify = require('gulp-uglify');
    var htmlmin = require('gulp-htmlmin');
    var replace = require('gulp-replace');
    var rename = require('gulp-rename');
    var filter = require('gulp-filter');
    var bower = require('main-bower-files');

    var project = 'maelstrom';
    var basePath = 'webapp/';
    var paths = {
        root: basePath + 'app.js',
        scripts: [ basePath + 'scripts/**/*.js',  basePath + 'app.js' ],
        styles: [  basePath + 'styles/reset.css',  basePath + 'styles/**/*.css' ],
        html: [ basePath + 'html/**/*.html' ],
        index: [ basePath + 'index.html' ],
        webworkers: [ basePath + 'webworkers/**/*.js' ],
        fonts: [
            basePath + '**/*.eof',
            basePath + '**/*.svg',
            basePath + '**/*.ttf',
            basePath + '**/*.woff',
            basePath + '**/*.woff2',
            basePath + '**/*.otf'
        ],
        build: 'build',
        resources: [
            basePath + 'images/**/*',
            basePath + 'shaders/**/*',
            basePath + 'favicons/**/*',
        ]
    };

    function handleError( err ){
        console.log( err );
        this.emit('end');
    }

    gulp.task('clean', function( done ) {
        del.sync( paths.build );
        done();
    });

    gulp.task('lint', function() {
        return gulp.src([
                './webapp/**/*.js',
                '!./webapp/vendor/**/*.js'
            ])
            .pipe( jshint() )
            .pipe( jshint('.jshintrc') )
            .pipe( jshint.reporter('jshint-stylish') );
    });

    gulp.task('build-vendor-js', function() {
        return gulp.src( bower() )
            .pipe( filter('**/*.js') ) // filter js files
            .pipe( concat('vendor.js') )
            .pipe( uglify() )
            .pipe( gulp.dest( paths.build + '/vendor' ) );
    });

    gulp.task('build-vendor-css', function() {
        return gulp.src( bower() )
            .pipe( filter('**/*.css') ) // filter css files
            .pipe( csso() )
            .pipe( concat('vendor.css') )
            .pipe( gulp.dest( paths.build + '/vendor' ) );
    });

    gulp.task('build-scripts', function() {
        return browserify( paths.root, {
                standalone: project
            }).bundle()
            .on( 'error', handleError )
            .pipe( source( project + '.js' ) )
            .pipe( buffer() )
            .pipe( uglify().on('error', handleError ) )
            .pipe( gulp.dest( paths.build ) );
    });

    gulp.task('build-styles', function () {
        return gulp.src( paths.styles )
            .pipe( csso() )
            .pipe( concat( project + '.css') )
            .pipe( gulp.dest( paths.build ) );
    });

    gulp.task('build-html', function() {
        return gulp.src( paths.html )
            .pipe( htmlmin({ collapseWhitespace: true }) )
            .pipe( gulp.dest( paths.build + '/html' ) );
    });

    gulp.task('copy-index', function() {
        return gulp.src( paths.index )
            .pipe( replace( /({{GOOGLE_ANALYTICS_ID}})/, process.env.GOOGLE_ANALYTICS_ID ) )
            .pipe( htmlmin({ collapseWhitespace: true }) )
            .pipe( gulp.dest( paths.build ) );
    });

    gulp.task('copy-fonts', function() {
        return gulp.src( paths.fonts )
            .pipe( rename({ dirname: '' }) )
            .pipe( gulp.dest( paths.build + '/fonts' ) );
    });

    gulp.task('copy-webworkers', function() {
        return gulp.src( paths.webworkers )
            .pipe( uglify().on('error', handleError ) )
            .pipe( gulp.dest( paths.build + '/webworkers' ) );
    });

    gulp.task('copy-resources', function() {
        return gulp.src( paths.resources, {
                base: basePath
            })
            .pipe( gulp.dest( paths.build ) );
    });

    gulp.task('build', function( done ) {
        runSequence(
            [
                'clean',
                'lint' ],
            [
                'build-scripts',
                'build-styles',
                'build-html',
                'build-vendor-js',
                'build-vendor-css',
                'copy-index',
                'copy-fonts',
                'copy-webworkers',
                'copy-resources'
            ],
            done );
    });

    gulp.task('serve', function() {
        var express = require( 'express' );
        var bodyParser = require( 'body-parser' );
        var compression = require( 'compression' );
        var app = express();
        var port = 8080;
        app.use( bodyParser.json() ); // support JSON-encoded bodies
        app.use( bodyParser.urlencoded({ extended: false }) ); // support URL-encoded bodies
        app.use( compression() );
        app.use( express.static( __dirname + '/' + paths.build  ) );
        app.listen( port, function() {
            console.log( 'Listening on port %d', port );
        });
        return app;
    });

    gulp.task('watch', [ 'build' ], function( done ) {
        gulp.watch( paths.scripts, [ 'build-scripts' ] );
        gulp.watch( paths.styles, [ 'build-styles' ] );
        gulp.watch( paths.html, [ 'build-html' ] );
        gulp.watch( paths.index, [ 'copy-index' ] );
        gulp.watch( paths.fonts, [ 'copy-fonts' ] );
        gulp.watch( paths.webworkers, [ 'copy-webworkers' ] );
        gulp.watch( paths.resources, [ 'copy-resources' ] );
        done();
    });

    gulp.task('deploy', [ 'build' ], function() {
    });

    gulp.task('default', function( done ) {
        runSequence(
            [ 'watch' ],
            [ 'serve' ],
            done );
    });

}());
