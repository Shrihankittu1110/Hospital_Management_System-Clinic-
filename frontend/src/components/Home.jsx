import React, { useState } from 'react';
import { ArrowRight, Calendar, Clock3, Hospital, ShieldCheck, Sparkles, Stethoscope, User, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Login from './Login';
import SignUp from './SignUp';

const Button = ({ children, primary, onClick, ...props }) => (
	<button
		className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
			primary
				? 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg focus:ring-blue-500'
				: 'border border-slate-200 bg-white/90 text-slate-700 hover:border-slate-300 hover:bg-white focus:ring-blue-500'
		}`}
		onClick={onClick}
		{...props}
	>
		{children}
	</button>
);

const Card = ({ icon: Icon, title, description, onClick }) => (
	<div
		className="group cursor-pointer rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-2xl"
		onClick={onClick}
		onKeyDown={(event) => {
			if (event.key === 'Enter' || event.key === ' ') {
				event.preventDefault();
				onClick?.();
			}
		}}
		role="button"
		tabIndex={0}
	>
		<div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 text-blue-600 shadow-sm transition-transform duration-300 group-hover:scale-105">
			<Icon className="h-6 w-6" />
		</div>
		<h3 className="mb-2 text-xl font-semibold text-slate-900">{title}</h3>
		<p className="mb-5 leading-relaxed text-slate-600">{description}</p>
		<Button primary onClick={onClick}>
			Explore <ArrowRight className="h-4 w-4" />
		</Button>
	</div>
);

const Section = ({ children, bg, height, className = '' }) => (
	<section className={`${height || 'py-20'} ${bg || ''} ${className} content-center`}>
		<div className="container mx-auto px-4 h-full">{children}</div>
	</section>
);

const Home = () => {
	const navigate = useNavigate();
	const [showLoginModal, setShowLoginModal] = useState(false);
	const [showSignupModal, setShowSignupModal] = useState(false);

	const handleButtonClick = (route) => {
		if (route === '/login') {
			setShowLoginModal(true);
		} else if (route === '/signup') {
			setShowSignupModal(true);
		} else {
			navigate(route);
			window.setTimeout(() => {
				window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
			}, 0);
		}
	};

	const quickStats = [
		{ value: '24/7', label: 'Access to records' },
		{ value: '3', label: 'Core workflows' },
		{ value: '100%', label: 'Centralized control' },
	];

	const moduleCards = [
		{
			icon: User,
			title: 'Patient Management',
			description: 'Efficiently manage patient records, appointments, and medical history.',
			route: '/patient-management',
		},
		{
			icon: Hospital,
			title: 'Doctor Management',
			description: 'Manage doctor profiles, schedules, and patient assignments.',
			route: '/doctor-management',
		},
		{
			icon: Calendar,
			title: 'Appointment Scheduling',
			description: 'Streamline appointment booking and management for patients and doctors.',
			route: '/appointment-management',
		},
	];

	const highlights = [
		{ icon: ShieldCheck, title: 'Secure records', text: 'Keep patient data organized and protected.' },
		{ icon: Stethoscope, title: 'Clinical workflows', text: 'Connect doctors, patients, and care teams.' },
		{ icon: Calendar, title: 'Fast scheduling', text: 'Move appointments from request to visit quickly.' },
	];

	return (
		<div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
			{/* Login Modal */}
			{showLoginModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
					<div
						className="absolute inset-0 bg-black/40 backdrop-blur-md transition-opacity duration-300"
						onClick={() => setShowLoginModal(false)}
					/>
					<div className="relative w-full max-w-md max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
						<button
							onClick={() => setShowLoginModal(false)}
							className="absolute top-4 right-4 z-20 p-2 rounded-full hover:bg-white/20 transition-colors"
						>
							<X size={24} className="text-white" />
						</button>
						<div className="overflow-y-auto max-h-[90vh]">
							<Login
								onClose={() => setShowLoginModal(false)}
								onSwitchToSignup={() => {
									setShowLoginModal(false);
									setShowSignupModal(true);
								}}
							/>
						</div>
					</div>
				</div>
			)}

			{/* SignUp Modal */}
			{showSignupModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
					<div
						className="absolute inset-0 bg-black/40 backdrop-blur-md transition-opacity duration-300"
						onClick={() => setShowSignupModal(false)}
					/>
					<div className="relative w-full max-w-md max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
						<button
							onClick={() => setShowSignupModal(false)}
							className="absolute top-4 right-4 z-20 p-2 rounded-full hover:bg-white/20 transition-colors"
						>
							<X size={24} className="text-white" />
						</button>
						<div className="overflow-y-auto max-h-[90vh]">
							<SignUp
								onClose={() => setShowSignupModal(false)}
								onSwitchToLogin={() => {
									setShowSignupModal(false);
									setShowLoginModal(true);
								}}
							/>
						</div>
					</div>
				</div>
			)}

			<header className="sticky top-0 z-40 border-b border-white/60 bg-white/85 backdrop-blur-xl">
				<div className="container mx-auto flex items-center justify-between px-4 py-4">
					<div className="flex items-center gap-3">
						<div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200">
							<Hospital className="h-6 w-6" />
						</div>
						<div>
							<span className="block text-lg font-semibold leading-tight">Hospital Management System</span>
							<span className="block text-xs uppercase tracking-[0.3em] text-slate-500">Smart care platform</span>
						</div>
					</div>
					<nav className="flex items-center gap-3">
						<Button primary onClick={() => handleButtonClick('/login')}>Login</Button>
						<Button onClick={() => handleButtonClick('/signup')}>Sign Up</Button>
					</nav>
				</div>
			</header>

			<main className="flex-1">
				<Section
					bg="bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.16),_transparent_35%),linear-gradient(180deg,_#eff6ff_0%,_#f8fafc_45%,_#ffffff_100%)]"
					height="min-h-[42rem]"
					className="relative overflow-hidden"
				>
					<div className="absolute left-10 top-12 h-32 w-32 rounded-full bg-cyan-300/20 blur-3xl" />
					<div className="absolute right-10 top-20 h-40 w-40 rounded-full bg-blue-400/20 blur-3xl" />

					<div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center h-full py-10">
						<div className="max-w-2xl">
							<div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/80 px-4 py-2 text-sm text-blue-700 shadow-sm backdrop-blur">
								<Sparkles className="h-4 w-4" />
								Trusted by modern hospital teams
							</div>

							<h1 className="mt-6 text-4xl font-black leading-[1.05] tracking-tight text-slate-900 md:text-6xl">
								Streamline your hospital operations with clarity.
							</h1>

							<p className="mt-6 max-w-xl text-lg leading-8 text-slate-600 md:text-xl">
								Manage patients, doctors, and appointments in one refined workspace designed to keep your hospital team
								coordinated, informed, and fast.
							</p>

							<div className="mt-8 flex flex-wrap gap-3">
								<Button primary onClick={() => handleButtonClick('/patient-management')}>
									Explore Patient Management <ArrowRight className="h-4 w-4" />
								</Button>
								<Button onClick={() => handleButtonClick('/appointment-management')}>
									View Scheduling <Clock3 className="h-4 w-4" />
								</Button>
							</div>

							<div className="mt-10 grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-3">
								{quickStats.map((item) => (
									<div key={item.label} className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-4 shadow-sm backdrop-blur">
										<p className="text-2xl font-bold text-slate-900">{item.value}</p>
										<p className="mt-1 text-sm text-slate-500">{item.label}</p>
									</div>
								))}
							</div>
						</div>

						<div className="relative">
							<div className="absolute -left-6 top-8 h-24 w-24 rounded-3xl bg-blue-600/10 blur-2xl" />
							<div className="absolute -right-8 bottom-10 h-28 w-28 rounded-full bg-emerald-400/10 blur-2xl" />

							<div className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-white shadow-[0_25px_70px_-25px_rgba(15,23,42,0.35)]">
								<img src="/home-1.jpeg" alt="Hospital management" className="h-[28rem] w-full object-cover" />
								<div className="absolute inset-0 bg-gradient-to-t from-slate-900/35 via-transparent to-transparent" />

								<div className="absolute left-5 top-5 rounded-2xl bg-white/90 px-4 py-3 shadow-lg backdrop-blur">
									<p className="text-xs uppercase tracking-[0.25em] text-slate-500">Live status</p>
									<p className="mt-1 font-semibold text-slate-900">Patient flow active</p>
								</div>

								<div className="absolute bottom-5 right-5 rounded-2xl bg-slate-900/90 px-4 py-3 text-white shadow-lg backdrop-blur">
									<p className="text-xs uppercase tracking-[0.25em] text-slate-300">Next appointment</p>
									<p className="mt-1 font-semibold">Optimized scheduling</p>
								</div>
							</div>
						</div>
					</div>
				</Section>

				<Section className="py-6">
					<div className="rounded-[2rem] border border-slate-200 bg-white px-6 py-5 shadow-sm">
						<div className="grid grid-cols-1 gap-4 md:grid-cols-3 text-center md:text-left">
							{highlights.map((item) => (
								<div key={item.title} className="flex items-center gap-4 rounded-2xl px-4 py-3 transition hover:bg-slate-50">
									<div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
										<item.icon className="h-6 w-6" />
									</div>
									<div>
										<p className="font-semibold text-slate-900">{item.title}</p>
										<p className="text-sm text-slate-500">{item.text}</p>
									</div>
								</div>
							))}
						</div>
					</div>
				</Section>

				<Section>
					<div className="mb-8 flex items-end justify-between gap-4">
						<div>
							<p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">Core modules</p>
							<h2 className="mt-2 text-3xl font-bold text-slate-900">Choose a management area to explore</h2>
						</div>
						<p className="hidden max-w-xl text-sm text-slate-500 md:block">
							Each module opens a dedicated page with a practical overview, interactive tabs, and visuals tailored to that workflow.
						</p>
					</div>

					<div className="grid grid-cols-1 gap-8 md:grid-cols-3">
						{moduleCards.map((card) => (
							<Card
								key={card.route}
								icon={card.icon}
								title={card.title}
								description={card.description}
								onClick={() => handleButtonClick(card.route)}
							/>
						))}
					</div>
				</Section>

				<Section bg="bg-slate-900" className="relative overflow-hidden">
					<div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(59,130,246,0.18),_transparent_30%),radial-gradient(circle_at_bottom_left,_rgba(16,185,129,0.12),_transparent_32%)]" />
					<div className="relative grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
						<div>
							<p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-300">Operational clarity</p>
							<h2 className="mt-3 text-3xl font-bold text-white md:text-4xl">A cleaner workflow for busy teams</h2>
							<p className="mt-4 max-w-2xl leading-8 text-slate-300">
								From patient intake to scheduling and doctor coordination, the dashboard keeps the team aligned and reduces friction in daily operations.
							</p>
						</div>
						<div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 p-3 shadow-2xl backdrop-blur">
							<img src="/home-2.jpeg" alt="Hospital operations" className="h-72 w-full rounded-[1.5rem] object-cover" />
						</div>
					</div>
				</Section>
			</main>

			<footer className="border-t border-slate-200 bg-white">
				<div className="container mx-auto flex flex-col gap-4 px-4 py-8">
					<div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
						<div>
							<p className="font-semibold text-slate-800">Hospital Management System</p>
							<p className="text-sm text-slate-500">24/7 patient support, appointment scheduling, and secure medical record management.</p>
						</div>
						<p className="text-sm text-slate-500">© 2024 Hospital Management. All rights reserved.</p>
					</div>
					<div className="flex flex-col gap-2 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
						<p>Address: 123 Health Care Ave, Medical City</p>
						<p>Phone: +1 (555) 123-4567</p>
						<p>Email: support@hospitalmanagement.com</p>
					</div>
				</div>
			</footer>
		</div>
	);
};

export default Home;
