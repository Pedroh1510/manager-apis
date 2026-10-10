import { useAnimeStatus } from '../../anime-rss/hooks/useAnimeStatus'
import { useMangasStatus } from '../../mangas/hooks/useMangasStatus'
import { QueuesSummaryBlock } from '../../queues/components/QueuesSummaryBlock'
import { GlobalStatusSummary } from '../components/GlobalStatusSummary'
import { AnimeRssStatusSection } from '../components/AnimeRssStatusSection'
import { MangasStatusSection } from '../components/MangasStatusSection'
import { MigrationsSection } from '../components/MigrationsSection'
import { QbittorrentStatusSection } from '../components/QbittorrentStatusSection'
import { SonarrStatusSection } from '../components/SonarrStatusSection'
import { useSonarrStatus } from '../../sonarr/hooks/useSonarrStatus'
import { useServerConfig } from '../../server-config/hooks/useServerConfig'
import { useQbittorrentStatus } from '../../torrents/hooks/useQbittorrentStatus'

export function GlobalStatusPage() {
  const anime = useAnimeStatus()
  const mangas = useMangasStatus()
  const config = useServerConfig().data
  const isQbittorrentOn = config?.qbittorrent === true
  const isSonarrOn = config?.sonarr === true
  const sonarr = useSonarrStatus(isSonarrOn)
  const qbittorrent = useQbittorrentStatus(isQbittorrentOn)
  const qbittorrentProject = { label: 'qBittorrent', isLoading: qbittorrent.isPending, isSuccess: qbittorrent.isSuccess }
  const sonarrProject = { label: 'Sonarr', isLoading: sonarr.isPending, isSuccess: sonarr.isSuccess }

  return (
    <div className='mx-auto max-w-6xl'>
      <h1 className='mb-4 text-xl font-semibold tracking-tight text-text'>Status</h1>
      <GlobalStatusSummary
        projects={[
          { label: 'Anime RSS', isLoading: anime.isLoading, isSuccess: anime.isSuccess },
          { label: 'Mangas Manager', isLoading: mangas.isLoading, isSuccess: mangas.isSuccess },
          // Not configured is a choice, not an outage: it stays out of the count.
          ...(isQbittorrentOn ? [qbittorrentProject] : []),
          ...(isSonarrOn ? [sonarrProject] : []),
        ]}
      />
      <div className='grid gap-4 lg:grid-cols-2'>
        <AnimeRssStatusSection>
          <QueuesSummaryBlock api='anime-rss' />
        </AnimeRssStatusSection>
        <MangasStatusSection>
          <MigrationsSection />
          <QueuesSummaryBlock api='mangas' />
        </MangasStatusSection>
        <QbittorrentStatusSection />
        <SonarrStatusSection />
      </div>
    </div>
  )
}
