import path from 'node:path';

/**
	_Resolves a sequence of paths or path segments into an absolute path._
	@see https://nodejs.org/api/path.html#pathresolvepaths
*/
export function resolve
(
	/** @type {string} */ specifier,
	/** @type {object} */ context,
	/** @type {function} */ nextResolve
)
{
	if (specifier.startsWith('^'))
		specifier = `${path.dirname(import.meta.url)}/${specifier.substring(1)}`;
	else
	if
	(
			specifier.startsWith('/')
		&&	specifier.includes('.')
		&&	!specifier.includes(':')
	)
		specifier = `${path.dirname(import.meta.url)}/modules/${specifier}`;

	return nextResolve(specifier, context);
}