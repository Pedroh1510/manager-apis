/**
 * Scaffold verification test.
 * Verifies that the test environment (jsdom + jest-dom) is correctly configured.
 */

test('jest-dom matchers are available in test environment', () => {
	const div = document.createElement('div');
	div.textContent = 'Hello';
	document.body.appendChild(div);

	expect(div).toBeInTheDocument();

	document.body.removeChild(div);
});
