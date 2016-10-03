module.exports = function (shipit) {
    require('shipit-deploy')(shipit);

    var wd = '/usr/app/web';

    shipit.initConfig({
        default: {
            workspace: '/tmp/git-monitor',
            deployTo: wd,
            repositoryUrl: 'git@bitbucket.org:mickyto/boolbi.git',
            ignores: ['public/images/big/', 'public/images/small/', '.gitignore/', 'nightwatch', 'tests/', 'nightwatch.json', 'nodemon.json', 'readme.md', 'Vagrantfile', 'node-bootstrap.sh', 'node_rc', 'shipitfile.js'],
            keepReleases: 2,
            key: '~/.ssh/id_rsa',
            branch: 'master'
        },
        staging: {
            servers: 'root@boolbi.com'
        }
    });

    shipit.task('removeContainer', function () {
        return shipit.remote("if docker ps -a | grep boolbi ; then docker rm -f boolbi; fi")
    });

    shipit.task('buildImage', ['removeContainer'], function () {
        return shipit.remote('cd ' + wd + '/current && docker build -t boolbi .')
    });

    shipit.task('startContainer', ['buildImage'], function () {
        return shipit.remote(
            'docker run --rm -v ' + wd + '/current:/usr/src/app web npm install &&' +
            'docker run -d -p 3000:3000 -v ' + wd + '/current:/usr/src/app --name boolbi web');
    });

    shipit.task('build', function () {
        return shipit.start('removeContainer', 'buildImage', 'startContainer');
    });

    shipit.task('restart', function () {
        return shipit.remote('docker restart boolbi');
    });
};