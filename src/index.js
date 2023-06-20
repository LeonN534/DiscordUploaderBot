import dotenv from 'dotenv';
import { randomBytes, createCipheriv, createDecipheriv } from 'crypto';
import { Client, GatewayIntentBits, Partials, bold, codeBlock } from 'discord.js';
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
let botWaitMode = false;
let botDataCounter = 1;

const CRYPTO_ALGORITHM = 'aes-256-cbc';
const CRYPTO_KEY = randomBytes(32);
const CRYPTO_IV = randomBytes(16); 

const data = {
    channelToListen: null,
    serverIp: null,
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
        // botUserAdmin = log.entries.first().executor;
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

    client.users.fetch(process.env.TESTING_USER, false).then((user) => {
        botUserAdmin = user;
    })

    // Check for DM messages from the BotAdmin 
    if(message.guild == null && message.author.id == process.env.TESTING_USER) {
        
        // Check if the bot is waiting for the username or password (Waiting mode)
        if(botWaitMode) {
            let auxUsername, auxPassword;
            //Check if the bot is waiting either for the username or the password
            switch(botDataCounter) {
                case 1:
                    auxUsername = message.content;
                    botDataCounter++;
                    break;
                case 2:
                    auxPassword = message.content;
                    data.serverUsers.push({
                        name: `${auxUsername}`,
                        password: `${encrypt(auxPassword)}`
                    });
                    botDataCounter = 1; // Reset the counter to start waiting for the username in the next wait mode
                    botWaitMode = false; // Exit wait mode
                    break;
                default: 
                    console.log("An unexpected error has occurred.")
            }
        } else {
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
                botUserAdmin.send(bold("List of added users"));
                for(let x of data.serverUsers) {
                    botUserAdmin.send(`:white_check_mark: ${x.name}`);
                }
                botUserAdmin.send(``);
            } else if(message.content == ADD_SERVER_USER_COMMAND) {
                botWaitMode = true;
            }    
        }
        
    }

    // Check for messages from the channel to be listened to
    

})

function encrypt(text) {
    let cipher = createCipheriv(CRYPTO_ALGORITHM, Buffer.from(CRYPTO_KEY), CRYPTO_IV);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return { 
        iv: iv.toString('hex'),
        encryptedData: encrypted.toString('hex') 
    };
}

function decrypt(text) {
    let iv = Buffer.from(text.iv, 'hex');
    let encryptedText = Buffer.from(text.encryptedData, 'hex');
 
    let decipher = createDecipheriv(CRYPTO_ALGORITHM, Buffer.from(CRYPTO_KEY), iv);
 
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
 
    return decrypted.toString();
}

client.login(process.env.DISCORD_TOKEN);