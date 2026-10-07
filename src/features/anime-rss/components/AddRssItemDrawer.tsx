import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../../../components/ui/Button';
import { Drawer } from '../../../components/ui/Drawer';
import { Input } from '../../../components/ui/Input';
import { useToast } from '../../../components/ui/useToast';
import { getApiErrorMessage, getApiErrorStatus } from '../../../lib/apiError';
import { useManualTitleFields } from '../hooks/useManualTitleFields';
import { createRssItem } from '../services/api';
import { exceedsTitleLimit } from '../lib/manualRssTitle';
import { ManualTitleFields } from './ManualTitleFields';

// Same rule the API applies: 40 hex or 32 base32 chars of infohash.
const MAGNET_PATTERN = /^magnet:\?xt=urn:btih:([a-fA-F0-9]{40}|[a-zA-Z2-7]{32})/;
const MAGNET_HINT = 'Informe um magnet link (magnet:?xt=urn:btih:…)';
const labelCls = 'mb-1 block text-xs font-medium text-text-muted';

interface AddRssItemDrawerProps {
	open: boolean;
	onClose: () => void;
}

/**
 * Structured title + magnet form that puts a manual item in the RSS feed.
 * Stays open after each add so episodes can be queued one after another.
 * @example <AddRssItemDrawer open={isAdding} onClose={() => setIsAdding(false)} />
 */
export function AddRssItemDrawer({ open, onClose }: AddRssItemDrawerProps) {
	const queryClient = useQueryClient();
	const toast = useToast();
	const fields = useManualTitleFields();
	const [magnet, setMagnet] = useState('');
	const [magnetTouched, setMagnetTouched] = useState(false);
	// Bumped on each success; the effect below focuses the next field after the re-render.
	const [addedCount, setAddedCount] = useState(0);
	const titleRef = useRef<HTMLInputElement>(null);
	const episodeRef = useRef<HTMLInputElement>(null);
	// isPending only flips after a re-render; two quick clicks would both get through.
	const inFlight = useRef(false);
	const composedTitle = fields.composedTitle;

	const create = useMutation({
		mutationFn: (title: string) => createRssItem({ title, magnet: magnet.trim() }),
		onSuccess: () => {
			toast.success('Item adicionado ao feed');
			setMagnet('');
			setMagnetTouched(false);
			if (!fields.values.isTitleOnly) fields.advanceEpisode();
			setAddedCount((count) => count + 1);
			return queryClient.invalidateQueries({ queryKey: ['anime-rss', 'rss'] });
		}
	});

	useEffect(() => {
		if (addedCount === 0) return;
		const next = episodeRef.current ?? titleRef.current;
		next?.focus();
		next?.select();
	}, [addedCount]);

	const magnetIsValid = MAGNET_PATTERN.test(magnet.trim());
	const canSubmit = composedTitle !== null && !exceedsTitleLimit(composedTitle) && magnetIsValid && !create.isPending;
	const isDuplicate = create.isError && getApiErrorStatus(create.error) === 409;
	const otherError = create.isError && !isDuplicate ? getApiErrorMessage(create.error) : null;

	function handleSubmit(event: FormEvent) {
		event.preventDefault();
		if (!canSubmit || composedTitle === null || inFlight.current) return;
		inFlight.current = true;
		create.mutate(composedTitle, {
			onSettled: () => {
				inFlight.current = false;
			}
		});
	}

	return (
		<Drawer open={open} title='Adicionar item ao feed' onClose={onClose}>
			<form onSubmit={handleSubmit} className='space-y-4'>
				<ManualTitleFields fields={fields} isDuplicate={isDuplicate} titleRef={titleRef} episodeRef={episodeRef} />
				<div>
					<label htmlFor='rss-item-magnet' className={labelCls}>
						Magnet
					</label>
					<Input
						id='rss-item-magnet'
						value={magnet}
						onChange={(e) => {
							setMagnet(e.target.value);
							setMagnetTouched(true);
						}}
						placeholder='magnet:?xt=urn:btih:…'
						className='font-mono text-xs'
						aria-invalid={magnetTouched && !magnetIsValid}
					/>
					{magnetTouched && !magnetIsValid && <p className='mt-1 text-xs text-danger'>{MAGNET_HINT}</p>}
				</div>
				{otherError && (
					<p role='alert' className='rounded-md bg-danger-bg px-3 py-2 text-xs text-danger'>
						{otherError}
					</p>
				)}
				<div className='flex gap-2'>
					<Button type='submit' variant='primary' disabled={!canSubmit} aria-busy={create.isPending}>
						Adicionar
					</Button>
					<Button type='button' variant='ghost' onClick={onClose}>
						Cancelar
					</Button>
				</div>
			</form>
		</Drawer>
	);
}
