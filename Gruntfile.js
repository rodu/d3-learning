module.exports = function (grunt) {
    grunt.initConfig({
        grunt.initConfig({
            connect: {
                server: {
                    options: {
                        port: 8000,
                        base: 'www-root'
                    }
                }
            }
        });
    });

    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-contrib-watch');
};
