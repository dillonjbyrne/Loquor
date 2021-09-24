const { Client, Intents } = require('discord.js');
const {
	joinVoiceChannel,
	createAudioPlayer,
	createAudioResource,
	entersState,
	StreamType,
	AudioPlayerStatus,
	VoiceConnectionStatus,
} = require('@discordjs/voice');
// const ytdl = require('ytdl-core-discord');
const youtubedl = require('youtube-dl-exec');
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_VOICE_STATES] });
const { clientId, token } = require('./config.json');
let queue = [];
let loop = false;
let currentConnection;
let player;

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
				if (player) {
					player.stop();
				}
				player = createAudioPlayer();
				player.on(AudioPlayerStatus.Idle, () => {
					player.stop();
					player = null;
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
		url = interaction.options.getString('url')
		queue.push(url);
		if (!player) {
			const targetVoiceChannel = interaction.options.getChannel('channel-to-join') ?? interaction.member.voice.channel;
			if (targetVoiceChannel && targetVoiceChannel.joinable) {
				try {
					player = createAudioPlayer();
					player.on(AudioPlayerStatus.Idle, () => {
						if (loop) {
							playUrl(queue[0], player);
						} else if (queue.length > 1) {
							queue.shift();
							playUrl(queue[0], player);
						} else {
							queue.shift();
							player.stop();
							player = null;
							currentConnection.destroy();
						}
					});
					playUrl(queue[0], player);
					currentConnection = await connectToChannel(targetVoiceChannel);
					currentConnection.subscribe(player);
					await interaction.reply({ content: `Playing ${queue[0]}`});
				} catch (error) {
							console.error(error);
				}
			} else {
				await interaction.reply(`I cannot join the voice channel you asked me to join: ${targetVoiceChannel.name}. Please join or specify a voice channel that I have access to.`);
			}
		} else {
			await interaction.reply(`Added ${url} to the queue. Current queue size: ${queue.length}`)
		}
	}

	if (interaction.commandName === 'loop') {
		loop = !loop;
		await interaction.reply(loop ? 'Looping the current song!' : 'Looping off');
	}

	if (interaction.commandName === 'stop') {
		queue = [];
		if (player) {
			player.stop();
			player = null;
			currentConnection.destroy();
		}
		await interaction.reply("Playback stopped and queue cleared.");
	}
});

function playMp3(mp3file, player) {
	const resource = createAudioResource(mp3file, {
		inputType: StreamType.Arbitrary,
	});

	player.play(resource);

	return entersState(player, AudioPlayerStatus.Playing, 5e3);
}

async function playUrl(url, player) {
//   let stream = await ytdl(url);
	let stream = youtubedl.raw(url, {
		o: '-',
		q: '',
		f: 'bestaudio[ext=webm+acodec=opus+asr=48000]/bestaudio',
		r: '100K',
	}, { stdio: ['ignore', 'pipe', 'ignore'] });

	const resource = createAudioResource(stream.stdout);

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