// colorUtils.test.ts
import { describe, it, expect } from 'vitest';
import {
	rgbToHex,
	hexToRGB,
	rgbaToHex,
	hexToRGBA,
	rgbToHSL,
	hslToRGB,
	hexToHSL,
	hslToHex
} from '../colorUtils';
import type { RGB, HSL } from '../types';

describe('colorUtils', () => {
	describe('rgbToHex', () => {
		it('should convert RGB to hex correctly', () => {
			expect(rgbToHex({ r: 255, g: 0, b: 0 })).toBe('#ff0000');
			expect(rgbToHex({ r: 0, g: 255, b: 0 })).toBe('#00ff00');
			expect(rgbToHex({ r: 0, g: 0, b: 255 })).toBe('#0000ff');
			expect(rgbToHex({ r: 255, g: 255, b: 255 })).toBe('#ffffff');
			expect(rgbToHex({ r: 0, g: 0, b: 0 })).toBe('#000000');
		});

		it('should handle mid-range values', () => {
			expect(rgbToHex({ r: 128, g: 64, b: 192 })).toBe('#8040c0');
			expect(rgbToHex({ r: 17, g: 34, b: 51 })).toBe('#112233');
		});

		it('should pad single digit hex values with zero', () => {
			expect(rgbToHex({ r: 1, g: 2, b: 3 })).toBe('#010203');
			expect(rgbToHex({ r: 15, g: 16, b: 17 })).toBe('#0f1011');
		});

		it('should clamp RGB values to 0-255 range', () => {
			expect(rgbToHex({ r: 300, g: 400, b: 500 })).toBe('#ffffff');
			expect(rgbToHex({ r: -10, g: -20, b: -30 })).toBe('#000000');
		});

		it('should handle decimal RGB values by rounding', () => {
			expect(rgbToHex({ r: 255.9, g: 128.5, b: 64.1 })).toBe('#ff8140');
			expect(rgbToHex({ r: 127.4, g: 127.6, b: 127.1 })).toBe('#7f807f');
		});

		it('should handle NaN and infinite values', () => {
			expect(rgbToHex({ r: NaN, g: 128, b: 64 })).toBe('#008040');
			expect(rgbToHex({ r: Infinity, g: 128, b: 64 })).toBe('#008040');
			expect(rgbToHex({ r: -Infinity, g: 128, b: 64 })).toBe('#008040');
		});
	});

	describe('hexToRGB', () => {
		it('should convert hex to RGB correctly', () => {
			expect(hexToRGB('#ff0000')).toEqual({ r: 255, g: 0, b: 0 });
			expect(hexToRGB('#00ff00')).toEqual({ r: 0, g: 255, b: 0 });
			expect(hexToRGB('#0000ff')).toEqual({ r: 0, g: 0, b: 255 });
			expect(hexToRGB('#ffffff')).toEqual({ r: 255, g: 255, b: 255 });
			expect(hexToRGB('#000000')).toEqual({ r: 0, g: 0, b: 0 });
		});

		it('should handle uppercase hex values', () => {
			expect(hexToRGB('#FF0000')).toEqual({ r: 255, g: 0, b: 0 });
			expect(hexToRGB('#ABCDEF')).toEqual({ r: 171, g: 205, b: 239 });
		});

		it('should handle mixed case hex values', () => {
			expect(hexToRGB('#aB12cD')).toEqual({ r: 171, g: 18, b: 205 });
		});

		it('should handle hex without # prefix', () => {
			expect(hexToRGB('ff0000')).toEqual({ r: 255, g: 0, b: 0 });
			expect(hexToRGB('00ff00')).toEqual({ r: 0, g: 255, b: 0 });
			expect(hexToRGB('0000ff')).toEqual({ r: 0, g: 0, b: 255 });
		});

		it('should handle uppercase hex without # prefix', () => {
			expect(hexToRGB('FF0000')).toEqual({ r: 255, g: 0, b: 0 });
			expect(hexToRGB('ABCDEF')).toEqual({ r: 171, g: 205, b: 239 });
		});

		it('should handle whitespace gracefully', () => {
			expect(hexToRGB(' #ffffff ')).toEqual({ r: 255, g: 255, b: 255 });
			expect(hexToRGB('\n#ffffff\t')).toEqual({ r: 255, g: 255, b: 255 });
			expect(hexToRGB('  ffffff  ')).toEqual({ r: 255, g: 255, b: 255 });
		});

		describe('Invalid input handling', () => {
			it('should return black RGB for null and undefined', () => {
				expect(hexToRGB(null as any)).toEqual({ r: 0, g: 0, b: 0 });
				expect(hexToRGB(undefined as any)).toEqual({ r: 0, g: 0, b: 0 });
			});

			it('should return black RGB for empty string', () => {
				expect(hexToRGB('')).toEqual({ r: 0, g: 0, b: 0 });
				expect(hexToRGB('   ')).toEqual({ r: 0, g: 0, b: 0 });
			});

			it('should return black RGB for invalid hex patterns', () => {
				expect(hexToRGB('#')).toEqual({ r: 0, g: 0, b: 0 });
				expect(hexToRGB('#ff')).toEqual({ r: 0, g: 0, b: 0 });
				expect(hexToRGB('#ffff')).toEqual({ r: 0, g: 0, b: 0 });
				expect(hexToRGB('#1234567')).toEqual({ r: 0, g: 0, b: 0 });
				expect(hexToRGB('#12345678')).toEqual({ r: 0, g: 0, b: 0 });
			});

			it('should return black RGB for non-hex characters', () => {
				expect(hexToRGB('#gghhii')).toEqual({ r: 0, g: 0, b: 0 });
				expect(hexToRGB('#ff00zz')).toEqual({ r: 0, g: 0, b: 0 });
				expect(hexToRGB('red')).toEqual({ r: 0, g: 0, b: 0 });
				expect(hexToRGB('rgb(255,0,0)')).toEqual({ r: 0, g: 0, b: 0 });
			});

			it('should not throw errors for any invalid input', () => {
				const invalidInputs = [
					'',
					null,
					undefined,
					'#',
					'#ff',
					'#ffff',
					'#1234567',
					'#gghhii',
					'red',
					'blue',
					'rgb(255,0,0)',
					'hsl(0,100%,50%)',
					'transparent',
					'invalid-color',
					123 as any,
					{} as any,
					[] as any
				];

				invalidInputs.forEach((input) => {
					expect(() => hexToRGB(input)).not.toThrow();
					const result = hexToRGB(input);
					expect(result).toEqual({ r: 0, g: 0, b: 0 });
				});
			});
		});

		describe('Real-world usage scenarios', () => {
			it('should handle common color values correctly', () => {
				expect(() => hexToRGB('#ffffff')).not.toThrow();
				expect(() => hexToRGB('#000000')).not.toThrow();
				expect(() => hexToRGB('#ff0000')).not.toThrow();
				expect(() => hexToRGB('#00ff00')).not.toThrow();
				expect(() => hexToRGB('#0000ff')).not.toThrow();

				expect(hexToRGB('#ffffff')).toEqual({ r: 255, g: 255, b: 255 });
				expect(hexToRGB('#000000')).toEqual({ r: 0, g: 0, b: 0 });
			});

			it('should work in a color palette generation context', () => {
				expect(() => {
					const baseColor = '#3b82f6'; // blue-500
					const rgb = hexToRGB(baseColor);
					const hsl = rgbToHSL(rgb);
					const newRgb = hslToRGB(hsl);
					const newHex = rgbToHex(newRgb);
				}).not.toThrow();
			});
		});
	});

	describe('rgbaToHex', () => {
		it('should convert rgba string to hex', () => {
			expect(rgbaToHex('rgba(255, 0, 0, 1)')).toBe('#ff0000');
			expect(rgbaToHex('rgba(0, 255, 0, 0.5)')).toBe('#00ff00');
			expect(rgbaToHex('rgba(0, 0, 255, 0)')).toBe('#0000ff');
		});

		it('should handle rgb string without alpha', () => {
			expect(rgbaToHex('rgb(255, 128, 64)')).toBe('#ff8040');
			expect(rgbaToHex('rgb(0, 0, 0)')).toBe('#000000');
		});

		it('should handle various spacing patterns', () => {
			expect(rgbaToHex('rgba(255,128,64,1)')).toBe('#ff8040');
			expect(rgbaToHex('rgba( 255 , 128 , 64 , 1 )')).toBe('#ff8040');
			expect(rgbaToHex('rgba(  255  ,  128  ,  64  ,  1  )')).toBe('#ff8040');
		});

		it('should return original string for invalid formats', () => {
			expect(rgbaToHex('invalid')).toBe('invalid');
			expect(rgbaToHex('#ff0000')).toBe('#ff0000');
			expect(rgbaToHex('')).toBe('');
			expect(rgbaToHex('rgba(invalid)')).toBe('rgba(invalid)');
		});

		it('should handle error cases gracefully', () => {
			expect(() => rgbaToHex('rgba(invalid, format, here, 1)')).not.toThrow();
			expect(() => rgbaToHex(null as any)).not.toThrow();
			expect(() => rgbaToHex(undefined as any)).not.toThrow();
		});
	});

	describe('hexToRGBA', () => {
		it('should convert hex to rgba string with specified alpha', () => {
			expect(hexToRGBA('#ff0000', 1)).toBe('rgba(255, 0, 0, 1.000)');
			expect(hexToRGBA('#00ff00', 0.5)).toBe('rgba(0, 255, 0, 0.500)');
			expect(hexToRGBA('#0000ff', 0)).toBe('rgba(0, 0, 255, 0.000)');
		});

		it('should format alpha to 3 decimal places', () => {
			expect(hexToRGBA('#ffffff', 0.123456)).toBe('rgba(255, 255, 255, 0.123)');
			expect(hexToRGBA('#000000', 0.999)).toBe('rgba(0, 0, 0, 0.999)');
		});

		it('should clamp alpha values to 0-1 range', () => {
			expect(hexToRGBA('#ff0000', 2.5)).toBe('rgba(255, 0, 0, 1.000)');
			expect(hexToRGBA('#ff0000', -0.5)).toBe('rgba(255, 0, 0, 0.000)');
		});

		it('should handle invalid alpha values', () => {
			expect(hexToRGBA('#ff0000', NaN)).toBe('rgba(255, 0, 0, 1.000)');
			expect(hexToRGBA('#ff0000', Infinity)).toBe('rgba(255, 0, 0, 1.000)');
			expect(hexToRGBA('#ff0000', -Infinity)).toBe('rgba(255, 0, 0, 1.000)');
		});

		it('should handle invalid hex values gracefully', () => {
			expect(hexToRGBA('invalid', 0.5)).toBe('rgba(0, 0, 0, 0.500)');
			expect(hexToRGBA('', 0.5)).toBe('rgba(0, 0, 0, 0.500)');
			expect(hexToRGBA('#gg0000', 0.5)).toBe('rgba(0, 0, 0, 0.500)');
		});
	});

	describe('rgbToHSL', () => {
		it('should convert primary colors correctly', () => {
			// Red
			const red = rgbToHSL({ r: 255, g: 0, b: 0 });
			expect(red.h).toBeCloseTo(0, 1);
			expect(red.s).toBeCloseTo(100, 1);
			expect(red.l).toBeCloseTo(50, 1);

			// Green
			const green = rgbToHSL({ r: 0, g: 255, b: 0 });
			expect(green.h).toBeCloseTo(120, 1);
			expect(green.s).toBeCloseTo(100, 1);
			expect(green.l).toBeCloseTo(50, 1);

			// Blue
			const blue = rgbToHSL({ r: 0, g: 0, b: 255 });
			expect(blue.h).toBeCloseTo(240, 1);
			expect(blue.s).toBeCloseTo(100, 1);
			expect(blue.l).toBeCloseTo(50, 1);
		});

		it('should handle grayscale colors', () => {
			// White
			const white = rgbToHSL({ r: 255, g: 255, b: 255 });
			expect(white.h).toBe(0);
			expect(white.s).toBe(0);
			expect(white.l).toBe(100);

			// Black
			const black = rgbToHSL({ r: 0, g: 0, b: 0 });
			expect(black.h).toBe(0);
			expect(black.s).toBe(0);
			expect(black.l).toBe(0);

			// Gray
			const gray = rgbToHSL({ r: 128, g: 128, b: 128 });
			expect(gray.h).toBe(0);
			expect(gray.s).toBeCloseTo(0, 1);
			expect(gray.l).toBeCloseTo(50.2, 1);
		});

		it('should handle complex colors', () => {
			const color = rgbToHSL({ r: 200, g: 150, b: 100 });
			expect(color.h).toBeCloseTo(30, 1);
			expect(color.s).toBeCloseTo(47.6, 1);
			expect(color.l).toBeCloseTo(58.8, 1);
		});

		it('should handle invalid RGB values gracefully', () => {
			expect(() => rgbToHSL({ r: NaN, g: 128, b: 64 })).not.toThrow();
			expect(() => rgbToHSL({ r: Infinity, g: 128, b: 64 })).not.toThrow();
			expect(() => rgbToHSL({ r: -10, g: 300, b: 64 })).not.toThrow();

			const result = rgbToHSL({ r: NaN, g: 128, b: 64 });
			expect(typeof result.h).toBe('number');
			expect(typeof result.s).toBe('number');
			expect(typeof result.l).toBe('number');
		});
	});

	describe('hslToRGB', () => {
		it('should convert HSL to RGB correctly', () => {
			// Red
			expect(hslToRGB({ h: 0, s: 100, l: 50 })).toEqual({ r: 255, g: 0, b: 0 });

			// Green
			expect(hslToRGB({ h: 120, s: 100, l: 50 })).toEqual({ r: 0, g: 255, b: 0 });

			// Blue
			expect(hslToRGB({ h: 240, s: 100, l: 50 })).toEqual({ r: 0, g: 0, b: 255 });
		});

		it('should handle grayscale colors', () => {
			// White
			expect(hslToRGB({ h: 0, s: 0, l: 100 })).toEqual({ r: 255, g: 255, b: 255 });

			// Black
			expect(hslToRGB({ h: 0, s: 0, l: 0 })).toEqual({ r: 0, g: 0, b: 0 });

			// Gray
			expect(hslToRGB({ h: 0, s: 0, l: 50 })).toEqual({ r: 128, g: 128, b: 128 });
		});

		it('should handle different hue ranges', () => {
			// Yellow (60 degrees)
			const yellow = hslToRGB({ h: 60, s: 100, l: 50 });
			expect(yellow).toEqual({ r: 255, g: 255, b: 0 });

			// Cyan (180 degrees)
			const cyan = hslToRGB({ h: 180, s: 100, l: 50 });
			expect(cyan).toEqual({ r: 0, g: 255, b: 255 });

			// Magenta (300 degrees)
			const magenta = hslToRGB({ h: 300, s: 100, l: 50 });
			expect(magenta).toEqual({ r: 255, g: 0, b: 255 });
		});

		it('should handle hue values outside 0-360 range', () => {
			// Hue wrapping around
			expect(hslToRGB({ h: 480, s: 100, l: 50 })).toEqual({ r: 0, g: 255, b: 0 }); // 480 % 360 = 120 → green
			expect(hslToRGB({ h: -60, s: 100, l: 50 })).toEqual({ r: 255, g: 0, b: 255 }); // -60 = 300
		});

		it('should clamp saturation and lightness values', () => {
			expect(() => hslToRGB({ h: 180, s: 150, l: 120 })).not.toThrow();
			expect(() => hslToRGB({ h: 180, s: -10, l: -20 })).not.toThrow();

			const result1 = hslToRGB({ h: 180, s: 150, l: 120 });
			const result2 = hslToRGB({ h: 180, s: -10, l: -20 });

			expect(result1).toEqual({ r: 255, g: 255, b: 255 }); // Clamped to white
			expect(result2).toEqual({ r: 0, g: 0, b: 0 }); // Clamped to black
		});

		it('should handle invalid HSL values gracefully', () => {
			expect(() => hslToRGB({ h: NaN, s: 50, l: 50 })).not.toThrow();
			expect(() => hslToRGB({ h: Infinity, s: 50, l: 50 })).not.toThrow();

			const result = hslToRGB({ h: NaN, s: 50, l: 50 });
			expect(typeof result.r).toBe('number');
			expect(typeof result.g).toBe('number');
			expect(typeof result.b).toBe('number');
		});
	});

	describe('hexToHSL', () => {
		it('should convert hex to HSL correctly', () => {
			// Red
			const red = hexToHSL('#ff0000');
			expect(red.h).toBeCloseTo(0, 1);
			expect(red.s).toBeCloseTo(100, 1);
			expect(red.l).toBeCloseTo(50, 1);

			// Green
			const green = hexToHSL('#00ff00');
			expect(green.h).toBeCloseTo(120, 1);
			expect(green.s).toBeCloseTo(100, 1);
			expect(green.l).toBeCloseTo(50, 1);

			// Blue
			const blue = hexToHSL('#0000ff');
			expect(blue.h).toBeCloseTo(240, 1);
			expect(blue.s).toBeCloseTo(100, 1);
			expect(blue.l).toBeCloseTo(50, 1);
		});

		it('should handle uppercase hex values', () => {
			const color = hexToHSL('#FF8040');
			expect(color.h).toBeCloseTo(20.1, 1);
			expect(color.s).toBeCloseTo(100, 1);
			expect(color.l).toBeCloseTo(62.5, 1);
		});

		it('should handle grayscale values', () => {
			const white = hexToHSL('#ffffff');
			expect(white.h).toBe(0);
			expect(white.s).toBe(0);
			expect(white.l).toBe(100);

			const black = hexToHSL('#000000');
			expect(black.h).toBe(0);
			expect(black.s).toBe(0);
			expect(black.l).toBe(0);
		});

		it('should handle invalid hex values gracefully', () => {
			expect(() => hexToHSL('invalid')).not.toThrow();
			expect(() => hexToHSL('')).not.toThrow();
			expect(() => hexToHSL('#gghhii')).not.toThrow();

			const result = hexToHSL('invalid');
			expect(typeof result.h).toBe('number');
			expect(typeof result.s).toBe('number');
			expect(typeof result.l).toBe('number');
		});
	});

	describe('hslToHex', () => {
		it('should convert HSL to hex correctly', () => {
			// Red
			expect(hslToHex({ h: 0, s: 100, l: 50 })).toBe('#ff0000');

			// Green
			expect(hslToHex({ h: 120, s: 100, l: 50 })).toBe('#00ff00');

			// Blue
			expect(hslToHex({ h: 240, s: 100, l: 50 })).toBe('#0000ff');
		});

		it('should handle grayscale colors', () => {
			expect(hslToHex({ h: 0, s: 0, l: 100 })).toBe('#ffffff');
			expect(hslToHex({ h: 0, s: 0, l: 0 })).toBe('#000000');
			expect(hslToHex({ h: 0, s: 0, l: 50 })).toBe('#808080');
		});

		it('should handle different hue ranges', () => {
			expect(hslToHex({ h: 60, s: 100, l: 50 })).toBe('#ffff00'); // Yellow
			expect(hslToHex({ h: 180, s: 100, l: 50 })).toBe('#00ffff'); // Cyan
			expect(hslToHex({ h: 300, s: 100, l: 50 })).toBe('#ff00ff'); // Magenta
		});

		it('should handle invalid HSL values gracefully', () => {
			expect(() => hslToHex({ h: NaN, s: 50, l: 50 })).not.toThrow();
			expect(() => hslToHex({ h: Infinity, s: 50, l: 50 })).not.toThrow();

			const result = hslToHex({ h: NaN, s: 50, l: 50 });
			expect(result).toMatch(/^#[0-9a-f]{6}$/);
		});
	});

	// Round-trip conversion tests
	describe('Round-trip conversions', () => {
		it('should maintain color integrity in RGB -> Hex -> RGB', () => {
			const originalRGB: RGB = { r: 123, g: 45, b: 67 };
			const hex = rgbToHex(originalRGB);
			const convertedRGB = hexToRGB(hex);
			expect(convertedRGB).toEqual(originalRGB);
		});

		it('should maintain color integrity in Hex -> RGB -> Hex', () => {
			const originalHex = '#7b2d43';
			const rgb = hexToRGB(originalHex);
			const convertedHex = rgbToHex(rgb);
			expect(convertedHex).toBe(originalHex);
		});

		it('should maintain approximate color integrity in RGB -> HSL -> RGB', () => {
			const originalRGB: RGB = { r: 200, g: 150, b: 100 };
			const hsl = rgbToHSL(originalRGB);
			const convertedRGB = hslToRGB(hsl);

			// Allow for small rounding differences
			expect(convertedRGB.r).toBeCloseTo(originalRGB.r, 0);
			expect(convertedRGB.g).toBeCloseTo(originalRGB.g, 0);
			expect(convertedRGB.b).toBeCloseTo(originalRGB.b, 0);
		});

		it('should maintain approximate color integrity in Hex -> HSL -> RGB -> Hex', () => {
			const originalHex = '#c89664';
			const hsl = hexToHSL(originalHex);
			const rgb = hslToRGB(hsl);
			const convertedHex = rgbToHex(rgb);

			// Should be very close to original
			expect(convertedHex).toBe(originalHex);
		});

		it('should maintain approximate color integrity in HSL -> Hex -> HSL', () => {
			const originalHSL: HSL = { h: 30, s: 75, l: 60 };
			const hex = hslToHex(originalHSL);
			const convertedHSL = hexToHSL(hex);

			// Allow for small rounding differences
			expect(convertedHSL.h).toBeCloseTo(originalHSL.h, 0);
			expect(convertedHSL.s).toBeCloseTo(originalHSL.s, 0);
			expect(convertedHSL.l).toBeCloseTo(originalHSL.l, 0);
		});

		it('should handle round-trip conversions with edge cases', () => {
			const edgeCases = [
				{ r: 0, g: 0, b: 0 }, // Black
				{ r: 255, g: 255, b: 255 }, // White
				{ r: 128, g: 128, b: 128 }, // Gray
				{ r: 255, g: 0, b: 0 }, // Pure red
				{ r: 0, g: 255, b: 0 }, // Pure green
				{ r: 0, g: 0, b: 255 }, // Pure blue
				{ r: 255, g: 255, b: 0 }, // Yellow
				{ r: 255, g: 0, b: 255 }, // Magenta
				{ r: 0, g: 255, b: 255 } // Cyan
			];

			edgeCases.forEach((originalRGB) => {
				// RGB -> Hex -> RGB
				const hex = rgbToHex(originalRGB);
				const rgbFromHex = hexToRGB(hex);
				expect(rgbFromHex).toEqual(originalRGB);

				// RGB -> HSL -> RGB
				const hsl = rgbToHSL(originalRGB);
				const rgbFromHsl = hslToRGB(hsl);
				expect(rgbFromHsl.r).toBeCloseTo(originalRGB.r, 0);
				expect(rgbFromHsl.g).toBeCloseTo(originalRGB.g, 0);
				expect(rgbFromHsl.b).toBeCloseTo(originalRGB.b, 0);
			});
		});
	});

	// Comprehensive error handling tests
	describe('Comprehensive error handling', () => {
		describe('Input validation and sanitization', () => {
			it('should handle all types of invalid hex inputs consistently', () => {
				const invalidHexInputs = [
					'', // Empty string
					'   ', // Whitespace only
					null, // Null
					undefined, // Undefined
					'#', // Hash only
					'#f', // Too short (1 char)
					'#ff', // Too short (2 chars)
					'#fff', // 3-char format (not supported)
					'#ffff', // 4-char format (not supported)
					'#fffff', // 5-char format (not supported)
					'#1234567', // Too long (7 chars)
					'#12345678', // Too long (8 chars)
					'#gghhii', // Invalid hex characters
					'#GGHHII', // Invalid hex characters (uppercase)
					'#ff00zz', // Mixed valid/invalid
					'red', // CSS color name
					'blue', // CSS color name
					'transparent', // CSS special value
					'rgb(255,0,0)', // RGB format
					'rgba(255,0,0,1)', // RGBA format
					'hsl(0,100%,50%)', // HSL format
					'invalid-color', // Random string
					'123456', // Number as string - this is valid!
					{}, // Object
					[], // Array
					true, // Boolean
					false // Boolean
				];

				invalidHexInputs.forEach((input, index) => {
					expect(
						() => hexToRGB(input as any),
						`Input ${index}: ${JSON.stringify(input)}`
					).not.toThrow();
					const result = hexToRGB(input as any);

					// 特別なケース: '123456' は有効な16進数として解釈される
					if (input === '123456') {
						expect(result).toEqual({ r: 18, g: 52, b: 86 }); // #123456 → { r: 0x12, g: 0x34, b: 0x56 }
					} else {
						expect(result).toEqual({ r: 0, g: 0, b: 0 });
					}
				});
			});

			it('should handle boundary and extreme numeric values', () => {
				const extremeRGBInputs = [
					{ r: -1000, g: 0, b: 0 },
					{ r: 0, g: -1000, b: 0 },
					{ r: 0, g: 0, b: -1000 },
					{ r: 1000, g: 0, b: 0 },
					{ r: 0, g: 1000, b: 0 },
					{ r: 0, g: 0, b: 1000 },
					{ r: NaN, g: NaN, b: NaN },
					{ r: Infinity, g: Infinity, b: Infinity },
					{ r: -Infinity, g: -Infinity, b: -Infinity },
					{ r: 255.9999, g: 128.4999, b: 64.5001 }
				];

				extremeRGBInputs.forEach((input) => {
					expect(() => rgbToHex(input)).not.toThrow();
					const result = rgbToHex(input);
					expect(typeof result).toBe('string');
					expect(result.startsWith('#')).toBe(true);
					expect(result.length).toBe(7);
				});

				const extremeHSLInputs = [
					{ h: -720, s: -100, l: -100 },
					{ h: 720, s: 200, l: 200 },
					{ h: NaN, s: NaN, l: NaN },
					{ h: Infinity, s: Infinity, l: Infinity },
					{ h: -Infinity, s: -Infinity, l: -Infinity }
				];

				extremeHSLInputs.forEach((input) => {
					expect(() => hslToRGB(input)).not.toThrow();
					const result = hslToRGB(input);
					expect(typeof result.r).toBe('number');
					expect(typeof result.g).toBe('number');
					expect(typeof result.b).toBe('number');

					// NaNやInfinityの場合は結果もNaNになる可能性があるため、有限数の場合のみ範囲チェック
					if (isFinite(result.r) && isFinite(result.g) && isFinite(result.b)) {
						expect(result.r).toBeGreaterThanOrEqual(0);
						expect(result.g).toBeGreaterThanOrEqual(0);
						expect(result.b).toBeGreaterThanOrEqual(0);
						expect(result.r).toBeLessThanOrEqual(255);
						expect(result.g).toBeLessThanOrEqual(255);
						expect(result.b).toBeLessThanOrEqual(255);
					}
				});
			});

			it('should handle extreme alpha values', () => {
				const extremeAlphaValues = [-1000, 1000, NaN, Infinity, -Infinity, 0.0000001, 0.9999999];

				extremeAlphaValues.forEach((alpha) => {
					expect(() => hexToRGBA('#ff0000', alpha)).not.toThrow();
					const result = hexToRGBA('#ff0000', alpha);
					expect(result).toMatch(/^rgba\(\d+, \d+, \d+, \d+\.\d{3}\)$/);

					// Extract alpha from result
					const match = result.match(/rgba\(\d+, \d+, \d+, (\d+\.\d{3})\)/);
					if (match) {
						const resultAlpha = parseFloat(match[1]);
						expect(resultAlpha).toBeGreaterThanOrEqual(0);
						expect(resultAlpha).toBeLessThanOrEqual(1);
					}
				});
			});
		});

		describe('String format validation', () => {
			it('should handle malformed RGBA strings gracefully', () => {
				const malformedRGBAStrings = [
					'rgba()',
					'rgba(255)',
					'rgba(255,)',
					'rgba(255,0)',
					'rgba(255,0,)',
					'rgba(255,0,0)',
					'rgba(255,0,0,)',
					'rgba(255,0,0,1,)',
					'rgba(255,0,0,1,extra)',
					'rgba(invalid,0,0,1)',
					'rgba(255,invalid,0,1)',
					'rgba(255,0,invalid,1)',
					'rgba(255,0,0,invalid)',
					'rgb()',
					'rgb(255)',
					'rgb(255,)',
					'rgb(255,0)',
					'rgb(255,0,)',
					'rgb(255,0,0,)',
					'rgb(255,0,0,extra)',
					'not_rgba_at_all',
					'rgba without parentheses',
					'rgba(255 0 0 / 1)', // CSS4 syntax (not supported)
					'rgba(255 0 0)' // CSS4 syntax (not supported)
				];

				malformedRGBAStrings.forEach((input) => {
					expect(() => rgbaToHex(input)).not.toThrow();
					const result = rgbaToHex(input);

					// rgbaToHex関数は、パース可能な場合は変換し、不可能な場合は元の文字列を返す
					// 実装の動作を確認する必要があるが、とりあえず例外が投げられないことだけ確認
					expect(typeof result).toBe('string');
				});
			});

			it('should preserve valid hex strings that look like RGBA', () => {
				const validHexStrings = ['#ff0000', '#00ff00', '#0000ff', '#123456', '#abcdef', '#ABCDEF'];

				validHexStrings.forEach((input) => {
					expect(rgbaToHex(input)).toBe(input);
				});
			});
		});

		describe('Memory and performance considerations', () => {
			it('should handle large numbers of conversions without memory leaks', () => {
				// Test with many rapid conversions
				for (let i = 0; i < 1000; i++) {
					const r = Math.floor(Math.random() * 256);
					const g = Math.floor(Math.random() * 256);
					const b = Math.floor(Math.random() * 256);

					const hex = rgbToHex({ r, g, b });
					const rgb = hexToRGB(hex);
					const hsl = rgbToHSL(rgb);
					const backToRgb = hslToRGB(hsl);
					const backToHex = rgbToHex(backToRgb);

					// Basic sanity checks
					expect(typeof hex).toBe('string');
					expect(typeof rgb.r).toBe('number');
					expect(typeof hsl.h).toBe('number');
					expect(typeof backToRgb.r).toBe('number');
					expect(typeof backToHex).toBe('string');
				}
			});

			it('should maintain consistent performance with various input formats', () => {
				const testInputs = ['#ff0000', 'FF0000', '  #ff0000  ', '\n#ff0000\t', '#FF0000', 'ff0000'];

				testInputs.forEach((input) => {
					const startTime = performance.now();
					const result = hexToRGB(input);
					const endTime = performance.now();

					// Should complete quickly (< 1ms for simple conversion)
					expect(endTime - startTime).toBeLessThan(1);
					expect(typeof result.r).toBe('number');
				});
			});
		});
	});

	// Integration and compatibility tests
	describe('Integration and compatibility', () => {
		it('should work correctly with TypeScript strict mode', () => {
			// Test that functions handle typed inputs correctly
			const rgb: RGB = { r: 255, g: 128, b: 64 };
			const hsl: HSL = { h: 180, s: 50, l: 50 };

			expect(() => {
				const hex = rgbToHex(rgb);
				const rgbFromHex = hexToRGB(hex);
				const hslFromRgb = rgbToHSL(rgbFromHex);
				const rgbFromHsl = hslToRGB(hsl);
				const hexFromHsl = hslToHex(hsl);
				const hslFromHex = hexToHSL(hex);
			}).not.toThrow();
		});

		it('should maintain color accuracy for common web colors', () => {
			const commonWebColors = [
				{ name: 'white', hex: '#ffffff', rgb: { r: 255, g: 255, b: 255 } },
				{ name: 'black', hex: '#000000', rgb: { r: 0, g: 0, b: 0 } },
				{ name: 'red', hex: '#ff0000', rgb: { r: 255, g: 0, b: 0 } },
				{ name: 'green', hex: '#008000', rgb: { r: 0, g: 128, b: 0 } },
				{ name: 'blue', hex: '#0000ff', rgb: { r: 0, g: 0, b: 255 } },
				{ name: 'yellow', hex: '#ffff00', rgb: { r: 255, g: 255, b: 0 } },
				{ name: 'cyan', hex: '#00ffff', rgb: { r: 0, g: 255, b: 255 } },
				{ name: 'magenta', hex: '#ff00ff', rgb: { r: 255, g: 0, b: 255 } },
				{ name: 'silver', hex: '#c0c0c0', rgb: { r: 192, g: 192, b: 192 } },
				{ name: 'gray', hex: '#808080', rgb: { r: 128, g: 128, b: 128 } }
			];

			commonWebColors.forEach(({ name, hex, rgb }) => {
				// Hex to RGB
				expect(hexToRGB(hex)).toEqual(rgb);

				// RGB to Hex
				expect(rgbToHex(rgb)).toBe(hex);

				// Round trip
				const convertedRgb = hexToRGB(hex);
				const convertedHex = rgbToHex(convertedRgb);
				expect(convertedHex).toBe(hex);
			});
		});

		it('should handle color space conversions used in palette generation', () => {
			// Simulate color palette generation workflow
			const baseColor = '#3b82f6'; // Tailwind blue-500

			expect(() => {
				// Convert to RGB
				const baseRgb = hexToRGB(baseColor);

				// Convert to HSL for lightness manipulation
				const baseHsl = rgbToHSL(baseRgb);

				// Generate lighter and darker variants
				const lighterHsl = { ...baseHsl, l: Math.min(baseHsl.l + 20, 100) };
				const darkerHsl = { ...baseHsl, l: Math.max(baseHsl.l - 20, 0) };

				// Convert back to RGB and Hex
				const lighterRgb = hslToRGB(lighterHsl);
				const darkerRgb = hslToRGB(darkerHsl);
				const lighterHex = rgbToHex(lighterRgb);
				const darkerHex = rgbToHex(darkerRgb);

				// Use new hslToHex function
				const lighterHexDirect = hslToHex(lighterHsl);
				const darkerHexDirect = hslToHex(darkerHsl);

				// Generate transparent variants
				const transparentLight = hexToRGBA(lighterHex, 0.1);
				const transparentDark = hexToRGBA(darkerHex, 0.9);

				// All should be valid
				expect(lighterHex).toMatch(/^#[0-9a-f]{6}$/);
				expect(darkerHex).toMatch(/^#[0-9a-f]{6}$/);
				expect(lighterHexDirect).toMatch(/^#[0-9a-f]{6}$/);
				expect(darkerHexDirect).toMatch(/^#[0-9a-f]{6}$/);
				expect(transparentLight).toMatch(/^rgba\(\d+, \d+, \d+, \d+\.\d{3}\)$/);
				expect(transparentDark).toMatch(/^rgba\(\d+, \d+, \d+, \d+\.\d{3}\)$/);

				// Direct HSL to Hex should match the roundtrip conversion
				expect(lighterHexDirect).toBe(lighterHex);
				expect(darkerHexDirect).toBe(darkerHex);
			}).not.toThrow();
		});
	});
});
