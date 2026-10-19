import { useLayoutEffect, useRef, useState } from 'react';
import { FOCUS_RING } from '../../../components/ui/focusRing';

interface AltTitlesProps {
	titles: string[];
}

/**
 * Read-only line of a manga's alternative titles, clamped to two lines with a
 * toggle that only shows when the text actually overflows.
 * @example <AltTitles titles={['Upando Sozinho', 'Na Honjaman Level Up']} />
 */
export function AltTitles({ titles }: AltTitlesProps) {
	const textRef = useRef<HTMLParagraphElement>(null);
	const [isExpanded, setIsExpanded] = useState(false);
	const [isOverflowing, setIsOverflowing] = useState(false);
	const text = titles.join(' · ');

	// Measured while clamped: once expanded, scrollHeight equals clientHeight.
	useLayoutEffect(() => {
		const el = textRef.current;
		if (!el || isExpanded) return;
		setIsOverflowing(el.scrollHeight > el.clientHeight);
	}, [text, isExpanded]);

	if (titles.length === 0) return null;
	return (
		<div data-testid='alt-titles' className='max-w-2xl'>
			<p ref={textRef} className={`text-xs text-text-muted ${isExpanded ? '' : 'line-clamp-2'}`}>
				{text}
			</p>
			{isOverflowing && (
				<button
					type='button'
					onClick={() => setIsExpanded((value) => !value)}
					className={`mt-0.5 rounded-sm text-xs text-text-muted underline-offset-2 hover:text-text hover:underline ${FOCUS_RING}`}
				>
					{isExpanded ? 'ver menos' : `ver todos (${titles.length})`}
				</button>
			)}
		</div>
	);
}
