<script>
	import { supabase } from '$lib/supabaseClient';
	import { createEventDispatcher } from 'svelte';

	let title = '';
	let author = '';
	let description = '';
	let cover_url = '';
	let page_count = '';
	let error = '';
	let success = '';

	// OpenLibrary search state
	let search = '';
	let results = [];
	let searching = false;
	let showDropdown = false;

	const dispatch = createEventDispatcher();

	// Live search: Only fire if user types 3+ chars
	$: if (search.length > 2) {
		searchOpenLibrary(search);
	} else {
		results = [];
		showDropdown = false;
	}

	async function searchOpenLibrary(query) {
		searching = true;
		showDropdown = true;
		// Spanish only!
		const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=8`;
		const res = await fetch(url);
		const data = await res.json();
		results = (data?.docs || []).map((doc) => ({
			title: doc.title,
			author: doc.author_name ? doc.author_name[0] : '',
			cover_olid: doc.cover_edition_key,
			olid: doc.edition_key ? doc.edition_key[0] : '',
			page_count: doc.number_of_pages_median,
			year: doc.first_publish_year,
			work_key: doc.key // e.g., "/works/OL12345W"
		}));
		searching = false;
	}

	async function pickResult(book) {
		title = book.title || '';
		author = book.author || '';
		cover_url = book.cover_olid
			? `https://covers.openlibrary.org/b/olid/${book.cover_olid}-L.jpg`
			: '';
		page_count = book.page_count || '';
		search = book.title;
		showDropdown = false;

		// Fetch extra info (description) from work details
		if (book.work_key) {
			const detailsUrl = `https://openlibrary.org${book.work_key}.json`;
			try {
				const detailsRes = await fetch(detailsUrl);
				const detailsData = await detailsRes.json();
				description =
					typeof detailsData.description === 'string'
						? detailsData.description
						: detailsData.description?.value || '';
				// Use cover ID if present and cover_url is still empty
				if (!cover_url && Array.isArray(detailsData.covers) && detailsData.covers.length > 0) {
					cover_url = `https://covers.openlibrary.org/b/id/${detailsData.covers[0]}-L.jpg`;
				}
			} catch (err) {
				// ignore if fetch fails
			}
		}
	}

	async function addBook() {
		error = '';
		success = '';
		if (!title || !author) {
			error = 'Title and Author are required.';
			return;
		}
		const { data, err } = await supabase
			.from('books')
			.insert({
				title,
				author,
				description,
				cover_url,
				page_count: page_count ? Number(page_count) : null
			})
			.select()
			.single();

		if (err) {
			error = err.message;
		} else {
			success = 'Book added!';
			title = author = description = cover_url = page_count = '';
			search = '';
			dispatch('bookAdded', data);
		}
	}
</script>

