const gulp = require('gulp');
const {series} = gulp;

// insight
gulp.task('insightBuildCopyDist', () => gulp.src('./dist/**/*').pipe(gulp.dest('./publish/dist')));
gulp.task('insightBuildCopyMain', () => gulp.src(['./LICENSE.txt', './package.json', './README.md']).pipe(gulp.dest('./publish')));
gulp.task('insightBuildOptimize', series('insightBuildCopyDist', 'insightBuildCopyMain'));
gulp.task('insightPublishCopy', () => gulp.src('./dist/**/*').pipe(gulp.dest('./publish/dist')));
