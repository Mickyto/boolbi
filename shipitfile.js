module.exports = function (shipit) {
    require('shipit-deploy')(shipit);

    shipit.initConfig({
        default: {
            workspace: '/tmp/git-monitor',
            deployTo: '/boolbi',
            repositoryUrl: 'git@bitbucket.org:mickyto/boolbi.git',
            ignores: ['.git', 'node_modules', 'public/images/big/', 'public/images/small/', 'bin/selenium-server-standalone-2.46.0.jar', '.gitignore/', '.idea/', '.vagrant/', 'nightwatch', '*.log', 'tests/', 'nightwatch.json', 'nodemon.json', 'readme.md', 'Vagrantfile', 'node-bootstrap.sh', 'node_rc', 'reports/', 'shipitfile.js'],
            rsync: ['--del'],
            keepReleases: 2,
            key: '/home/vagrant/.ssh/id_rsa',
            shallowClone: true
        },
        staging: {
            servers: 'root@boolbi.com'
        }
    });
};