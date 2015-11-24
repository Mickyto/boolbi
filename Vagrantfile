Vagrant.configure("2") do |config|
    config.vm.box = "hashicorp/precise64"
    #config.vm.box_url = "https://cloud-images.ubuntu.com/vagrant/trusty/current/trusty-server-cloudimg-amd64-vagrant-disk1.box"
    config.vm.provision :shell, :path => "node-bootstrap.sh"
    config.vm.network :private_network, ip: '10.0.33.34'
    config.ssh.shell = "bash -c 'BASH_ENV=/etc/profile exec bash'"

    config.vm.provider :virtualbox do |vb|
        vb.gui = true
        vb.customize ["setextradata", :id, "VBoxInternal2/SharedFoldersEnableSymlinksCreate/v-root", "1"]
        vb.customize ["modifyvm", :id, "--memory", "512"]
    end
end
