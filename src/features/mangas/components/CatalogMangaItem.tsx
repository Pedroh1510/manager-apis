import { useState } from 'react';
import { FOCUS_RING } from '../../../components/ui/focusRing';
import { catalogCoverUrl } from '../services/coverUrls';
import type { CatalogEntry } from '../lib/catalogLoader';
import { pluginLabel } from '../lib/pluginCatalog';
import { MangaCover } from './MangaCover';

const POPOVER_GAP_PX = 12;
const POPOVER_WIDTH = 180;
const POPOVER_HEIGHT = 255;

interface PopoverPosition {
	top: number;
	right: number;
}

// Fixed, so the scrolling list cannot clip it; opens to the left of the item
// because the wizard lives in a right-side drawer.
function popoverPositionFor(element: HTMLElement): PopoverPosition {
	const rect = element.getBoundingClientRect();
	const maxTop = window.innerHeight - POPOVER_HEIGHT - POPOVER_GAP_PX;
	return { top: Math.max(POPOVER_GAP_PX, Math.min(rect.top, maxTop)), right: window.innerWidth - rect.left + POPOVER_GAP_PX };
}

interface CatalogMangaItemProps {
	entry: CatalogEntry;
	showPluginBadge: boolean;
	onChoose: (entry: CatalogEntry) => void;
}

/**
 * Catalog row: thumbnail + title; pointer hover or keyboard focus shows the
 * large cover in a popover. The plugin badge tells apart the same title from
 * different plugins when searching all of them.
 * @example <CatalogMangaItem entry={{ plugin, manga }} showPluginBadge onChoose={pick} />
 */
export function CatalogMangaItem({ entry, showPluginBadge, onChoose }: CatalogMangaItemProps) {
	const { plugin, manga } = entry;
	const [popover, setPopover] = useState<PopoverPosition | null>(null);
	const coverUrl = catalogCoverUrl(plugin.id, manga.id);
	const open = (event: { currentTarget: HTMLElement }) => setPopover(popoverPositionFor(event.currentTarget));
	const close = () => setPopover(null);
	return (
		<li onMouseEnter={open} onMouseLeave={close}>
			<button
				onClick={() => onChoose(entry)}
				// Without it the title and badge spans read as one glued word.
				aria-label={showPluginBadge ? `${manga.title} (${pluginLabel(plugin)})` : undefined}
				onFocus={open}
				onBlur={close}
				className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-text transition-colors hover:bg-surface-raised ${FOCUS_RING}`}
			>
				<MangaCover src={coverUrl} title={manga.title} width={48} height={68} isDecorative />
				<span>{manga.title}</span>
				{showPluginBadge && (
					<span className='ml-auto shrink-0 rounded-sm bg-surface-raised px-1.5 py-0.5 font-mono text-xs text-text-muted'>
						{pluginLabel(plugin)}
					</span>
				)}
			</button>
			{popover && (
				<div
					role='tooltip'
					style={{ top: popover.top, right: popover.right }}
					className='pointer-events-none fixed z-[60] rounded-md border border-border bg-surface p-2 shadow-overlay'
				>
					<MangaCover src={coverUrl} title={manga.title} width={POPOVER_WIDTH} height={POPOVER_HEIGHT} />
				</div>
			)}
		</li>
	);
}
