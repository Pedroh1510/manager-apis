import { FOCUS_RING } from './focusRing';

interface ToggleProps {
	checked: boolean;
	onChange: (checked: boolean) => void;
	label: string;
	disabled?: boolean;
	/** Shows the label next to the switch; otherwise it is only the accessible name. */
	showLabel?: boolean;
}

/**
 * Accessible on/off switch (`role="switch"`).
 * @example <Toggle checked={isActive} onChange={setActive} label='Ativar TCB' />
 */
export function Toggle({ checked, onChange, label, disabled = false, showLabel = false }: ToggleProps) {
	return (
		<button
			type='button'
			role='switch'
			aria-checked={checked}
			aria-label={label}
			disabled={disabled}
			onClick={() => onChange(!checked)}
			className={`group inline-flex items-center gap-2 rounded-full ${FOCUS_RING} disabled:cursor-not-allowed disabled:opacity-40`}
		>
			<span
				aria-hidden='true'
				className={`relative inline-flex h-4 w-7 shrink-0 items-center rounded-full transition-colors ${checked ? 'bg-success' : 'bg-border'}`}
			>
				<span
					className={`h-3 w-3 rounded-full bg-white shadow-raised transition-transform ${checked ? 'translate-x-3.5' : 'translate-x-0.5'}`}
				/>
			</span>
			{showLabel && <span className='text-xs text-text-muted'>{label}</span>}
		</button>
	);
}
