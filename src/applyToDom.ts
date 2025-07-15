// applyToDom.ts

import type { Palette } from './types';

/**
 * DOMにCSSカスタムプロパティを設定
 */
export const applyColorPaletteToDom = (palette: Palette): void => {
	if (typeof document !== 'undefined') {
		Object.entries(palette).forEach(([key, value]) => {
			document.documentElement.style.setProperty(key, value);
		});
	}
};
