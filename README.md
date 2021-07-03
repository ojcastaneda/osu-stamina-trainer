# osu! stamina trainer bot

## English

osu! standard recommendation [bot](https://osu.ppy.sh/users/6484647) 
for stamina practice beatmaps.

For bug reports and recommendations contact me via Discord Sombrax79#1333.

### Commands

Values in parentheses `(` `)` can be inputted as either a number to use 
the default range or a range of numbers separated by the dash symbol
`-` to request a custom range.

Brackets `[` `]` and parentheses `(` `)` are not part of the commands.

Leaving values as `number-` on any parameter that accept ranges will
match the exact value instead of a range.

- `!request (bpm)`: Requests a beatmap with a specified bpm, default 
  range +-5 bpm **(required)**.
    - `stars=(beatmap difficulty rating)`: Specifies the beatmaps difficulty 
      rating, default range +-0.5 stars.
    - `type=[stream type]`:  Specifies the beatmap dominant type of streams 
      given the following possibilities, default value all types:
        - `b or bursts`: Specifies 3 to 8 notes to be de dominant type.
        - `s or streams`: Specifies 9 to 32 notes to be de dominant type.
        - `d or deathstreams`: Specifies +33 notes to be de dominant type.
- `!help`: Links to the osu! stamina trainer bot wiki
- `!recommend`: WIP
- `!report`: WIP

### Examples of use

- `!request 180 stars=5 type=s`
    - Requests a 175 bpm to 185 bpm, with a star rating between 4.5 stars 
      to 5.5 stars that has a dominant tendency for 9-32 hit objects streams.
- `!request 190-200 stars=5.5-6 type=b`
    - Requests a 190 bpm to 200 bpm, with a star rating between 5.5 stars 
      to 6 stars that has a dominant tendency for 3-8 hit objects streams.
- `!r 180- stars=5.5- ar=9- type=d`
    - Requests a 180 bpm, with a 5.5 star rating, and ar 9
      that has a dominant tendency for +33 hit objects streams.

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
osu! standard para practicar stamina.

Para sugerencias y reportes de bug por favor contactarme via Discord Sombrax79#1333

### Comandos

Parámetros entre paréntesis `(` `)` pueden ser escritos como valores 
individuales, los cuales van a llevar el rango por defecto, o pueden ser 
escritos como rangos separados con un guión `-` para establecer un rango 
customizado.

Los corchetes `[` `]` y paréntesis `(` `)`no hacen parte de los comandos.

- `!request` `(bpm)`: Solicita un beatmap con un bpm especificado
  rango por defecto +-5 bpm **(requerido)**.
    - `stars=(dificultad del beatmap)`: Especifica la dificultad del beatmap, 
      rango por defecto +-0.5 estrellas.
    - `type=[tipo de stream]`: Especifica el tipo de stream dominante dentro 
      del beatmap según las siguientes posibilidades, el valor por defecto
      incluye todos los tipos:
        - `b or bursts`: Especifica 3 a 8 notas como tipo dominante.
        - `s or streams`: Especifica 9 a 32 notas como tipo dominante.
        - `d or deathstreams`: Especifica +33 notas como tipo dominante.
- `!help`: Redirecciona a la wiki de osu! stamina trainer bot
- `!recommend`: WIP
- `!report`: WIP

### Ejemplos de uso

- `!request 180 stars=5 type=s`
    - Solicita un beatmap entre 175 bpm a 185 bpm, con dificultad entre 
      4.5 estrellas a 5.5 estrellas con una tendencia dominante por streams
      de 9-32 notas.
- `!request 190-200 stars=5.5-6 type=b`
    - Solicita un beatmap entre 190 bpm a 200 bpm, con dificultad entre
      5.5 estrellas a 6 estrellas con una tendencia dominante por streams
      de 3-8 notas.
- `!r 180- stars=5.5- ar=9- type=d`
    - Solicita un beatmap de 180 bpm, con dificultad de 5.5 estrellas y
      con 9 ar con una tendencia dominante por streams de +33 notas.
      
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