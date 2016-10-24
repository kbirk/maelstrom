'use strict';

const babel = require('gulp-babel');
const babelify = require('babelify');
const bower = require('main-bower-files');
const browserify = require('browserify');
const buffer = require('vinyl-buffer');
const concat = require('gulp-concat');
const csso = require('gulp-csso');
const eslint = require('gulp-eslint');
const del = require('del');
const filter = require('gulp-filter');
const gulp = require('gulp');
const htmlmin = require('gulp-htmlmin');
const rename = require('gulp-rename');
const replace = require('gulp-replace');
const runSequence = require('run-sequence');
const source = require('vinyl-source-stream');
const uglify = require('gulp-uglify');

const project = 'maelstrom';
const basePath = 'webapp';
const paths = {
    root: `${basePath}/app.js`,
    scripts: [ `${basePath}/scripts/**/*.js`, `${basePath}/app.js` ],
    styles: [ `${basePath}/styles/reset.css`, `${basePath}/styles/**/*.css` ],
    html: [ `${basePath}/html/**/*.html` ],
    index: [ `${basePath}/index.html` ],
    webworkers: [ `${basePath}/webworkers/**/*.js` ],
    fonts: [
        `${basePath}/**/*.eof`,
        `${basePath}/**/*.svg`,
        `${basePath}/**/*.ttf`,
        `${basePath}/**/*.woff`,
        `${basePath}/**/*.woff2`,
        `${basePath}/**/*.otf`
    ],
    build: 'build',
    resources: [
        `${basePath}/images/**/*`,
        `${basePath}/shaders/**/*`,
        `${basePath}/favicons/**/*`,
    ]
};

function handleError(err){
    console.log(err);
    this.emit('end');
}

gulp.task('clean', () => {
    del.sync(paths.build);
});

gulp.task('lint', () => {
	return gulp.src([
            './webapp/**/*.js',
            '!./webapp/vendor/**/*.js'
        ])
        .pipe(eslint())
        .pipe(eslint.format());
});

gulp.task('build-vendor-js', () => {
    return gulp.src(bower())
        .pipe(filter('**/*.js')) // filter js files
        .pipe(concat('vendor.js'))
        .pipe(uglify())
        .pipe(gulp.dest(`${paths.build}/vendor`));
});

gulp.task('build-vendor-css', () => {
    return gulp.src(bower())
        .pipe(filter('**/*.css')) // filter css files
        .pipe(csso())
        .pipe(concat('vendor.css'))
        .pipe(gulp.dest(`${paths.build}/vendor`));
});

gulp.task('build-scripts', () => {
    return browserify(paths.root, {
            debug: false,
            standalone: project
        }).transform(babelify, {
            global: true,
            compact: true,
            presets: [
                'es2015'
            ]
        })
        .bundle()
        .on('error', handleError)
        .pipe(source(`${project}.js`))
        .pipe(buffer())
        .pipe(uglify().on('error', handleError))
        .pipe(gulp.dest(paths.build));
});

gulp.task('build-styles', () => {
    return gulp.src(paths.styles)
        .pipe(csso())
        .pipe(concat(`${project}.css`))
        .pipe(gulp.dest(paths.build));
});

gulp.task('build-html', () => {
    return gulp.src(paths.html)
        .pipe(htmlmin({ collapseWhitespace: true }))
        .pipe(gulp.dest(`${paths.build}/html`));
});

gulp.task('copy-index', () => {
    return gulp.src(paths.index)
        .pipe(replace(/({{GOOGLE_ANALYTICS_ID}})/, process.env.GOOGLE_ANALYTICS_ID))
        .pipe(htmlmin({ collapseWhitespace: true }))
        .pipe(gulp.dest(paths.build));
});

gulp.task('copy-fonts', () => {
    return gulp.src(paths.fonts)
        .pipe(rename({ dirname: '' }))
        .pipe(gulp.dest(`${paths.build}/fonts`));
});

gulp.task('copy-webworkers', () => {
    return gulp.src(paths.webworkers)
        .pipe(babel({
            presets: [
                'es2015-script'
            ]
        }))
        .pipe(uglify().on('error', handleError))
        .pipe(gulp.dest(`${paths.build}/webworkers`));
});

gulp.task('copy-resources', () => {
    return gulp.src(paths.resources, {
            base: basePath
        })
        .pipe(gulp.dest(paths.build));
});

gulp.task('build', done => {
    runSequence(
        [
            'clean',
            'lint'
        ],
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
        done);
});

gulp.task('serve', () => {
    const express = require('express');
    const compression = require('compression');
    const app = express();
    const port = 8080;
    app.use(compression());
    app.use(express.static(`${__dirname}/${paths.build}`));
    app.listen(port, () => {
        console.log(`Listening on port ${port}`);
    });
    return app;
});

gulp.task('watch', [ 'build' ], done => {
    gulp.watch(paths.scripts, [ 'build-scripts' ]);
    gulp.watch(paths.styles, [ 'build-styles' ]);
    gulp.watch(paths.html, [ 'build-html' ]);
    gulp.watch(paths.index, [ 'copy-index' ]);
    gulp.watch(paths.fonts, [ 'copy-fonts' ]);
    gulp.watch(paths.webworkers, [ 'copy-webworkers' ]);
    gulp.watch(paths.resources, [ 'copy-resources' ]);
    done();
});

gulp.task('deploy', [ 'build' ], () => {
});

gulp.task('default', done => {
    runSequence(
        [ 'watch' ],
        [ 'serve' ],
        done);
});
