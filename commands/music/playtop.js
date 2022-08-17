const { getVoiceConnection } = require("@discordjs/voice");
const { default: YouTube } = require('youtube-sr');
const { Permissions } = require("discord.js");
module.exports = {
    name: "playtop",
    aliases: ["pt"],
    description: "Plays Music in your Voice Channel and positions it to the queue top",
    run: async (client, message, args, prefix) => {
        if(!message.member.voice.channelId) return message.reply("<:oddno:968555009908293652> **Please join a Voice-Channel first!**").catch(() => null);
        if(!message.member.voice.channel?.permissionsFor(message.guild?.me)?.has(Permissions.FLAGS.CONNECT)) {
            return message.reply({ content: "<:oddno:968555009908293652> **I'm missing the Permission to Connect to your Voice-Channel!**"}).catch(() => null);
        }
        if(!message.member.voice.channel?.permissionsFor(message.guild?.me)?.has(Permissions.FLAGS.SPEAK)) {
            return message.reply({ content: "<:oddno:968555009908293652> **I'm missing the Permission to Speak in your Voice-Channel!**"}).catch(() => null);
        }
             
        // get an old connection
        const oldConnection = getVoiceConnection(message.guild.id);
        if(oldConnection && oldConnection.joinConfig.channelId != message.member.voice.channelId) return message.reply("<:oddno:968555009908293652> **We are not in the same Voice-Channel**!").catch(() => null);
        const queue = client.queues.get(message.guild.id); // get the queue
        if(!queue) { 
            return message.reply(`<:oddno:968555009908293652> **Nothing playing right now**`).catch(() => null);
        }
        const track = args.join(" ");
        if(!args[0]) return message.reply(`<:oddno:968555009908293652> Please add the wished Music via: \`${prefix}playtop <Name/Link>\``).catch(() => null);
        // Regexpressions for testing the search string
        const youtubRegex = /^(https?:\/\/)?(www\.)?(m\.|music\.)?(youtube\.com|youtu\.?be)\/.+$/gi;
        const playlistRegex = /^.*(list=)([^#\&\?]*).*/gi;
        const songRegex = /^.*(watch\?v=)([^#\&\?]*).*/gi;
        // variables for song, and playlist
        let song = null;
        let playlist = null;
        // Use the regex expressions
        const isYT = youtubRegex.exec(track);
        const isSong = songRegex.exec(track);
        const isList = playlistRegex.exec(track)
            
        try {
            // try to play the requested song
            const m = await message.reply(`🔍 *Searching **${track}** ...*`).catch(() => null);
            // get song from the link
            if(isYT && isSong && !isList) {
                song = await YouTube.getVideo(track); 
            }
            // get playlist from the link
            else if(isYT && !isSong && isList) {
                playlist = await YouTube.getPlaylist(track).then(playlist => playlist.fetch());
            }
            // get playlist & song from the link
            else if(isYT && isSong && isList) {
                song = await YouTube.getVideo(`https://www.youtube.com/watch?v=${isSong[2]}`); 
                playlist = await YouTube.getPlaylist(`https://www.youtube.com/playlist?list=${isList[2]}`).then(playlist => playlist.fetch());
            }
            // otherwise search for it
            else {
                song = await YouTube.searchOne(track); 
            }
            if(!song && !playlist) return m.edit(`<:oddno:968555009908293652> **Failed looking up for ${track}!**`);
            /* FOR NO PLAYLIST REQUESTS */
            if(!playlist) {
                // Add the song to the queue
                queue.tracks = [queue.tracks[0], client.createSong(song, message.author), ...queue.tracks.slice(1)]
                // edit the loading message     
                return m.edit(`<:oddmu:968552025723928647> **Queued at \`1st\`: __${song.title}__** - \`${song.durationFormatted}\``).catch(() => null);
            } 
            /* FOR PLAYLIST REQUEST */
            else {
                // get the song, or the first playlist song
                song = song ? song : playlist.videos[0];
                // remove the song which got added
                const index = playlist.videos.findIndex(s => s.id == song.id) || 0;
                playlist.videos.splice(index, 1) 
                const playlistSongs = []
                // Add the playlist songs to the queue
                playlist.videos.forEach(song => playlistSongs.push(client.createSong(song, message.author)))
                queue.tracks = [queue.tracks[0], client.createSong(song, message.author), ...playlistSongs, ...queue.tracks.slice(1)]
                // edit the loading message                    
                return m.edit(`<:oddmu:968552025723928647> **Queued at \`1st\`: __${song.title}__** - \`${song.durationFormatted}\`\n> **Added \`${playlist.videos.length - 1} Songs\` from the Playlist:**\n> __**${playlist.title}**__`).catch(() => null);
            }

        } catch (e){ console.error(e);
            return message.reply(`<:oddno:968555009908293652> Could not play the Song because: \`\`\`${e.message || e}`.substring(0, 1950) + `\`\`\``).catch(() => null);
        }
    },
};