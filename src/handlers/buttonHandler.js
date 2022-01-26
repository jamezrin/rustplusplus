const DiscordTools = require('../discordTools/discordTools.js');

module.exports = (client, interaction) => {
    let guildId = interaction.guildId;
    let instance = client.readInstanceFile(guildId);

    if (interaction.customId.endsWith('DiscordNotification')) {
        let setting = interaction.customId.replace('DiscordNotification', '');
        instance.notificationSettings[setting].discord = !instance.notificationSettings[setting].discord;

        if (client.rustplusInstances.hasOwnProperty(guildId)) {
            client.rustplusInstances[guildId].notificationSettings[setting].discord =
                instance.notificationSettings[setting].discord;
        }

        let row = DiscordTools.getNotificationButtonsRow(
            setting,
            instance.notificationSettings[setting].discord,
            instance.notificationSettings[setting].inGame);
        interaction.update({ components: [row] });
    }
    else if (interaction.customId.endsWith('InGameNotification')) {
        let setting = interaction.customId.replace('InGameNotification', '');
        instance.notificationSettings[setting].inGame = !instance.notificationSettings[setting].inGame;

        if (client.rustplusInstances.hasOwnProperty(guildId)) {
            client.rustplusInstances[guildId].notificationSettings[setting].inGame =
                instance.notificationSettings[setting].inGame;
        }

        let row = DiscordTools.getNotificationButtonsRow(
            setting,
            instance.notificationSettings[setting].discord,
            instance.notificationSettings[setting].inGame);
        interaction.update({ components: [row] });
    }
    else if (interaction.customId.endsWith('ServerConnect')) {
        let server = interaction.customId.replace('ServerConnect', '');

        for (const [key, value] of Object.entries(instance.serverList)) {
            if (value.active) {
                instance.serverList[key].active = false;
                let row = DiscordTools.getServerButtonsRow(key, 0, instance.serverList[key].url);
                client.serverListMessages[guildId][key].edit({ components: [row] });
            }
        }

        instance.serverList[server].active = true;
        let row = DiscordTools.getServerButtonsRow(server, 1, instance.serverList[server].url);
        interaction.update({ components: [row] });

        /* Disconnect previous instance is any */
        if (client.rustplusInstances.hasOwnProperty(guildId)) {
            client.rustplusInstances[guildId].disconnect();
        }

        /* Create the rustplus instance */
        client.createRustplusInstance(
            guildId,
            instance.serverList[server].serverIp,
            instance.serverList[server].appPort,
            instance.serverList[server].steamId,
            instance.serverList[server].playerToken
        );
    }
    else if (interaction.customId.endsWith('ServerDisconnect')) {
        let server = interaction.customId.replace('ServerDisconnect', '');

        instance.serverList[server].active = false;
        let row = DiscordTools.getServerButtonsRow(server, 0, instance.serverList[server].url);
        interaction.update({ components: [row] });

        /* Disconnect previous instance if any */
        if (client.rustplusInstances.hasOwnProperty(guildId)) {
            client.rustplusInstances[guildId].disconnect();
            delete client.rustplusInstances[guildId];
        }
    }
    else if (interaction.customId.endsWith('ServerDelete')) {
        let server = interaction.customId.replace('ServerDelete', '');

        if (instance.serverList[server].active) {
            if (client.rustplusInstances.hasOwnProperty(guildId)) {
                client.rustplusInstances[guildId].disconnect();
                delete client.rustplusInstances[guildId];
            }
        }

        delete instance.serverList[server];

        client.serverListMessages[guildId][server].delete().then(() => {
            delete client.serverListMessages[guildId][server];
        });
    }

    client.writeInstanceFile(guildId, instance);
}
