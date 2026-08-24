type PagePlaceholderProps = {
	description: string;
	label: string;
	testId: string;
	title: string;
};

export function PagePlaceholder({ description, label, testId, title }: PagePlaceholderProps) {
	return (
		<section className='grid place-items-center px-2 py-10' data-testid={testId}>
			<div className='grid max-w-2xl justify-items-center gap-5 text-center'>
				<p className='design-section-label px-3 py-1.5'>{label}</p>
				<div className='grid gap-3'>
					<h1 className='design-page-title'>{title}</h1>
					<p className='design-page-description mx-auto max-w-xl'>{description}</p>
				</div>
			</div>
		</section>
	);
}
