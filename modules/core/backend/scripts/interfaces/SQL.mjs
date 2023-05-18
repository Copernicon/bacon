import process from 'node:process';
import util from 'node:util';
import mysql from 'mysql';
import database from '/core/backend/data/database.json' assert { type: 'json' };

/**
	@typedef {string} PreparedStatement
	SQL prepared statement (can contain placeholders).

	Related types:
	- {@link PreparedStatementParameter `PreparedStatementParameter`}
	- {@link PreparedStatementParameters `PreparedStatementParameters`}
	- {@link PreparedStatementNamedParameters `PreparedStatementNamedParameters`}
	- {@link PreparedStatementUnnamedParameters `PreparedStatementUnnamedParameters`}
	- {@link Query `Query`}

	Related class:
	- {@link SQL `SQL`}

*//**

	@typedef {null | boolean | number | string} PreparedStatementParameter
	Parameter to replace SQL prepared statement placeholder.

	Related types:
	- {@link PreparedStatement `PreparedStatement`}
	- {@link PreparedStatementParameters `PreparedStatementParameters`}
	- {@link PreparedStatementNamedParameters `PreparedStatementNamedParameters`}
	- {@link PreparedStatementUnnamedParameters `PreparedStatementUnnamedParameters`}

	Related class:
	- {@link SQL `SQL`}

*//**

	@typedef {PreparedStatementNamedParameters | PreparedStatementUnnamedParameters} PreparedStatementParameters
	Parameters to replace SQL prepared statement placeholders.

	Related types:
	- {@link PreparedStatement `PreparedStatement`}
	- {@link PreparedStatementParameter `PreparedStatementParameter`}
	- {@link PreparedStatementNamedParameters `PreparedStatementNamedParameters`}
	- {@link PreparedStatementUnnamedParameters `PreparedStatementUnnamedParameters`}
	- {@link Query `Query`}

	Related class:
	- {@link SQL `SQL`}

*//**

	@typedef {Object.<string, PreparedStatementParameter>} PreparedStatementNamedParameters
	Named parameters to replace SQL prepared statement placeholders.

	Related types:
	- {@link PreparedStatement `PreparedStatement`}
	- {@link PreparedStatementParameter `PreparedStatementParameter`}
	- {@link PreparedStatementParameters `PreparedStatementParameters`}
	- {@link PreparedStatementUnnamedParameters `PreparedStatementUnnamedParameters`}

	Related class:
	- {@link SQL `SQL`}

*//**

	@typedef {PreparedStatementParameter[]} PreparedStatementUnnamedParameters
	Unnamed parameters to replace SQL prepared statement placeholders.

	Related types:
	- {@link PreparedStatement `PreparedStatement`}
	- {@link PreparedStatementParameter `PreparedStatementParameter`}
	- {@link PreparedStatementParameters `PreparedStatementParameters`}
	- {@link PreparedStatementNamedParameters `PreparedStatementNamedParameters`}

	Related class:
	- {@link SQL `SQL`}

*//**

	@typedef {{ statement: PreparedStatement, params?: PreparedStatementParameters }} Query
	SQL query.

	Related types:
	- {@link PreparedStatement `PreparedStatement`}
	- {@link PreparedStatementParameters `PreparedStatementParameters`}

	Related class:
	- {@link SQL `SQL`}
*/
export {};

/**
	Makes SQL queries to the database.

	Dependency:
	- {@link mysql `mysql`}

	Related data file:
	- {@link database `/core/backend/data/database.json`}
*/
export default class SQL
{
	/** @type {mysql.Pool} */
	static #pool;

	static
	{
		try
		{
			SQL.#pool = mysql.createPool(
			{
				host: database.host,
				user: database.user,
				password: database.password,
				database: database.database,
				connectionLimit: 0x10,
			});

			SQL.#pool.config.connectionConfig.queryFormat = (statement, params) =>
			{
				if (!params)
					return statement;

				if (Array.isArray(params))
					return statement.replaceAll('?', substring => SQL.#pool.escape(params.shift()) ?? substring);

				return statement.replaceAll(/:([\p{L}\p{N}_-]+)/gu, (substring, param) =>
				{
					if (Object.hasOwn(params, param))
						return SQL.#pool.escape(params[param]);

					return substring;
				});
			};
		}
		catch (message)
		{
			console.error('Failed to create a database pool.', { message: message });
			process.exit(1);
		}
	}

