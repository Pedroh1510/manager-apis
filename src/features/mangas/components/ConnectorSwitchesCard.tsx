import { useState, type FormEvent } from 'react';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { Toggle } from '../../../components/ui/Toggle';
import { useConnectorSwitches, type SetSwitchVariables } from '../hooks/useConnectorSwitches';
import { describeDisabled } from '../lib/connectorSwitch';
import type { ConnectorSwitch } from '../services/types';

// Mirrors the backend limit on the reason (validators/mangasAdmValidator.js).
const REASON_MAX_LENGTH = 200;

interface ReasonFormProps {
	idPlugin: string;
	isPending: boolean;
	onConfirm: (reason: string) => void;
	onCancel: () => void;
}

function ReasonForm({ idPlugin, isPending, onConfirm, onCancel }: ReasonFormProps) {
	const [reason, setReason] = useState('');
	const inputId = `switch-reason-${idPlugin}`;
	function handleSubmit(e: FormEvent) {
		e.preventDefault();
		onConfirm(reason);
	}
	return (
		<form onSubmit={handleSubmit} className='flex flex-wrap items-end gap-2 pb-2 pl-10'>
			<div className='min-w-48 flex-1'>
				<label htmlFor={inputId} className='mb-1 block text-xs font-medium text-text-muted'>
					Motivo (opcional)
				</label>
				<Input id={inputId} value={reason} maxLength={REASON_MAX_LENGTH} onChange={(e) => setReason(e.target.value)} autoFocus />
			</div>
			<Button type='submit' variant='primary' disabled={isPending}>
				Desligar
			</Button>
			<Button type='button' onClick={onCancel}>
				Cancelar
			</Button>
		</form>
	);
}

interface SwitchRowProps {
	item: ConnectorSwitch;
	isPending: boolean;
	onChange: (variables: SetSwitchVariables) => void;
}

function SwitchRow({ item, isPending, onChange }: SwitchRowProps) {
	const [isAskingReason, setIsAskingReason] = useState(false);
	function handleToggle(enabled: boolean) {
		if (enabled) return onChange({ idPlugin: item.id, enabled });
		setIsAskingReason(true);
	}
	return (
		<li>
			<div className='flex min-h-11 flex-wrap items-center gap-3'>
				<Toggle checked={item.enabled} disabled={isPending || isAskingReason} label={`Conector ${item.id}`} onChange={handleToggle} />
				<span className={`font-mono text-xs ${item.enabled ? 'text-text' : 'text-text-muted'}`}>{item.id}</span>
				<span className='text-xs text-text-muted'>{item.activeLinks} links ativos</span>
				{!item.enabled && <span className='text-xs text-warning'>{describeDisabled(item)}</span>}
			</div>
			{isAskingReason && (
				<ReasonForm
					idPlugin={item.id}
					isPending={isPending}
					onCancel={() => setIsAskingReason(false)}
					onConfirm={(reason) => {
						setIsAskingReason(false);
						onChange({ idPlugin: item.id, enabled: false, reason });
					}}
				/>
			)}
		</li>
	);
}

/**
 * Admin list of "Conector desligado" switches: turning one off asks for an
 * optional reason inline; turning it on is immediate and triggers nothing.
 * @example <ConnectorSwitchesCard />
 */
export function ConnectorSwitchesCard() {
	const { switches, setSwitch } = useConnectorSwitches();
	return (
		<Card className='mb-4'>
			<h2 className='text-sm font-semibold text-text'>Conectores</h2>
			<p className='mb-2 text-xs text-text-muted'>Desligar um conector o tira de uso em todos os mangás; cada link guarda seu próprio estado.</p>
			{switches.isLoading && <p className='text-xs text-text-muted'>Carregando conectores…</p>}
			{switches.isError && <p className='text-xs text-danger'>Não foi possível carregar os conectores.</p>}
			<ul className='divide-y divide-border'>
				{(switches.data ?? []).map((item) => (
					<SwitchRow key={item.id} item={item} isPending={setSwitch.isPending} onChange={(variables) => setSwitch.mutate(variables)} />
				))}
			</ul>
		</Card>
	);
}
