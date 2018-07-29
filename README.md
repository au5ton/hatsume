![hatsume](img/hatsume.png)

# hatsume
Telegram bot to act as a courier for Plex content requests.

## Running an instance

Hatsume is written in Node.js v10.x, however she might work on lower versions. Keep this in mind when deploying.

### Hatsume depends on the following APIs. You'll need to supply API keys from them:
- https://core.telegram.org/bots/api#authorizing-your-bot
- http://www.omdbapi.com/
- https://api.thetvdb.com/swagger
- https://www.themoviedb.org/documentation/api

### To get started:
- Clone repo and install dependencies:
- `git clone https://github.com/au5ton/hatsume.git`
- `npm install`
- [Setup mySQL or MariaDB (MariaDB please)](https://www.digitalocean.com/community/tutorials/how-to-install-mariadb-on-centos-7)
- Import the SQL database: 
- `mysql -u [username] -p newdatabase < sql/hatsume_db.sql`
- Setup environment variables:
- `cp .env.example .env`
- `nano .env`
- Run the bot:
- `node bot.js`
- If all startup checks pass, you're good to go!

## Usage

<img alt="screenshot1" src="img/screenshot1.png" width=480>
<img alt="screenshot2" src="img/screenshot2.png" width=480>


##### Character

*hatsume_bot is based off of Mei Hatsume, a character from Boku no Hero Academia (僕のヒーローアカデミア) and is property of [Bones Inc](http://www.bones.co.jp/).*
