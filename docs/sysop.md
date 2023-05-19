# Administrative documentation
Documentation for system operators.

## Requirements
System requirements.

- `node` — Bacon application is written in javascript and runs with [`Node.js`](https://nodejs.org).
	- package dependencies from [`package.json`](/package.json)
- `npm` (comes with `node`) — Bacon is available as a [`npm`](https://www.npmjs.com) package.
- `mysql-server` — Bacon uses `mysql` database to store data.
	- `event_scheduler` — Bacon removes old data using mysql events.
- access to an e-mail SMTP server.

## Installation
Requirements installation.

1. Install system dependencies.

	- Debian and Debian-based Linux distributions:

		```bash
		sudo apt install mysql-server nodejs
		```

	- Windows:

		- Install [`Node.js`](https://nodejs.org)
		- Install MySQL server, for example [WinNMP](https://winnmp.wtriple.com)

	<br>

1. Install the `bacon` [`npm`](https://www.npmjs.com) package.

	```bash
	git clone https://github.com/Copernicon/bacon.git .
	npm install
	```

## Configuration
Bacon configuration.

1. Create an SQL database for Bacon to store data.

	- Character set: `utf8`
	- Collation: `utf8_unicode_ci` (`utf8mb3_unicode_ci`)

	<br>

	```sql
	CREATE DATABASE IF NOT EXISTS bacon CHARACTER SET utf8 COLLATE utf8_unicode_ci;
	```

	> *(optionally)* Replace `bacon` with desired database name.

	<br>

1. Add a user to the Bacon database and grant it all privileges.

	```sql
	CREATE USER 'bacon'@'localhost' IDENTIFIED WITH mysql_native_password BY 'letmein';
	GRANT ALL PRIVILEGES ON bacon.* TO 'bacon'@'localhost';
	```

	> - *(optionally)* Replace `localhost` with desired hostname.
	> - *(optionally)* Replace `bacon` with desired username.
	> - *(optionally)* Replace `bacon.*` with desired database name, followed by `.*`.
	> - Replace `letmein` with desired password.

	<br>

1. Enable the mysql event scheduler.

	```sql
	SET GLOBAL event_scheduler = ON;
	```

	> Enable event scheduler permanently.

	- Debian and Debian-based Linux distributions:

		Add the following line under the `[mysqld]` section of a `/etc/mysql/my.ini` file:

		```ini
		event_scheduler = on
		```

1. Make all files inside `bacon` main directory readable and writeable by owner.

	- Linux:

		```bash
		chmod -R u+rw .
		```

1. Make the following files not readable by others:

	- `/modules/core/backend/data/database.json`
	- `/modules/core/backend/data/email.json`

	<br> Commands:

	- Linux:

		```bash
		chmod o-r ./modules/core/backend/data/database.json
		chmod o-r ./modules/core/backend/data/email.json
		```

1. Edit file `/modules/core/backend/data/database.json`, setting database access data.
1. Edit file `/modules/core/backend/data/email.json`, setting email SMTP data.

<br>

## Fast start
Once the installation and configuration is done, just start the Bacon.

```bash
npm start
```

## Commands
Bacon `npm` commands.

- Install: `npm install`
- Start: `npm start`

## Interactivity
Bacon application is interactive if the `interactive` option is enabled.

> Related data entry:
> - `interactive` at [`/core/backend/data/server.json`](/modules/core/backend/data/server.json)

### Options
Restart
- Pressing `R` restarts the application.
- Sending a level 3 reset system error code, *ie* `47`, restarts the application.

Quit
- Pressing `Q` quits the application.

## Cluster
Bacon utilizes a [cluster](https://nodejs.org/api/cluster.html) to fork itself upon restart, or upon an error if the `autorestart` option is enabled.

> Related data entry:
> - `autorestart` at [`/core/backend/data/server.json`](/modules/core/backend/data/server.json)