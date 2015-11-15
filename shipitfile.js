module.exports = function (shipit) {
    require('shipit-deploy')(shipit);

    shipit.initConfig({
        default: {
            workspace: '/tmp/git-monitor',
            deployTo: '/boolbi',
            repositoryUrl: 'https://mickyto@bitbucket.org/mickyto/boolbi.git',
            ignores: ['.git', '.gitignore', '.idea', '.vagrant', 'node_modules', 'nightwatch', 'npm-debug.log', 'tests', 'nightwatch.json', 'nodemon.json', 'readme.md', 'selenium-debug.log', 'Vagrantfile', 'node-bootstrap.sh', 'node_rc', 'reports', 'shipitfile.js'],
            rsync: ['--del'],
            keepReleases: 1,
            key: '/home/vagrant/.ssh/id_rsa.pub',
            shallowClone: true
        },
        staging: {
            servers: 'root@boolbi.com'
        }
    });
};