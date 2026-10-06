import { useRef, useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../../../components/ui/Button';
import { Drawer } from '../../../components/ui/Drawer';
import { Input } from '../../../components/ui/Input';
import { useToast } from '../../../components/ui/useToast';
import { getApiErrorMessage, getApiErrorStatus } from '../../../lib/apiError';
import { createRssItem } from '../services/api';

// Same rule the API applies: 40 hex or 32 base32 chars of infohash.
const MAGNET_PATTERN = /^magnet:\?xt=urn:btih:([a-fA-F0-9]{40}|[a-zA-Z2-7]{32})/;
const MAGNET_HINT = 'Informe um magnet link (magnet:?xt=urn:btih:…)';
const DUPLICATE_MESSAGE = 'Já existe item com esse título';
const labelCls = 'mb-1 block text-xs font-medium text-text-muted';

interface AddRssItemDrawerProps {
	open: boolean;
	onClose: () => void;
}

/**
 * Title + magnet form that puts a manual item in the RSS feed.
 * @example <AddRssItemDrawer open={isAdding} onClose={() => setIsAdding(false)} />
 */
export function AddRssItemDrawer({ open, onClose }: AddRssItemDrawerProps) {
	const queryClient = useQueryClient();
	const toast = useToast();
	const [title, setTitle] = useState('');
	const [magnet, setMagnet] = useState('');
	const [magnetTouched, setMagnetTouched] = useState(false);
	// isPending only flips after a re-render; two quick clicks would both get through.
	const inFlight = useRef(false);

	const create = useMutation({
		mutationFn: () => createRssItem({ title: title.trim(), magnet: magnet.trim() }),
		onSuccess: () => {
			toast.success('Item adicionado ao feed');
			setTitle('');
			setMagnet('');
			setMagnetTouched(false);
			onClose();
			return queryClient.invalidateQueries({ queryKey: ['anime-rss', 'rss'] });
		}
	});

	const magnetIsValid = MAGNET_PATTERN.test(magnet.trim());
	const canSubmit = title.trim() !== '' && magnetIsValid && !create.isPending;
	const isDuplicate = create.isError && getApiErrorStatus(create.error) === 409;
	const otherError = create.isError && !isDuplicate ? getApiErrorMessage(create.error) : null;

	function handleSubmit(event: FormEvent) {
		event.preventDefault();
		if (!canSubmit || inFlight.current) return;
		inFlight.current = true;
		create.mutate(undefined, {
			onSettled: () => {
				inFlight.current = false;
			}
		});
	}

	return (
		<Drawer open={open} title='Adicionar item ao feed' onClose={onClose}>
			<form onSubmit={handleSubmit} className='space-y-4'>
				<div>
					<label htmlFor='rss-item-title' className={labelCls}>
						Título
					</label>
					<Input
						id='rss-item-title'
						value={title}
						onChange={(e) => setTitle(e.target.value)}
						placeholder='[SubsPlease] Sousou no Frieren - 28 (1080p)'
						aria-invalid={isDuplicate}
						aria-describedby={isDuplicate ? 'rss-item-title-error' : undefined}
					/>
					{isDuplicate && (
						<p id='rss-item-title-error' className='mt-1 text-xs text-danger'>
							{DUPLICATE_MESSAGE}
						</p>
					)}
				</div>
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
