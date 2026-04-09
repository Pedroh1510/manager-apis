import { useAnimeStatus } from '../../anime-rss/hooks/useAnimeStatus'
import { useMangasStatus } from '../../mangas/hooks/useMangasStatus'
import { GlobalStatusSummary } from '../components/GlobalStatusSummary'
import { AnimeRssStatusSection } from '../components/AnimeRssStatusSection'
import { MangasStatusSection } from '../components/MangasStatusSection'

export function GlobalStatusPage() {
  const anime = useAnimeStatus()
  const mangas = useMangasStatus()

  return (
    <div>
      <h1 className='mb-6 text-2xl font-bold text-gray-900'>Status</h1>
      <GlobalStatusSummary
        projects={[
          { label: 'Anime RSS', isLoading: anime.isLoading, isSuccess: anime.isSuccess },
          { label: 'Mangas Manager', isLoading: mangas.isLoading, isSuccess: mangas.isSuccess },
        ]}
      />
      <div className='space-y-10'>
        <AnimeRssStatusSection />
        <MangasStatusSection />
      </div>
    </div>
  )
}
