import { browser } from '$app/environment';

type Theme = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'theme';

function getSystemPreference(): 'light' | 'dark' {
	if (!browser) return 'dark';
	return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(resolved: 'light' | 'dark') {
	if (!browser) return;
	document.documentElement.classList.toggle('dark', resolved === 'dark');
	const meta = document.querySelector('meta[name="theme-color"]');
	if (meta) {
		meta.setAttribute('content', resolved === 'dark' ? '#0a0a0a' : '#ffffff');
	}
}

let currentPreference: Theme = 'system';

function init(): Theme {
	if (!browser) return 'system';
	const stored = localStorage.getItem(STORAGE_KEY);
	if (stored === 'light' || stored === 'dark' || stored === 'system') {
		currentPreference = stored;
	} else {
		currentPreference = 'system';
	}
	const resolved = currentPreference === 'system' ? getSystemPreference() : currentPreference;
	applyTheme(resolved);
	return currentPreference;
}

function setTheme(pref: Theme) {
	currentPreference = pref;
	if (browser) {
		localStorage.setItem(STORAGE_KEY, pref);
	}
	const resolved = pref === 'system' ? getSystemPreference() : pref;
	applyTheme(resolved);
	theme.set(pref);
}

export const theme = $state(init());

export function setThemePref(pref: Theme) {
	setTheme(pref);
}

export function getResolvedTheme(): 'light' | 'dark' {
	return theme === 'system' ? getSystemPreference() : theme;
}

if (browser) {
	window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
		if (theme === 'system') {
			applyTheme(getSystemPreference());
		}
	});
}
