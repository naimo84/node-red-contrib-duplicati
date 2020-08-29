import { Duplicati } from "node-duplicati";
import { Config } from "./duplicati-config";

module.exports = function (RED) {


    function DuplicatiNode(config) {
        let node = this;
        RED.nodes.createNode(node, config);
        node.config = RED.nodes.getNode(config.confignode) as unknown as Config;
        const dup = new Duplicati({
            url: node.config.url
        });

        if (!node.tokenExpire || node.tokenExpire < new Date(Date.now() + 2 * 60 * 1000)) {
            dup.getToken().then(token => {
                node.tokenExpire = token.expires;
                node.token = token.token;
            });
        }
        if (!node.auth || !node.auth.expires || node.auth.expires < new Date(Date.now() + 2 * 60 * 1000)) {
            dup.login(node.config.password).then(auth => node.auth = auth)
        }

        RED.httpAdmin.get("/duplicatiBackups", async function (req, res) {

            RED.log.debug("GET /duplicatiBackups");
            let serverstate = await dup.getBackups(node.token,node.auth);
            res.json(serverstate);
        });

        node.on('input', async function (msg) {
            let message = RED.util.cloneMessage(msg);
            node.action = msg.action;
            try {
                if (!node.tokenExpire || node.tokenExpire < new Date(Date.now() + 2 * 60 * 1000)) {
                    let token = await dup.getToken();
                    node.tokenExpire = token.expires;
                    node.token = token.token;
                }
                if (!node.auth || !node.auth.expires || node.auth.expires < new Date(Date.now() + 2 * 60 * 1000)) {
                    let auth = await dup.login(node.config.password);
                    node.auth = auth;
                }
                switch (node.action) {
                    case 'setServerstate':
                        let serverstate = await dup.setServerstate('resume', '24h', node.token, node.auth);
                        node.send(Object.assign(message, {
                            payload: serverstate
                        }));
                        break;
                    case 'runBackup':
                        let backup = await dup.runBackup(3, node.token);
                        node.send(Object.assign(message, {
                            payload: backup
                        }));
                        break;
                    default:
                        node.status({ text: 'no action set', fill: 'shape' })

                }
            } catch (err) {
                node.error(err);
            }
        });
    }
    RED.nodes.registerType("duplicati-node", DuplicatiNode);
}
