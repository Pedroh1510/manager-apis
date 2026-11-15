import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { FOCUS_RING } from '../../../components/ui/focusRing';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { Table, Td, Th } from '../../../components/ui/Table';
import { Toggle } from '../../../components/ui/Toggle';
import { describeDisabled } from '../lib/connectorSwitch';
import { deriveMangaStatus } from '../lib/mangaStatus';
import { mangaCoverUrl } from '../services/coverUrls';
import type { MangaConnectorSummary, MangaListItem } from '../services/types';
import { MangaCover } from './MangaCover';

interface MangasTableProps {
	mangas: MangaListItem[];
	pluginNames: Record<string, string>;
	/** Manga whose toggle mutation is in flight; its toggles stay disabled until it settles. */
	pendingMangaId: number | null;
	onSetAllConnectorsActive: (idManga: number, isActive: boolean) => void;
	onSetConnectorActive: (idManga: number, idPlugin: string, isActive: boolean) => void;
	onDelete: (manga: MangaListItem) => void;
}

export function MangasTable({ mangas, ...rowProps }: MangasTableProps) {
	return (
		<Table>
			<thead>
				<tr>
					<Th className='w-16'>Ativo</Th>
					<Th>Título</Th>
					<Th>Conectores</Th>
					<Th className='w-28'>Status</Th>
					<Th className='w-24 text-right'>Ações</Th>
				</tr>
			</thead>
			<tbody>
				{mangas.map((manga) => (
					<MangaRow key={manga.idManga} manga={manga} {...rowProps} />
				))}
			</tbody>
		</Table>
	);
}

// Absent means enabled: the field only exists once the backend serves it.
const isConnectorOn = (connector: MangaConnectorSummary): boolean => connector.connectorEnabled !== false;

type MangaRowProps = Omit<MangasTableProps, 'mangas'> & { manga: MangaListItem };

function MangaRow({ manga, pluginNames, pendingMangaId, onSetAllConnectorsActive, onSetConnectorActive, onDelete }: MangaRowProps) {
	const status = deriveMangaStatus(manga.connectors);
	const isPending = pendingMangaId === manga.idManga;
	const hasConnectors = manga.connectors.length > 0;
	// With every link on a disabled connector, turning the manga on fetches nothing.
	const hasEnabledConnector = manga.connectors.some(isConnectorOn);

	return (
		<tr className='group transition-colors hover:bg-surface-raised/60'>
			<Td>
				<Toggle
					checked={status !== 'inactive'}
					disabled={isPending || !hasEnabledConnector}
					label={`Ativar ou desativar ${manga.title}`}
					onChange={(isActive) => onSetAllConnectorsActive(manga.idManga, isActive)}
				/>
			</Td>
			<Td data-testid='manga-title' className='font-medium'>
				<div className='flex items-center gap-3'>
					<MangaCover src={mangaCoverUrl(manga.idManga)} title={manga.title} width={32} height={45} />
					<Link to={`/mangas/${manga.idManga}`} className={`rounded-sm hover:text-accent hover:underline ${FOCUS_RING}`}>
						{manga.title}
					</Link>
				</div>
			</Td>
			<Td>
				{hasConnectors ? (
					<ConnectorChips manga={manga} pluginNames={pluginNames} disabled={isPending} onToggle={onSetConnectorActive} />
				) : (
					<span className='text-xs text-text-subtle'>Vincule um conector</span>
				)}
			</Td>
			<Td>
				<StatusBadge status={status} />
			</Td>
			<Td className='text-right'>
				<Button
					variant='ghost'
					size='sm'
					aria-label={`Remover ${manga.title}`}
					className='text-danger opacity-70 hover:text-danger group-hover:opacity-100'
					onClick={() => onDelete(manga)}
				>
					Remover
				</Button>
			</Td>
		</tr>
	);
}

interface ConnectorChipsProps {
	manga: MangaListItem;
	pluginNames: Record<string, string>;
	disabled: boolean;
	onToggle: (idManga: number, idPlugin: string, isActive: boolean) => void;
}

function ConnectorChips({ manga, pluginNames, disabled, onToggle }: ConnectorChipsProps) {
	// A single connector is already driven by the general toggle.
	const showToggles = manga.connectors.length > 1;
	return (
		<ul className='flex flex-wrap gap-1.5'>
			{manga.connectors.map((connector) => (
				<ConnectorChip
					key={connector.idMangaConnector}
					connector={connector}
					name={pluginNames[connector.idPlugin] || connector.idPlugin}
					toggle={
						showToggles ? (
							<Toggle
								checked={connector.isActive}
								disabled={disabled || !isConnectorOn(connector)}
								label={`Conector ${pluginNames[connector.idPlugin] || connector.idPlugin} de ${manga.title}`}
								onChange={(isActive) => onToggle(manga.idManga, connector.idPlugin, isActive)}
							/>
						) : null
					}
				/>
			))}
		</ul>
	);
}

function chipTitle(connector: MangaConnectorSummary): string {
	if (isConnectorOn(connector)) return connector.titlePlugin;
	const disabled = describeDisabled({
		disabledAt: connector.connectorDisabledAt ?? null,
		disabledReason: connector.connectorDisabledReason ?? null,
	});
	return `${connector.titlePlugin} — ${disabled}`;
}

// Dot: green fetching, red link off, amber connector off for every manga.
function chipDotClass(connector: MangaConnectorSummary): string {
	if (!isConnectorOn(connector)) return 'bg-warning';
	return connector.isActive ? 'bg-success' : 'bg-danger';
}

function ConnectorChip({ connector, name, toggle }: { connector: MangaConnectorSummary; name: string; toggle: ReactNode }) {
	const isFetching = connector.isActive && isConnectorOn(connector);
	return (
		<li
			data-testid={`connector-chip-${connector.idPlugin}`}
			data-active={String(isFetching)}
			title={chipTitle(connector)}
			className={`inline-flex h-6 items-center gap-1.5 rounded-sm border px-1.5 text-xs ${
				isFetching ? 'border-border bg-surface text-text' : 'border-dashed border-border bg-transparent text-text-subtle'
			} ${isConnectorOn(connector) ? '' : 'opacity-60'}`}
		>
			<span aria-hidden='true' className={`h-1.5 w-1.5 rounded-full ${chipDotClass(connector)}`} />
			<span className='font-mono'>{name}</span>
			{toggle}
		</li>
	);
}