<form class="add-book-form" on:submit|preventDefault={addBook} autocomplete="off">
	<div class="add-book-row" style="position:relative;">
		<label>Find Book (OpenLibrary or Manual)</label>
		<input
			placeholder="Start typing a title or author…"
			bind:value={search}
			on:input={() => {
				showDropdown = true;
			}}
			on:focus={() => {
				showDropdown = true;
			}}
			on:blur={() => setTimeout(() => (showDropdown = false), 150)}
			autocomplete="off"
		/>

		{#if showDropdown && results.length > 0}
			<ul class="openlib-dropdown">
				{#each results as book}
					<li class="openlib-dropdown__item" on:mousedown={() => pickResult(book)}>
						<div class="openlib-dropdown__cover">
							{#if book.cover_olid}
								<img
									src={`https://covers.openlibrary.org/b/olid/${book.cover_olid}-S.jpg`}
									alt="cover"
								/>
							{/if}
						</div>
						<div>
							<div class="openlib-dropdown__title">{book.title}</div>
							<div class="openlib-dropdown__meta">
								{book.author}
								{book.year ? `(${book.year})` : ''}
							</div>
						</div>
					</li>
				{/each}
			</ul>
		{/if}
	</div>

	<div class="add-book-row">
		<label>Title <span>*</span></label>
		<input bind:value={title} required />
	</div>
	<div class="add-book-row">
		<label>Author <span>*</span></label>
		<input bind:value={author} required />
	</div>
	<div class="add-book-row">
		<label>Description</label>
		<textarea bind:value={description} />
	</div>
	<div class="add-book-row">
		<label>Cover Image URL</label>
		<input bind:value={cover_url} />
		{#if cover_url}
			<div class="openlib-cover-preview">
				<img src={cover_url} alt="cover preview" />
			</div>
		{/if}
	</div>
	<div class="add-book-row">
		<label>Page Count</label>
		<input type="number" min="1" bind:value={page_count} />
	</div>
	<button class="add-book-btn" type="submit">ADD BOOK</button>
	{#if error}
		<div class="add-book-error">{error}</div>
	{/if}
	{#if success}
		<div class="add-book-success">{success}</div>
	{/if}
</form>

<style>
	.add-book-form {
		background: #fff;
		border-radius: 20px;
		box-shadow: 0 1px 10px 0 rgba(0, 0, 0, 0.08);
		padding: 30px 30px 20px 30px;
		max-width: 400px;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: 14px;
	}
	.add-book-row {
		display: flex;
		flex-direction: column;
		gap: 4px;
		position: relative;
	}
	.add-book-row label {
		font-weight: 700;
		font-size: 1rem;
		margin-bottom: 2px;
		color: #222;
	}
	.add-book-row label span {
		color: #e53935;
	}
	.add-book-form input,
	.add-book-form textarea {
		font-size: 1rem;
		padding: 8px 12px;
		border-radius: 12px;
		border: 1px solid #e5e5e5;
		background: #fafbfc;
		margin-bottom: 2px;
	}
	.add-book-form textarea {
		min-height: 60px;
		resize: vertical;
	}
	.add-book-btn {
		background: #e53935;
		color: #fff;
		font-weight: 800;
		font-size: 1.04rem;
		border: none;
		padding: 12px 0;
		border-radius: 18px;
		margin-top: 10px;
		cursor: pointer;
		box-shadow: 0 2px 6px 0 rgba(229, 57, 53, 0.08);
		transition: background 0.15s;
	}
	.add-book-btn:hover {
		background: #b71c1c;
	}
	.add-book-error {
		color: #e53935;
		font-size: 0.98rem;
		margin-top: 6px;
	}
	.add-book-success {
		color: #43a047;
		font-size: 0.98rem;
		margin-top: 6px;
	}
	.openlib-dropdown {
		position: absolute;
		z-index: 20;
		top: 90px;
		left: 0;
		right: 0;
		background: #fff;
		border-radius: 14px;
		border: 1px solid #eee;
		box-shadow: 0 4px 24px 0 rgba(0, 0, 0, 0.1);
		max-height: 350px;
		overflow-y: auto;
		list-style: none;
		margin: 0;
		padding: 0;
	}
	.openlib-dropdown__item {
		display: flex;
		align-items: center;
		gap: 10px;
		cursor: pointer;
		padding: 8px 12px;
		border-bottom: 1px solid #f3f3f3;
		transition: background 0.15s;
	}
	.openlib-dropdown__item:last-child {
		border-bottom: none;
	}
	.openlib-dropdown__item:hover {
		background: #f6f7fa;
	}
	.openlib-dropdown__cover img {
		width: 36px;
		height: 48px;
		border-radius: 6px;
		background: #eee;
		object-fit: cover;
	}
	.openlib-dropdown__title {
		font-weight: bold;
		font-size: 1.04rem;
		color: #181818;
	}
	.openlib-dropdown__meta {
		font-size: 0.93rem;
		color: #69768d;
	}
	.openlib-cover-preview {
		margin-top: 8px;
		background: #f4f4f4;
		border-radius: 10px;
		padding: 6px;
		display: inline-block;
	}
	.openlib-cover-preview img {
		width: 60px;
		height: 85px;
		object-fit: cover;
		border-radius: 8px;
	}
</style>
