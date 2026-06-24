type PagePlaceholderProps = {
	description: string;
	label: string;
	testId: string;
	title: string;
};

export function PagePlaceholder({ description, label, testId, title }: PagePlaceholderProps) {
	return (
		<section
			className='flex h-full min-h-[calc(100dvh-3.75rem)] items-center justify-center p-6'
			data-testid={testId}
		>
			<div className='grid max-w-2xl gap-5 text-center'>
				<div className='design-eyebrow mx-auto flex h-10 w-fit items-center px-4'>{label}</div>
				<div className='grid gap-3'>
					<h1 className='design-page-title'>{title}</h1>
					<p className='design-page-copy mx-auto max-w-xl'>{description}</p>
				</div>
			</div>
		</section>
	);
}
