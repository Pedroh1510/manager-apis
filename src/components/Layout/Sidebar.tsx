import { NavLink } from 'react-router-dom';

const navItems = [
	{
		section: 'Anime RSS',
		links: [
			{ to: '/anime-rss/status', label: 'Status' },
			{ to: '/anime-rss/rss', label: 'Consulta RSS' },
			{ to: '/anime-rss/admin', label: 'ADM' }
		]
	},
	{
		section: 'Mangas Manager',
		links: [
			{ to: '/mangas/status', label: 'Status' },
			{ to: '/mangas/admin', label: 'Configurações / ADM' },
			{ to: '/mangas/list', label: 'Mangas' }
		]
	}
];

export function Sidebar() {
	return (
		<nav className='flex h-full w-60 flex-col bg-gray-900 px-4 py-6 text-white'>
			<h1 className='mb-8 text-xl font-bold'>Manager APIs</h1>
			{navItems.map(({ section, links }) => (
				<div key={section} className='mb-6'>
					<p className='mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400'>
						{section}
					</p>
					<ul className='space-y-1'>
						{links.map(({ to, label }) => (
							<li key={to}>
								<NavLink
									to={to}
									className={({ isActive }) =>
										`block rounded-md px-3 py-2 text-sm transition-colors ${
											isActive
												? 'bg-blue-600 text-white'
												: 'text-gray-300 hover:bg-gray-700 hover:text-white'
										}`
									}
								>
									{label}
								</NavLink>
							</li>
						))}
					</ul>
				</div>
			))}
		</nav>
	);
}
