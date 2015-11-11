module.exports = function (shipit) {
    require('shipit-deploy')(shipit);

    shipit.initConfig({
        default: {
            workspace: '/tmp/github-monitor',
            deployTo: '/tmp/deploy_to',
            repositoryUrl: 'https://github.com/Mickyto/hello-world',
            ignores: ['.git', 'node_modules'],
            rsync: ['--del'],
            keepReleases: 2,
            key: '/home/vagrant/.ssh/id_rsa.pub',
            shallowClone: true
        },
        staging: {
            servers: 'root@boolbi.com'
        }
    });
};