	/**
		Makes a single {@link mysql `mysql`} query data with prepared statetement support.

		@param {PreparedStatement} statement
		SQL prepared statement (can contain placeholders).

		@param {PreparedStatementParameters} [params]
		Parameters to replace SQL prepared statement placeholders.

		Available placeholders:
		- Unnamed placeholders — Each subsequent `?` of {@link statement `statement`} will be replaced by following param of {@link params `params`} array.
		- Named placeholders — Each `:` prefixed param of {@link statement `statement`} will be replaced by proper param of {@link params `params`} object.

		@return {Promise<*?>}
		If query has succeeded:
		- a query result

		If query has failed:
		- `null`

		Related types:
		- {@link PreparedStatement `PreparedStatement`}
		- {@link PreparedStatementParameter `PreparedStatementParameter`}
		- {@link PreparedStatementParameters `PreparedStatementParameters`}
		- {@link PreparedStatementNamedParameters `PreparedStatementNamedParameters`}
		- {@link PreparedStatementUnnamedParameters `PreparedStatementUnnamedParameters`}

		Related functions:
		- {@link select `select`}
		- {@link insert `insert`}
		- {@link update `update`}
		- {@link delete `delete`}
		- {@link transaction `transaction`}

		@example
		await SQL.query('SELECT * FROM users');
		await SQL.query('SELECT * FROM users WHERE id = ?', [id]);
		await SQL.query('SELECT * FROM users WHERE id = :id', { id: id });
	*/
	static async query(statement, params)
	{
		try
		{
			const query = util.promisify(SQL.#pool.query).bind(SQL.#pool);
			return await query({ sql: statement, values: params });
		}
		catch (message)
		{
			console.error('SQL query failed.', { query: { statement: statement, params: params }, message: message });
			return null;
		}
	}

	/**
		Makes a single {@link mysql `mysql`} `SELECT` query data with prepared statetement support.

		@param {PreparedStatement} statement
		SQL prepared statement (can contain placeholders).

		@param {PreparedStatementParameters} [params]
		Parameters to replace SQL prepared statement placeholders.

		Available placeholders:
		- Unnamed placeholders — Each subsequent `?` of {@link statement `statement`} will be replaced by following param of {@link params `params`} array.
		- Named placeholders — Each `:` prefixed param of {@link statement `statement`} will be replaced by proper param of {@link params `params`} object.

		@return {Promise<Object.<string, PreparedStatementParameter>[] | false | null>}
		If query has succeeded, and positive number of rows returned:
		- `Array` — result rows

		If query has succeeded, but no rows returned:
		- `false`

		If query has failed:
		- `null`

		Related types:
		- {@link PreparedStatement `PreparedStatement`}
		- {@link PreparedStatementParameter `PreparedStatementParameter`}
		- {@link PreparedStatementParameters `PreparedStatementParameters`}
		- {@link PreparedStatementNamedParameters `PreparedStatementNamedParameters`}
		- {@link PreparedStatementUnnamedParameters `PreparedStatementUnnamedParameters`}

		Related functions:
		- {@link query `query`}
		- {@link insert `insert`}
		- {@link update `update`}
		- {@link delete `delete`}
	*/
	static async select(statement, params)
	{
		const result = await SQL.query(statement, params);

		if (!Array.isArray(result))
			return null;

		if (result.length)
			return result;

		return false;
	}

	/**
		Makes a single {@link mysql `mysql`} `INSERT` / `REPLACE` query data with prepared statetement support.

		@param {PreparedStatement} statement
		SQL prepared statement (can contain placeholders).

		@param {PreparedStatementParameters} [params]
		Parameters to replace SQL prepared statement placeholders.

		Available placeholders:
		- Unnamed placeholders — Each subsequent `?` of {@link statement `statement`} will be replaced by following param of {@link params `params`} array.
		- Named placeholders — Each `:` prefixed param of {@link statement `statement`} will be replaced by proper param of {@link params `params`} object.

		@return
		If query has succeeded: `object` with the following properties:
		- `inserted` — a number of inserted rows
		- `id` — an inserted row ID

		If query has failed:
		- `null`

		Related types:
		- {@link PreparedStatement `PreparedStatement`}
		- {@link PreparedStatementParameter `PreparedStatementParameter`}
		- {@link PreparedStatementParameters `PreparedStatementParameters`}
		- {@link PreparedStatementNamedParameters `PreparedStatementNamedParameters`}
		- {@link PreparedStatementUnnamedParameters `PreparedStatementUnnamedParameters`}

		Related functions:
		- {@link query `query`}
		- {@link select `select`}
		- {@link update `update`}
		- {@link delete `delete`}
	*/
	static async insert(statement, params)
	{
		const result = await SQL.query(statement, params);

		if (result?.constructor !== Object)
			return null;

		/** @type {number?} */
		const inserted = result.affectedRows;

		/** @type {number?} */
		const id = result.insertId;

		return { inserted: inserted, id: id };
	}

	/**
		Makes a single {@link mysql `mysql`} `UPDATE` query data with prepared statetement support.

		@param {PreparedStatement} statement
		SQL prepared statement (can contain placeholders).

		@param {PreparedStatementParameters} [params]
		Parameters to replace SQL prepared statement placeholders.

		Available placeholders:
		- Unnamed placeholders — Each subsequent `?` of {@link statement `statement`} will be replaced by following param of {@link params `params`} array.
		- Named placeholders — Each `:` prefixed param of {@link statement `statement`} will be replaced by proper param of {@link params `params`} object.

		@return
		If query has succeeded: `object` with the following properties:
		- `updated` — a number of updated rows (including not changed ones)
		- `changed` — a number of changed rows (excluding not changed ones)

		If query has failed:
		- `null`

		Related types:
		- {@link PreparedStatement `PreparedStatement`}
		- {@link PreparedStatementParameter `PreparedStatementParameter`}
		- {@link PreparedStatementParameters `PreparedStatementParameters`}
		- {@link PreparedStatementNamedParameters `PreparedStatementNamedParameters`}
		- {@link PreparedStatementUnnamedParameters `PreparedStatementUnnamedParameters`}

		Related functions:
		- {@link query `query`}
		- {@link select `select`}
		- {@link insert `insert`}
		- {@link delete `delete`}
	*/
	static async update(statement, params)
	{
		const result = await SQL.query(statement, params);

		if (result?.constructor !== Object)
			return null;

		/** @type {number?} */
		const updated = result.affectedRows;

		/** @type {number?} */
		const changed = result.changedRows;

		return { updated: updated, changed: changed };
	}

	/**
		Makes a single {@link mysql `mysql`} `DELETE` query data with prepared statetement support.

		@param {PreparedStatement} statement
		SQL prepared statement (can contain placeholders).

		@param {PreparedStatementParameters} [params]
		Parameters to replace SQL prepared statement placeholders.

		Available placeholders:
		- Unnamed placeholders — Each subsequent `?` of {@link statement `statement`} will be replaced by following param of {@link params `params`} array.
		- Named placeholders — Each `:` prefixed param of {@link statement `statement`} will be replaced by proper param of {@link params `params`} object.

		@return
		If query has succeeded: `object` with the following properties:
		- `deleted` — a number of deleted rows

		If query has failed:
		- `null`

		Related types:
		- {@link PreparedStatement `PreparedStatement`}
		- {@link PreparedStatementParameter `PreparedStatementParameter`}
		- {@link PreparedStatementParameters `PreparedStatementParameters`}
		- {@link PreparedStatementNamedParameters `PreparedStatementNamedParameters`}
		- {@link PreparedStatementUnnamedParameters `PreparedStatementUnnamedParameters`}

		Related functions:
		- {@link query `query`}
		- {@link select `select`}
		- {@link insert `insert`}
		- {@link update `update`}
	*/
	static async delete(statement, params)
	{
		const result = await SQL.query(statement, params);

		if (result?.constructor !== Object)
			return null;

		/** @type {number?} */
		const deleted = result.affectedRows;

		return { deleted: deleted };
	}

	/**
		Makes a multiple {@link mysql `mysql`} queries as a transaction.
		- Commit if all {@link queries `queries`} has succeeded.
		- Rollback if any query has failed.

		@param {Query[]} queries
		Array of SQL prepared statements (can contain placeholders).

		@returns {Promise<boolean>}
		- `true` if all {@link queries `queries`}, including a final commit, has succeeded.
		- `false` if any query has failed.

		Related types:
		- {@link PreparedStatement `PreparedStatement`}

		Related functions:
		- {@link query `query`}
	*/
	static async transaction(queries)
	{
		if (await SQL.query('START TRANSACTION') === null)
			return false;

		const success = await (async () =>
		{
			for (const query of queries)
				if (await SQL.query(query.statement, query.params) === null)
					return false;

			return true;
		})();

		if (!success)
		{
			await SQL.query('ROLLBACK');
			return false;
		}

		return await SQL.query('COMMIT');
	}
}