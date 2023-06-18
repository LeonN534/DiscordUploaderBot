import dotenv from 'dotenv';
import {Client, GatewayIntentBits, Partials, codeBlock} from 'discord.js';
import {GREETING_MESSAGE, SET_CHANNEL_COMMAND, SET_SERVER_IP_COMMAND, SET_SERVER_PASSWORD_COMMAND, SET_SERVER_PORT_COMMAND} from './constants.js';

dotenv.config();

let botUserAdmin;
let channelToListen, serverIp, serverPass, serverPort = '21';

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.DirectMessages
    ],
    partials: [
        Partials.Channel,
        Partials.Message
    ]
})

client.on('ready', async () => {
    console.log("The bot is ready");
    
});


client.on("guildCreate", guild => {
    guild.fetchAuditLogs({type: 28, limit: 1}).then(log => {
        botUserAdmin = log.entries.first().executor;
        console.log(botUserAdmin);
        botUserAdmin.send(`
        ${GREETING_MESSAGE}             
        `).catch(e => console.error(e));
    });

    guild.fetchAuditLogs({type: 28, limit: 1}).then(log => {
        botUserAdmin.send(`
        ${codeBlock(SET_CHANNEL_COMMAND)}This command is used to set the channel ID where I'll check for the files to upload. This value is necessary.
        ${codeBlock(SET_SERVER_IP_COMMAND)}This command is used to set the ip of the remote server I will connect to. This value is necessary.
        ${codeBlock(SET_SERVER_PORT_COMMAND)}This command is used to set the port of the remote server I will connect to. If you don't set this value, I will try to connect to the port 21.
        ${codeBlock(SET_SERVER_PASSWORD_COMMAND)}This command is used to set the password of the remote server I will connect to. This value is necessary.
        In all of the above commands you must ommit the double quotes (" ") and replace argument with the value to set.
        `).catch(e => console.error(e));
    });
});

client.on('messageCreate', async (message) => {
    if(message == undefined) return;
    if(message.author.id !== process.env.TESTING_USER) return;
    if(message.guild == null) {
        let command = [];
        if(message.content.startsWith(SET_CHANNEL_COMMAND)) {
            command = message.content.split(" ");
            if(command[2] == "" || command[2] == undefined) return;

            client.channels.fetch(command[2]).then(
                (value) => {
                    if(value.type == 0) {
                        channelToListen = value.id;
                        botUserAdmin.send(`Channel succesfully set! :smiley:`);
                    } else {
                        botUserAdmin.send(`That's not a valid channel! :cry:`);
                    }
                },
                (error) => {
                    botUserAdmin.send(`That's not a valid channel! :cry:`);
                }
            );
        } else if(message.content.startsWith(SET_SERVER_IP_COMMAND)) {
            command = message.content.split(" ");
        } else if(message.content.startsWith(SET_SERVER_PASSWORD_COMMAND)) {
            command = message.content.split(" ");
            if(command[2] == "" || command[2] == undefined) return;
            serverPass = command[2];
        } else if(message.content.startsWith(SET_SERVER_PORT_COMMAND)) {
            command = message.content.split(" ");
            if(command[2] == "" || command[2] == undefined || !Number.isInteger(Number(command[2]))) return;
            serverPort = command[2];
        }
    }

})


client.login(process.env.DISCORD_TOKEN);