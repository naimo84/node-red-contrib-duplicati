import { NodeProperties } from 'node-red';

export interface Config extends NodeProperties {   
    url?: string,   
    username?: string,
    password?: string
}

module.exports = function (RED: any) {
    function icalConfig(config: Config) {
        RED.nodes.createNode(this, config);

        this.url = config.url;
       
        this.username = config.username;
        this.password = config.password;

       
    }

    RED.nodes.registerType('duplicati-config', icalConfig);
};
