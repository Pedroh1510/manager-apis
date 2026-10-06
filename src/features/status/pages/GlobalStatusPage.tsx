import { useAnimeStatus } from '../../anime-rss/hooks/useAnimeStatus'
import { useMangasStatus } from '../../mangas/hooks/useMangasStatus'
import { QueuesSummaryBlock } from '../../queues/components/QueuesSummaryBlock'
import { GlobalStatusSummary } from '../components/GlobalStatusSummary'
import { AnimeRssStatusSection } from '../components/AnimeRssStatusSection'
import { MangasStatusSection } from '../components/MangasStatusSection'
import { MigrationsSection } from '../components/MigrationsSection'

export function GlobalStatusPage() {
  const anime = useAnimeStatus()
  const mangas = useMangasStatus()

  return (
    <div className='mx-auto max-w-6xl'>
      <h1 className='mb-4 text-xl font-semibold tracking-tight text-text'>Status</h1>
      <GlobalStatusSummary
        projects={[
          { label: 'Anime RSS', isLoading: anime.isLoading, isSuccess: anime.isSuccess },
          { label: 'Mangas Manager', isLoading: mangas.isLoading, isSuccess: mangas.isSuccess },
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
      </div>
    </div>
  )
}
