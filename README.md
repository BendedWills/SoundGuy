# SoundGuy
SoundGuy is a fun Discord bot that will join an active voice channel, play a sound, and leave.

# How does it work?
Every hour (by default), SoundGuy will find a non-empty voice channel and play some sound.
The sound files are located in the `sounds` folder. You can put audio files you wish for it to play in this folder.

You can also provide phrases that the bot will respond to by creating a `phrases.json` file in the root of the repo. Provide them like this:
```json
{
    "phrase 1": "response",
    "phrase 2": "response 2",
    "phrase 3": "response 3"
}
```

Note: in order to authenticate with Discord successfully, you must provide the token for the Discord application in `token.txt`.
DO NOT SHARE THIS TOKEN WITH ANYONE!

# Running
First, let's setup the environment:
1. Install node.js and npm
2. Clone the repo into some directory and enter it
3. Run `npm install` to install dependencies (listed in `package.json`)
4. Put the token file for the Discord app in `token.txt` (you can get this from https://discord.com/developers/applications)

Finally, run SoundGuy using `node .` in the root of the repo