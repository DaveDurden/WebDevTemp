// include gulp
var gulp            = require('gulp');

// include SASS & CSS plugins
var sass            = require('gulp-sass'),
    sassGlob        = require('gulp-sass-glob-import'),
    cssnano         = require('gulp-cssnano'),
    pixrem          = require('gulp-pixrem'),
    autoprefixer    = require('gulp-autoprefixer');

// include JS plugins
var jshint          = require('gulp-jshint'),
    uglify          = require('gulp-uglify'),
    sourcemaps      = require('gulp-sourcemaps');

// include file operation plugins
var concat          = require('gulp-concat'),
    rename          = require('gulp-rename'),
    cache           = require('gulp-cache'),
    del             = require('del'),
    fileinclude     = require('gulp-file-include');

// include other plugins
var notify          = require('gulp-notify'),
    browserSync     = require('browser-sync'),
    php             = require('gulp-connect-php'),
    runSequence     = require('run-sequence'),
    imagemin        = require('gulp-imagemin'),
    markdown        = require('markdown');


// copy markup & text files to dist folder
gulp.task('html', function(){
    return gulp.src('src/*.+(html|php|txt|xml)')
        .pipe(fileinclude({
            prefix: '@@',
            basepath: 'src/partials',
            filters: {
                markdown: markdown.parse
            }
        }))
        .pipe(cache(gulp.dest('dist')))
        ;
});


// copy downloadable files dist folder
gulp.task('downloads', function(){
    return gulp.src('src/downloads/**/*')
        .pipe(cache(gulp.dest('dist/downloads')))
        ;
});


// concatenate, compile, prefix & minify styles
gulp.task('styles', function() {
    return gulp.src('src/sass/main.scss')
        .pipe(sassGlob())
        .pipe(sass({
            style: 'expanded',
            sourceComments: true,
            indentWidth: 4
        }))
        .on('error', notify.onError({
            title: 'Error compiling SASS',
            message: '<%= error.message %>',
            sound: true,
            wait: true
        }))
        .pipe(autoprefixer({ browsers: ['> 1% in DE'], remove: false }))
        .pipe(pixrem({
            rootValue: '16px',
            atrules: true,
            replace: false
        }))
        .pipe(gulp.dest('dist/css'))
        .pipe(rename({suffix: '.min'}))
        .pipe(cssnano())
        .pipe(gulp.dest('dist/css'))
        ;
});


// copy & optimize images
gulp.task('images', function() {
    return gulp.src('src/img/**/*.+(png|jpg|gif|svg)')
        .pipe(cache(imagemin({
            optimizationLevel: 3,
            progressive: true,
            interlaced: true
        })))
        .pipe(gulp.dest('dist/img'))
        ;
});


// copy font files
gulp.task('fonts', function() {
    return gulp.src('src/fonts/**/*')
        .pipe(cache(gulp.dest('dist/fonts')))
        ;
});


// lint own scripts
gulp.task('lint', function() {
    return gulp.src(['src/js/**/*.js', '!src/js/vendor/**/*.js'])
        .pipe(jshint())
        .pipe(jshint.reporter('default'))
        ;
});


// copy vendor scripts
gulp.task('vendor-scripts', function() {
    return gulp.src('src/js/vendor/**/*.js')
        .pipe(cache(gulp.dest('dist/js/vendor')))
        ;
});


// concatenate & uglify javascripts
gulp.task('scripts', ['lint', 'vendor-scripts'], function() {
    return gulp.src(['src/js/**/*.js', '!src/js/vendor/**/*.js'])
        .pipe(sourcemaps.init())
        .pipe(concat('all.js'))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('dist/js'))
        .pipe(rename({suffix: '.min'}))
        .pipe(uglify())
        .pipe(gulp.dest('dist/js'))
        ;
});


// run tasks when a file changes
gulp.task('watch', function() {
    gulp.watch('src/**/*.html', ['html']);
    gulp.watch('src/sass/**/*.scss', ['styles']);
    gulp.watch(['src/js/**/*.js', '!src/js/vendor/**/*.js'], ['scripts']);
    gulp.watch('src/img/**/*', ['images']);
    gulp.watch('src/fonts/**/*', ['fonts']);
});


// start browsersync server
gulp.task('serve', ['watch'], function() {
    var browserSyncInstance = browserSync.create();
    browserSyncInstance.init({
        server: {
            baseDir: 'dist/',
        },
        open: true,
        files: ['dist/**/*'],
        notify: false,
        reloadDelay: 500
    });
    // for manual reload: browserSync.reload();
});


// alternative: start browsersync server with php
gulp.task('serve-php', ['watch'], function() {
    php.server({
        base: 'dist/',
        port: 8000,
        keepalive: true,
        // open: true
    }, function() {
        browserSync({
            proxy: '127.0.0.1:8000',
            open: true,
            files: ['dist/**/*'],
            notify: false,
            reloadDelay: 500
        });
    });
});



// default task (called with 'gulp') will call 'serve', which also calls 'watch'
gulp.task('default', ['serve']);
// gulp.task('default', ['serve-php']);


// clean dist folder and all caches
gulp.task('clean', function() {
    cache.clearAll();
    return del(['dist']);
});


// rebuild task for full site regeneration
gulp.task('rebuild', function() {
    runSequence('clean', ['html', 'downloads', 'styles', 'images', 'fonts', 'scripts']);
});
