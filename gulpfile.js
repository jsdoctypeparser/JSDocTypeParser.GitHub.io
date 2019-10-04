'use strict';

const browserify = require('browserify');
const gulp = require('gulp');
const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');

const sourceFiles = [
  'node_modules/bootstrap/dist/css/bootstrap.min.css',
  'node_modules/bootstrap/dist/fonts/*',
  'node_modules/github-fork-ribbon-css/gh-fork-ribbon.css',
  'node_modules/jquery/dist/jquery.min.js',
  'node_modules/google-code-prettify/src/prettify.js',
];
const outputPath = 'npm_copies/';

gulp.task('copy', function () {
  return gulp
      .src(sourceFiles)
      .pipe(gulp.dest(outputPath));
});

gulp.task('javascript', function () {
  const b = browserify({
    entries: './index.js',
    debug: true,
  });

  return b.bundle()
    .pipe(source('jsdoctypeparser-demo.js'))
    .pipe(buffer())
    .pipe(gulp.dest('./dist/'));
});


gulp.task('build', gulp.parallel('javascript', 'copy'));
