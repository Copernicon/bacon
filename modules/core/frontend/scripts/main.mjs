import Navigation from '/core/frontend/scripts/interfaces/Navigation.mjs';
import Menu from '/core/frontend/scripts/feats/Menu.mjs';
import Session from '/core/frontend/scripts/feats/Session.mjs';

export default class Common
{
	static
	{
		if (document.readyState == 'loading')
			addEventListener('DOMContentLoaded', Common.#ready);
		else
			Common.#ready();
	}

	static #ready()
	{
		if (document.body.offsetWidth >= 720)
			Menu.show.run();

		Session.validate.post(() => void Navigation.goto.run({ path: location.pathname.substring(1) + location.search || 'core/main' }));
		Session.validate.run();
	}
}