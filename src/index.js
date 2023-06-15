import dotenv from 'dotenv';
import {Client, GatewayIntentBits, Partials, codeBlock} from 'discord.js';
import {GREETING_MESSAGE, SET_CHANNEL_COMMAND, SET_SERVER_IP_COMMAND, SET_SERVER_PASSWORD_COMMAND, SET_SERVER_PORT_COMMAND} from './constants.js';
dotenv.config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.DirectMessages
    ],
    partials: [
        Partials.Channel
    ]
})

client.on('ready', async () => {
    console.log("The bot is ready");
    
});


client.on("guildCreate", guild => {
    guild.fetchAuditLogs({type: 28, limit: 1}).then(log => {
        log.entries.first().executor.send(`
        ${GREETING_MESSAGE}             
        `).catch(e => console.error(e));
    });

    guild.fetchAuditLogs({type: 28, limit: 1}).then(log => {
        log.entries.first().executor.send(`
        ${codeBlock(SET_CHANNEL_COMMAND)}This command is used to set the channel where I'll check for the files to upload. This value is necessary.
        ${codeBlock(SET_SERVER_IP_COMMAND)}This command is used to set the ip of the remote server I will connect to. This value is necessary.
        ${codeBlock(SET_SERVER_PORT_COMMAND)}This command is used to set the port of the remote server I will connect to. If you don't set this value, I will try to connect to the port 21.
        ${codeBlock(SET_SERVER_PASSWORD_COMMAND)}This command is used to set the password of the remote server I will connect to. This value is necessary.
    In all of the above commands you must ommit the double quotes (" ") and replace argument with the value to set.
        `).catch(e => console.error(e));
    });
});





client.login(process.env.DISCORD_TOKEN);