# osu! stamina trainer bot

## English

osu! recommendation [bot](https://osu.ppy.sh/users/6484647) 
for stamina practice beatmaps.

### Commands

Values in parentheses `(` `)` can be inputted as either a number to use 
the default range or a range of numbers separated by the dash symbol
`-` to request a custom range.

Brackets and parentheses are not part of the commands.

- `!request` *`(bpm)`*: Requests a beatmap with a specified bpm, default 
  range +-5 bpm **(required)**.
    - *`stars=(beatmap star rating)`*: Specifies the beatmaps difficulty 
      rating, default range +-0.5.
    - `type=[stream type]`:  Specifies the beatmap dominant type of streams 
      given the following possibilities, default value all types:
        - `b or bursts`: Specifies 3 to 8 notes to be de dominant type.
        - `s or streams`: Specifies 9 to 32 notes to be de dominant type.
        - `d or deathstreams`: Specifies +33 notes to be de dominant type.
- `!help`: Links to the osu! stamina trainer bot wiki
- `!recommend`: WIP
- `!report`: WIP

### Tools

This project uses the following dependencies:
- [Banchojs](https://bancho.js.org/)
- [Sequelize](https://sequelize.org/master/)
- [PostgreSQL](https://www.postgresql.org/)
- [Nodejs](https://nodejs.org/en/)

### Other projects

- [osu! stamina trainer server](https://github.com/ojcastaneda/osu-stamina-trainer-server)
- [C# project for ranked beatmap streams analysis](https://github.com/ojcastaneda/osu-stream-detector)
- osu! stamina trainer web (WIP)

## Español

[bot](https://osu.ppy.sh/users/6484647) de recomendaciones de beatmaps de 
osu! para practicar stamina.

### Comandos

Parámetros entre paréntesis `(` `)` pueden ser escritos como valores 
individuales, los cuales van a llevar el rango por defecto, o pueden ser 
escritos como rangos separados con un guion `-` para establecer un rango 
customizado.

Los corchetes y paréntesis no hacen parte de los comandos.

- `!request` *`(bpm)`*: Solicita un beatmap con un bpm especificado
  rango por defecto +-5 bpm **(requerido)**.
    - *`stars=(dific)`*: Especifica la dificultad del beatmap, 
      rango por defecto +-0.5.
    - `type=[stream type]`: Especifica el tipo de stream dominante dentro 
      del beatmap según las siguientes posibilidades, el valor por defecto
      incluye todos los tipos:
        - `b or bursts`: Especifica 3 a 8 notas como tipo dominante.
        - `s or streams`: Especifica 9 a 32 notas como tipo dominante.
        - `d or deathstreams`: Especifica +33 notas como tipo dominante.
- `!help`: Redirecciona a la wiki de osu! stamina trainer bot
- `!recommend`: WIP
- `!report`: WIP

### Herramientas

Este proyecto usa las siguientes dependencias:
- [Banchojs](https://bancho.js.org/)
- [Sequelize](https://sequelize.org/master/)
- [PostgreSQL](https://www.postgresql.org/)
- [Nodejs](https://nodejs.org/en/)

### Otros proyectos

- [osu! stamina trainer server](https://github.com/ojcastaneda/osu-stamina-trainer-server)
- [Proyecto en C# para analizar streams de beatmaps rankeados](https://github.com/ojcastaneda/osu-stream-detector)
- osu! stamina trainer web (WIP)