import { ErrorMessage } from '../../../components/ui/ErrorMessage';
import { getApiErrorMessage, getApiErrorStatus } from '../../../lib/apiError';

const HTTP_SERVICE_UNAVAILABLE = 503;

/** 503 means the env is absent, not a failure, so it reads as a state rather than an error. */
export function SonarrError({ error }: { error: unknown }) {
	if (getApiErrorStatus(error) === HTTP_SERVICE_UNAVAILABLE) {
		return <p className='text-sm text-text-muted'>Sonarr não configurado</p>;
	}
	return <ErrorMessage message={getApiErrorMessage(error)} />;
}
