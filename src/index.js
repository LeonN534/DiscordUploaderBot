import dotenv from 'dotenv';
import {Client, GatewayIntentBits, Partials, codeBlock} from 'discord.js';
import {
    GREETING_MESSAGE, 
    SET_CHANNEL_COMMAND, 
    SET_SERVER_IP_COMMAND, 
    SET_SERVER_PORT_COMMAND, 
    ADD_SERVER_USER_COMMAND, 
    DELETE_SERVER_USER_COMMAND, 
    LIST_SERVER_USERS_COMMAND
} from './constants.js';

dotenv.config();

let botUserAdmin;

const data = {
    channelToListen,
    serverIp: "",
    serverPort: "21",
    serverUsers: []
}

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
        ${codeBlock(SET_CHANNEL_COMMAND)}This command is used to set the channel where I'll check for the files to upload. To set the channel, add the channel ID after the command separating it by and space.
        ${codeBlock(SET_SERVER_IP_COMMAND)}This command is used to set the IP of the remote server I will connect to. To set the IP, add IP direction after the command separating it by and space.
        ${codeBlock(SET_SERVER_PORT_COMMAND)}This command is used to set the port of the remote server I will connect to. To set the port, add the port number after the command separating it by and space. If you don't set this value, I will try to connect to the port 21.
        ${codeBlock(ADD_SERVER_USER_COMMAND)}This command is used to add a user of the VPS where the files will be uploaded. After you type this command, the first message will be stored as the username, and the second message as the password for that user. When you type this command, the bot will not work until you send the two messages. You can delete the messages where you wrote you username and password. And don't worry, the passwords are encrypted before being stored.
        ${codeBlock(LIST_SERVER_USERS_COMMAND)}This command is used to list all the users of the VPS where the bot will upload the files to.
        ${codeBlock(DELETE_SERVER_USER_COMMAND)}This command is used to delete a user from the list of users where the bot will upload the files to. To delete a user, add username after the command separating it by and space.
        `);
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
                        data.channelToListen = value.id;
                        botUserAdmin.send(`Channel succesfully set! :smiley:`);
                    } else {
                        botUserAdmin.send(`That's not a valid text channel! :cry:`);
                    }
                },
                (error) => {
                    botUserAdmin.send(`That's not a valid channel! :cry:`);
                }
            );
        } else if(message.content.startsWith(SET_SERVER_IP_COMMAND)) {
            command = message.content.split(" ");
            if(command[2] == "" || command[2] == undefined) return;
            if (/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(command[2])) {  
                botUserAdmin.send(`Server ip succesfully set! :smiley:`);
            }  
        } else if(message.content.startsWith(SET_SERVER_PORT_COMMAND)) {
            command = message.content.split(" ");
            if(command[2] == "" || command[2] == undefined || !Number.isInteger(Number(command[2]))) return;
            data.serverPort = command[2];
            botUserAdmin.send(`Server port succesfully set! :smiley:`);
        } else if(message.content == LIST_SERVER_USERS_COMMAND) {
            
            botUserAdmin.send(``);
        } else if(message.content == ADD_SERVER_USER_COMMAND) {
            
        }
    }

})


client.login(process.env.DISCORD_TOKEN);