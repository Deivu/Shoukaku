## Shoukaku
[![Discord](https://img.shields.io/discord/423116740810244097?style=flat-square)](https://discordapp.com/invite/FVqbtGu)
[![npm](https://img.shields.io/npm/v/shoukaku?style=flat-square)](https://www.npmjs.com/package/shoukaku)
![Github Stars](https://img.shields.io/github/stars/Deivu/Shoukaku?style=flat-square)
![GitHub issues](https://img.shields.io/github/issues-raw/Deivu/Shoukaku?style=flat-square)
![Snyk Vulnerabilities for npm package](https://img.shields.io/snyk/vulnerabilities/npm/shoukaku?style=flat-square) 
![NPM](https://img.shields.io/npm/l/shoukaku?style=flat-square)
<p align="center">
  <img src="https://upload.wikimedia.org/wikipedia/commons/0/00/Japanese_aircraft_carrier_shokaku_1941.jpg">
</p>

The ShipGirl Project. Shoukaku `(c) Kancolle for Shoukaku`

### A Full Blown Lavalink Wrapper designed around Discord.js v12

✅ Currently being used by: 

[![DBL](https://discordbots.org/api/widget/424137718961012737.svg)](https://discordbots.org/bot/424137718961012737)

### Why Shoukaku?
✅ Designed to used in Discord.JS v12

✅ Straightforward, Maintained, and Reliable.

✅ Stable for long term usage.

✅ Offers features that other libraries don't have.

✅ Very cute and reliable Shipgirl ❤ (Important)

### Documentation
https://deivu.github.io/Shoukaku/?api

### Installation
For Stable
```
npm i shoukaku
```
For Master
```
npm i Deivu/Shoukaku
```

### Changelogs
You can view it on [CHANGELOGS.MD](https://github.com/Deivu/Shoukaku/blob/master/CHANGELOGS.MD) file in this repository.

### Support Server
If you need help on using this, Join Here [ShipGirls Community](https://discordapp.com/invite/FVqbtGu) and `ask at #support`. 

### Issues or Bugs
Feel free to open an issue in the [Issues](https://github.com/Deivu/Shoukaku/issues) section of this repository.

### Notes 
> If you want to help in development, you can use the wrapper and report the issues you experienced on using it, or Submit a PR if you think you can improve something.

> There is a Discord.JS actual implementation and a simple implementation examples below.

### Starting a Lavalink Server
[View Lavalink README here](https://github.com/Frederikam/Lavalink/blob/master/README.md)

### Discord.js example implementation
[View Kongou's source code here](https://github.com/Deivu/Kongou)

### Really simple example of using this
```js
const { Client } = require('discord.js');
const { Shoukaku } = require('shoukaku');

const LavalinkServer = [{ name: 'Localhost', host: 'localhost', port: 6969, auth: 'big_weeb' }];
const ShoukakuOptions = { moveOnDisconnect: false, resumable: false, resumableTimeout: 30, reconnectTries: 2, restTimeout: 10000 };

class ExampleBot extends Client {
    constructor(opts) {
        super(opts);
        this.shoukaku = new Shoukaku(this, LavalinkServer, ShoukakuOptions);
    }

    login(token) {
        this._setupShoukakuEvents();
        this._setupClientEvents();
        return super.login(token);
    }

    _setupShoukakuEvents() {
        this.shoukaku.on('ready', (name) => console.log(`Lavalink Node: ${name} is now connected`));
        // You must handle error event
        this.shoukaku.on('error', (name, error) => console.log(`Lavalink Node: ${name} emitted an error.`, error));
        this.shoukaku.on('close', (name, code, reason) => console.log(`Lavalink Node: ${name} closed with code ${code}. Reason: ${reason || 'No reason'}`));
        this.shoukaku.on('disconnected', (name, reason) => console.log(`Lavalink Node: ${name} disconnected. Reason: ${reason || 'No reason'}`));
    }

    _setupClientEvents() {
        this.on('message', async (msg) => {
            if (msg.author.bot || !msg.guild) return;
            if (!msg.content.startsWith('$play')) return;
            if (this.shoukaku.getPlayer(msg.guild.id)) return;
            const args = msg.content.split(' ');
            if (!args[1]) return;
            const node = this.shoukaku.getNode();
            let data = await node.rest.resolve(args[1]);
            if (!data) return;
            if (Array.isArray(data)) data = data[0];
            const player = await node.joinVoiceChannel({
                guildID: msg.guild.id,
                voiceChannelID: msg.member.voice.channelID
            });
            const cleanFunction = (param) => {
                console.log(param);
                player.disconnect();
            }
            player.on('end', cleanFunction);
            player.on('closed', cleanFunction);
            player.on('error', cleanFunction);
            player.on('nodeDisconnect', cleanFunction);
            await player.playTrack(data.track);
            await msg.channel.send("Now Playing: " + data.info.title);
        });
        this.on('ready', () => console.log('Bot is now ready'));
    }
}

new ExampleBot()
    .login('token')
    .catch(console.error);
```
