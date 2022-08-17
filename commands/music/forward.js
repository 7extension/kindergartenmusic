const { getVoiceConnection } = require("@discordjs/voice");
module.exports = {
    name: "forward",
    aliases: ["fwd", "fd"],
    description: "Forwards for X (secs)",
    run: async (client, message, args, prefix) => {
        try {
            if(!message.member.voice.channelId) return message.reply({content: "<:oddno:968555009908293652> **Please join a Voice-Channel first!**"}).catch(() => null);
            
            const oldConnection = getVoiceConnection(message.guild.id);
            if(!oldConnection) return message.reply({content: "<:oddno:968555009908293652> **I'm not connected somewhere!**"}).catch(() => null);
            if(oldConnection && oldConnection.joinConfig.channelId != message.member.voice.channelId) return message.reply({content: "<:oksir:968537628871888906> **We are not in the same Voice-Channel**!"}).catch(() => null);
            
            const queue = client.queues.get(message.guild.id); // get the queue
            if(!queue || !queue.tracks || !queue.tracks[0]) { 
                return message.reply(`<:oddno:968555009908293652> **Nothing playing right now**`).catch(() => null);
            }
            
            const curPos = oldConnection.state.subscription.player.state.resource.playbackDuration;
        
            if(!args[0] || isNaN(args[0])) return message.reply({ content: `<:oddno:968555009908293652> **You forgot to add the forwarding-time!** Usage: \`${prefix}forward <Time-In-S>\``}).catch(() => null);
            
            if(Number(args[0]) < 0 || Number(args[0]) > Math.floor((queue.tracks[0].duration - curPos) / 1000 - 1))
            return message.reply({ content: `<:oddno:968555009908293652> **The Forward-Number-Pos must be between \`0\` and \`${Math.floor((queue.tracks[0].duration - curPos) / 1000 - 1)}\`!**`}).catch(() => null);
            
            const newPos = curPos + Number(args[0]) * 1000;
            // set Filterschanged to true
            queue.filtersChanged = true;
            // seek
            oldConnection.state.subscription.player.stop();
            oldConnection.state.subscription.player.play(client.getResource(queue, queue.tracks[0].id, newPos));
            
            message.reply({content: `<:oddmu:968552025723928647> **Forwarded for \`${args[0]}s\` to \`${client.formatDuration(newPos)}\`**!`}).catch(() => null);
        } catch(e) { 
            console.error(e);
            message.reply({content: `<:oddno:968555009908293652> Could not join your VC because: \`\`\`${e.message || e}`.substring(0, 1950) + `\`\`\``}).catch(() => null);
        }
    },
};