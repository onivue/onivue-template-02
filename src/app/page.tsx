import { Layout } from '@/components/layout/layout';

export default function Home() {
	return (
		<Layout>
			<section className='flex h-full min-h-[calc(100dvh-3.75rem)] items-center justify-center p-6'>
				<div className='grid max-w-2xl gap-5 text-center'>
					<div className='mx-auto flex h-10 w-fit items-center rounded-full border border-border bg-background px-4 text-xs font-medium text-muted-foreground'>
						onivue
					</div>
					<div className='grid gap-3'>
						<h1 className='text-3xl font-semibold tracking-tight text-foreground sm:text-5xl'>Template</h1>
						<p className='mx-auto max-w-xl text-sm leading-6 text-muted-foreground sm:text-base'>
							lorem ipsum
						</p>
					</div>
				</div>
			</section>
		</Layout>
	);
}
