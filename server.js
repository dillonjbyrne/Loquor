const { Client, VoiceChannel, Intents } = require('discord.js');
const {
	joinVoiceChannel,
	createAudioPlayer,
	createAudioResource,
	entersState,
	StreamType,
	AudioPlayerStatus,
	VoiceConnectionStatus,
	VoiceConnection,
} = require('@discordjs/voice');
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_VOICE_STATES] });
const { clientId, token } = require('./config.json');
const player = createAudioPlayer();
var currentConnection;

client.on('ready', () => {
	console.log(`Logged in as ${client.user.tag}!`);
});

client.on('interactionCreate', async interaction => {
	if (!interaction.isCommand()) return;

	if (interaction.commandName === 'ping') {
		await interaction.reply('Pong!');
	}

	if (interaction.commandName === 'pizzatime') {
		await interaction.reply('https://c.tenor.com/bTo4-tTFqgMAAAAC/pizza-peter-parker.gif');
	}

	if (interaction.commandName === 'pizzaparker') {
		const targetVoiceChannel = interaction.options.getChannel('channel-to-join') ?? interaction.member.voice.channel;
		if (targetVoiceChannel && targetVoiceChannel.joinable) {
			try {
				playSong('./PizzaTime.mp3');
				currentConnection = await connectToChannel(targetVoiceChannel);
				currentConnection.subscribe(player);
				await interaction.reply({ content: ':pizza::timer:', ephemeral: true});
			} catch (error) {
				console.error(error);
			}
		}
		else {
			await interaction.reply({ content:`I cannot join the voice channel you asked me to join: ${targetVoiceChannel.name}. Please join a voice channel that I have access to.`, ephemeral: true});
		}
	}
});

player.on(AudioPlayerStatus.Idle, () => {
	currentConnection.destroy();
});

function playSong(mp3file) {
	const resource = createAudioResource(mp3file, {
		inputType: StreamType.Arbitrary,
	});

	player.play(resource);

	return entersState(player, AudioPlayerStatus.Playing, 5e3);
}

async function connectToChannel(channel) {
	const connection = joinVoiceChannel({
		channelId: channel.id,
		guildId: channel.guild.id,
		adapterCreator: channel.guild.voiceAdapterCreator,
	});

	try {
		await entersState(connection, VoiceConnectionStatus.Ready, 30e3);
		return connection;
	} catch (error) {
		connection.destroy();
		throw error;
	}
}

client.login(token);