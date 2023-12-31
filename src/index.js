import dotenv from 'dotenv';
import { randomBytes, createCipheriv, createDecipheriv } from 'crypto';
import { Client, GatewayIntentBits, Partials, bold, codeBlock } from 'discord.js';
import { NodeSSH } from 'node-ssh';
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

let botUserAdmin, auxUsername, auxPassword;
let botWaitMode = false;
let botDataCounter = 1;
let allowedFileExtensions = [];

const CRYPTO_ALGORITHM = 'aes-256-cbc';
const CRYPTO_KEY = randomBytes(32);
const CRYPTO_IV = randomBytes(16); 

const data = {
    channelToListen: null,
    serverIp: null,
    serverPort: "22",
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

client.on("guildCreate", async (guild) => {
    await guild.fetchAuditLogs({type: 28, limit: 1}).then(log => {
        // botUserAdmin = log.entries.first().executor;
        botUserAdmin.send(`
        ${GREETING_MESSAGE}             
        `).catch(e => console.error(e));
    });

    guild.fetchAuditLogs({type: 28, limit: 1}).then(log => {
        botUserAdmin.send(`
        ${codeBlock(SET_CHANNEL_COMMAND)}This command is used to set the channel where I'll check for the files to upload. To set the channel, add the channel ID after the command separating it by and space.
        ${codeBlock(SET_SERVER_IP_COMMAND)}This command is used to set the IP of the remote server I will connect to. To set the IP, add IP direction after the command separating it by and space.
        ${codeBlock(SET_SERVER_PORT_COMMAND)}This command is used to set the port of the remote server I will connect to. To set the port, add the port number after the command separating it by and space. If you don't set this value, I will try to connect to the port 22.
        ${codeBlock(ADD_SERVER_USER_COMMAND)}This command is used to add a user of the VPS where the files will be uploaded. After you type this command, the first message will be stored as the username, and the second message as the password for that user. When you type this command, the bot will not work until you send the two messages. You can delete the messages where you wrote you username and password. And don't worry, the passwords are encrypted before being stored.
        ${codeBlock(LIST_SERVER_USERS_COMMAND)}This command is used to list all the users of the VPS where the bot will upload the files to.
        ${codeBlock(DELETE_SERVER_USER_COMMAND)}This command is used to delete a user from the list of users where the bot will upload the files to. To delete a user, add the username after the command separating it by and space.
        `);
    });
});

client.on('messageCreate', async (message) => {

    // Set the value of the testing user
    await client.users.fetch(process.env.TESTING_USER, false).then((user) => {
        botUserAdmin = user;
    })

    // Check for DM messages from the BotAdmin 
    if(message.guild == null && message.author.id == process.env.TESTING_USER) {

        // TEST
        for(let file of message.attachments) {
            console.log(getUrlExtension(file[1].url));
        }
        // Check if the bot is waiting for the username or password (Waiting mode)
        if(botWaitMode) {
            //Check if the bot is waiting either for the username or the password
            switch(botDataCounter) {
                case 1:
                    auxUsername = message.content;
                    botDataCounter++;
                    break;
                case 2:
                    auxPassword = message.content;
                    if(data.serverUsers.findIndex((element) => {return element.name == auxUsername}) !== -1) {
                        botUserAdmin.send(`:warning: The user is already added!`);
                    } else {
                        data.serverUsers.push({
                            "name": auxUsername,
                            "password": encrypt(auxPassword)
                        });
                        botUserAdmin.send(`:white_check_mark: User successfully added!`);
                    }
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
                            botUserAdmin.send(`:white_check_mark: Channel successfully set!`);
                        } else {
                            botUserAdmin.send(`:warning: That's not a valid text channel!`);
                        }
                    },
                    (error) => {
                        botUserAdmin.send(`:warning: That's not a valid channel!`);
                    }
                );
            } else if(message.content.startsWith(SET_SERVER_IP_COMMAND)) {
                command = message.content.split(" ");
                if(command[3] == "" || command[3] == undefined) return;
                if (/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(command[3])) {  
                    data.serverIp = command[3];
                    botUserAdmin.send(`:white_check_mark: Server ip successfully set!`);
                } else {
                    botUserAdmin.send(":warning: That's not a valid IP address!"); 
                }
            } else if(message.content.startsWith(SET_SERVER_PORT_COMMAND)) {
                command = message.content.split(" ");
                if(command[3] == "" || command[3] == undefined) return;
                if(!Number.isInteger(Number(command[3]))) {
                    botUserAdmin.send(":warning: That's not a valid port!");   
                } else {
                    data.serverPort = command[3];
                    botUserAdmin.send(`:white_check_mark: Server port successfully set!`);
                }
            } else if(message.content == LIST_SERVER_USERS_COMMAND) {
                if(data.serverUsers.length == 0) {
                    botUserAdmin.send(":warning: There are no user added yet!");   
                } else {
                    botUserAdmin.send(bold("List of added users"));
                    for(let x of data.serverUsers) {
                        botUserAdmin.send(`:small_blue_diamond: ${x.name}`);
                    }
                }
            } else if(message.content == ADD_SERVER_USER_COMMAND) {
                botWaitMode = true;
            } else if(message.content.startsWith(DELETE_SERVER_USER_COMMAND)) {
                command = message.content.split(" ");
                if(command[3] == "" || command[3] == undefined) return;
                if(data.serverUsers.length == 0) {
                    botUserAdmin.send(":warning: There are no user added yet!");   
                } else {
                    let coincidence = data.serverUsers.findIndex((element) => {return element.name == command[3]});
                    if(coincidence !== -1) {
                        data.serverUsers.splice(coincidence, 1);
                        botUserAdmin.send(`:white_check_mark: The user has been deleted!`);
                    } else {
                        botUserAdmin.send(`:warning: The specified user is does not exist!`);
                    }
                }
            }
        }        
    } else if(message.guild !== null && message.channelId == data.channelToListen) {  // Check for messages from the channel to be listened to
        if(data.channelToListen == null || data.serverIp == null || data.serverUsers.length == 0) {
            message.author.send(`:warning: The bot parameters are not properly configured. I can't upload your files until this issue is fixed. Ask the admin of the server to solve this problem.`);
        } else {
            if(!message.attachments) return;
            // The bot will upload all types of files to the VPS, you can add values to the array "allowedFileExtensions" to limit the types of file the bot will upload
            if(allowedFileExtensions.length == 0) {
                // Upload every file

            } else {
                for(let file of message.attachments) {
                    for(let extension of allowedFileExtensions) {
                        if(getUrlExtension(file[1].url) == extension) {
                            // Upload files that have an allowed extension
                            
                        }
                    }
                }
            }
        }
    }

})

function encrypt(text) {
    let cipher = createCipheriv(CRYPTO_ALGORITHM, Buffer.from(CRYPTO_KEY), CRYPTO_IV);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    
    return { 
        iv: CRYPTO_IV.toString('hex'),
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

function getUrlExtension(url) {
    return url.split(/[#?]/)[0].split('.').pop().trim();
}

function uploadFile(host, username, port, password, file) {
    NodeSSH.connect()
}

client.login(process.env.DISCORD_TOKEN);