import Navigation from '/core/frontend/scripts/interfaces/Navigation.mjs';

export default class LoadPageOnURLChange
{
	static
	{
		window.addEventListener('popstate', () => void Navigation.goto.run({ path: location.pathname.substring(1) + location.search || 'core/main' }));
	}
}