/**
	Makes the function {@link f `f`} return `null` instead of `throw`ing.

	@template {*[]} ArgTypes
	@template {*} ReturnType

	@param {(...args: ArgTypes) => ReturnType} f
	The function to wrap.

	@param {*} object
	The object to call with the wrapped function {@link f `f`}.

	@example
	const data = noexcept(fs.readFileSync)(path);
*/
export default function noexcept(f, object = undefined)
{
	return (/** @type {ArgTypes} */ ...args) =>
	{
		try
		{
			if (object === undefined)
				return f(...args);

			return f.call(object, ...args);
		}
		catch
		{
			return null;
		}
	};
}