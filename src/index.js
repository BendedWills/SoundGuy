import { Client, GatewayIntentBits, ChannelType } from 'discord.js';
import { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } from '@discordjs/voice';
import * as Schedule from 'node-schedule';
import * as fs from 'fs';
import * as Utils from './Utils.js';

console.log("Reading config...");
const CONFIG = JSON.parse(fs.readFileSync("config.json"));
const TOKEN = fs.readFileSync(CONFIG.tokenFile, 'utf8');

console.log("Reading phrases...");
let phrases = new Map();
try
{
    phrases = JSON.parse(fs.readFileSync("phrases.json"));
    console.log("Phrases:");
    console.log(phrases);
}
catch (err)
{
    console.log("No phrases found! Continuing without them...");
}

console.log("Finding sounds...");
const SOUND_PATHS = fs.readdirSync(CONFIG.soundsDir);

console.log("Creating discord.js client...");
const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
    rest: {
        timeout: 300_000
    }
});

client.on('clientReady', () => 
{
	console.log(`Logged in as ${client.user.tag}`);
});

function joinAndMessage(response, failureMessage, djsMessage)
{
    const member = djsMessage.member;
    const channel = client.channels.cache.get(member.voice.channelId);
    if (!channel)
    {
        if (failureMessage)
        	djsMessage.channel.send(failureMessage);
        
        return;
    }
    
    djsMessage.channel.send(response);
    
    joinVC(djsMessage.guild, getRandomSound(), channel);
}

client.on("messageCreate", (message) => 
{
    const messageLowercase = message.content.toLowerCase();
    
    if (message.author.bot) 
        return;
    
    if (Math.random() < CONFIG.randomResponseChance)
        message.channel.send(CONFIG.randomResponse);
    
    const response = phrases[messageLowercase];
    if (response)
    {
    	message.channel.send(response);
        return;
    }
 	
    if (messageLowercase == "join loser")
    {
        joinAndMessage("fine then", "you\'re not in a channel", message);
        return;
    }
});

client.login(TOKEN);

function findChannelToJoin(guild)
{
    let channelToJoin;
	guild.channels.cache.forEach(channel => 
	{
		if (channel.type !== ChannelType.GuildVoice)
			return;

		if (!channelToJoin)
		{
			channelToJoin = channel;
			return;
		}

		if (channel.members.size > channelToJoin.members.size)
			channelToJoin = channel;
	});
    
    return channelToJoin;
}

function getSound(soundName)
{
    const soundPath = CONFIG.soundsDir + "/" + soundName;

	if (!fs.existsSync(soundPath))
    {
    	console.log("Sound does not exist! Did something get moved or renamed? " 
			+ "The bot must be restarted when sounds are removed.");
        return null;
    }

	return createAudioResource(fs.createReadStream(CONFIG.soundsDir + "/" + soundName));
}

function getRandomSound()
{
	const soundIndex = Math.floor(Math.random() * SOUND_PATHS.length);
    console.log(`Playing sound \"${SOUND_PATHS[soundIndex]}\"`)
    
	return getSound(SOUND_PATHS[soundIndex]);
}

async function joinVC(guild, sound, channelToJoin)
{
	if (!channelToJoin || channelToJoin.members.size == 0)
		return;

	const connection = joinVoiceChannel({
		channelId: channelToJoin.id,
		guildId: guild.id,
		adapterCreator: guild.voiceAdapterCreator,
	});

	console.log(`Joined voice channel \"${channelToJoin.name}\" in guild \"${guild.name}\"`);
	
	const player = createAudioPlayer();
	player.play(sound);

	connection.subscribe(player);
	
	player.on(AudioPlayerStatus.Idle, () => {
		connection.destroy();
		console.log(`Left voice channel \"${channelToJoin.name}\" in guild \"${guild.name}\"`);
	});
}

function joinRandomVCs(sound)
{
	client.guilds.cache.forEach(guild => 
	{
		joinVC(guild, sound, findChannelToJoin(guild));
	});
}

console.log("Done. Waiting for console input. Send \"joinvcs\" to play a sound. This bot joins every hour by default.");

// Wait for commands
process.openStdin().addListener('data', (d) => 
{
	const input = d.toString().trim().toLowerCase();
    const command = Utils.getFirstWord(input);
    
	if (command === "joinvcs")
    {
        const soundFilename = Utils.getFilenameFromInput(input);
        
        if (soundFilename)
       		joinRandomVCs(getSound(filename));
        else
            joinRandomVCs(getRandomSound());
    }
});

Schedule.scheduleJob(CONFIG.joinTimerCrontab, function()
{
    joinRandomVCs(getRandomSound());
});