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
const ytdl = require('ytdl-core-discord');
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_VOICE_STATES] });
const { clientId, token } = require('./config.json');
let queue = [];
let loop = false;
let currentConnection;

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
        let player = createAudioPlayer();
        player.on(AudioPlayerStatus.Idle, () => {
          player.stop();
          currentConnection.destroy();
        });
				playMp3('./PizzaTime.mp3', player);
				currentConnection = await connectToChannel(targetVoiceChannel);
				currentConnection.subscribe(player);
				await interaction.reply({ content: ':pizza::timer:', ephemeral: true});
			} catch (error) {
				console.error(error);
			}
		}
		else {
			await interaction.reply({ content:`I cannot join the voice channel you asked me to join: ${targetVoiceChannel.name}. Please join or specify a voice channel that I have access to.`, ephemeral: true});
		}
	}

  if (interaction.commandName === 'play') {
    const targetVoiceChannel = interaction.options.getChannel('channel-to-join') ?? interaction.member.voice.channel;
		if (targetVoiceChannel && targetVoiceChannel.joinable) {
      try {
        addToQueue(interaction.options.getString('url'));
        let player = createAudioPlayer();
        player.on(AudioPlayerStatus.Idle, () => {
          player.stop();
          currentConnection.destroy();
        });
        playUrl(queue[0], player);
        currentConnection = await connectToChannel(targetVoiceChannel);
				currentConnection.subscribe(player);
				await interaction.reply({ content: 'Playing!', ephemeral: true});
      } catch (error) {
				console.error(error);
			}
    }
		else {
			await interaction.reply({ content: `I cannot join the voice channel you asked me to join: ${targetVoiceChannel.name}. Please join or specify a voice channel that I have access to.`, ephemeral: true});
		}
  }
});

function playMp3(mp3file, player) {
	const resource = createAudioResource(mp3file, {
		inputType: StreamType.Arbitrary,
	});

	player.play(resource);

	return entersState(player, AudioPlayerStatus.Playing, 5e3);
}

function addToQueue(url) {
  queue.push(url);
}

async function playUrl(url, player) {
  let stream = await ytdl(url);

  const resource = createAudioResource(stream, {
		inputType: StreamType.Opus,
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