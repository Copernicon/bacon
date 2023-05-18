import cluster from 'node:cluster';
import process from 'node:process';
import Application from '/core/backend/scripts/classes/Application.mjs';
import Console from '/core/backend/scripts/interfaces/Console.mjs';
import server from '/core/backend/data/server.json' assert { type: 'json' };

/** The level 3 reset system error code. */
const resetCode = 47;

if (cluster.isPrimary)
{
	cluster.fork();
	cluster.on('exit', ({}, code) => void ((server.autorestart ? code : code == resetCode) && cluster.fork()));
}
else
{
	if (server.interactive)
	{
		process.stdin.setRawMode(true);
		process.stdin.on('data', async data =>
		{
			const key = data.toString();

			switch (key)
			{
				// exit
				case 'q':

					Console.title('Stop');
					Console.warn('Bacon is stopping.');
					await Application.stop.run();
					Console.title('Goodbye');
					process.exit(0);

				// restart
				case 'r':

					Console.title('Restart');
					Console.warn('Bacon is restarting.');
					await Application.stop.run();
					process.exit(resetCode);
			}
		});
	}

	await Application.start.run();
}