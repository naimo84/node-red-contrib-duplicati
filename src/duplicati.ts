import { Duplicati } from "node-duplicati";
import { Config } from "./duplicati-config";

module.exports = function (RED) {
    async function login(dup, node) {
        if (!!node.config.password && (!node.auth || !node.auth.expires || node.auth.expires < new Date(Date.now() + 2 * 60 * 1000))) {
            let auth = await dup.login(node.config.password);
            node.auth = auth;
        }
        if (!node.auth || !node.auth.token || !node.auth.token.expires || node.auth.token.expires < new Date(Date.now() + 2 * 60 * 1000)) {
            let token = await dup.getToken();
            node.auth = Object.assign(node.auth || {}, { token: token })
        }
        return;
    }

    function DuplicatiNode(config) {
        let node = this;
        RED.nodes.createNode(node, config);
        node.config = RED.nodes.getNode(config.confignode) as unknown as Config;
        node.dropdown_value = config.dropdown_value;
        node.value = config.value;
        node.action = config.action;
        const dup = new Duplicati({
            url: node.config.url
        });

        RED.httpAdmin.get("/duplicatiBackups", async function (req, res) {
            await login(dup, node);
            RED.log.debug("GET /duplicatiBackups");
            let backups = await dup.getBackups(node.auth.token.token, node.auth);

            let ret = [];
            backups.forEach(backup => {
                ret.push({
                    id: backup.Backup.ID,
                    name: backup.Backup.Name
                });
            });

            res.json(ret);
        });

        node.on('input', async function (msg) {
            let message = RED.util.cloneMessage(msg);
            node.action = msg.action || node.action;
            node.backup = parseInt(msg.backup?.id || node.dropdown_value);
            try {
                await login(dup, node);

                switch (node.action) {
                    case 'setServerstate':
                        let serverstate = await dup.setServerstate(node.dropdown_value, node.value, node.auth.token.token, node.auth);
                        node.send(Object.assign(message, {
                            payload: serverstate
                        }));
                        break;
                    case 'runBackup':
                        let backup = await dup.runBackup(node.backup, node.auth.token.token, node.auth);
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
