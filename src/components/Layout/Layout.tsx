import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export function Layout() {
	return (
		<div className='flex h-screen'>
			<Sidebar />
			<main className='flex-1 overflow-y-auto bg-gray-50 p-8'>
				<Outlet />
			</main>
		</div>
	);
}
