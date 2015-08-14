var path = require('path');

module.exports = function(grunt) {
	// reset gruntfile base path
    grunt.file.setBase(__dirname);

    // get path relative to node_modules
    var nodepath = path.relative(__dirname, '/Applications/MAMP/htdocs/node_modules/');
    console.log(nodepath);

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		jsdoc: {
			dist: {
				src: ['popup.js'],
				options: {
					destination: 'doc',
					template: nodepath + '/grunt-jsdoc/node_modules/minami',
					configure: nodepath + '/grunt-jsdoc/node_modules/minami/jsdoc.conf.json'
				}
			}
		},
		uglify: {
			options: {
				// the banner is inserted at the top of the output
				banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n'
			},
			dist: {
				files: {
				  'dist/<%= pkg.name %>.min.js': ['popup.js']
				}
			}
		}
	});
	
	grunt.task.loadTasks(path.join(nodepath, 'grunt-contrib-uglify', 'tasks'));
	grunt.task.loadTasks(path.join(nodepath, 'grunt-jsdoc', 'tasks'));

	grunt.registerTask('default', ['jsdoc', 'uglify']);
};