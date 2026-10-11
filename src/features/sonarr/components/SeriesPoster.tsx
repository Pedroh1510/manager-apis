import { seriesPosterUrl } from '../services/api';
import { PosterImage } from './PosterImage';

interface SeriesPosterProps {
	seriesId: number;
	title: string;
	/** Width (and any extra) classes; the card uses `w-full`, the detail a fixed `w-32`. */
	className: string;
}

/**
 * Sonarr's local poster through server/, or the title initials when it fails to load.
 * @example <SeriesPoster seriesId={1} title='The Wire' className='w-32' />
 */
export function SeriesPoster({ seriesId, title, className }: SeriesPosterProps) {
	return <PosterImage src={seriesPosterUrl(seriesId)} title={title} className={className} />;
}
