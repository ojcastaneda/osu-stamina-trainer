# osu! stamina trainer bot
##English
osu! recommendation [bot](https://osu.ppy.sh/users/6484647) for stream intensive beatmaps.
### Commands
Values in *italics* can be represented as either a number using a default range or a range of numbers separated by the dash symbol `-` in order to give a specific range.
- `!request` *`[bpm]`:* requests a  beatmap with a specified bpm(default range +-5 bpm)
	- *`stars=[beatmap difficulty]`*: specifies the beatmaps difficulty rating (default range +-0.5)
	- `type=[stream type]`:  Specifies the beatmap dominant type of streams given the following possibilities (default value all types):
		- `b or bursts `: Specifies 3 to 8 notes to be de dominant type.
		- `s or streams`: Specifies 8 to 32 notes to be de dominant type.
		- `d or deathstreams`: Specifies 32+ notes to be de dominant type.
- `!help`: Links to the osu! stamina trainer wiki
- `!recommend`: WIP
- `!report`: WIP


### Tools
This project was made using:
-[Banchojs](https://bancho.js.org/)
-[Sequelize](https://sequelize.org/master/)
-[PostgreSQL](https://www.postgresql.org/)
-[Nodejs](https://nodejs.org/en/)
### Other Repositories
-[osu! stamina trainer server](https://github.com/ojcastaneda/osu-stamina-trainer-server)
-[C# project for ranked beatmap analysis](https://github.com/ojcastaneda/osu-stream-detector)
-osu! stamina trainer admin panel (WIP)