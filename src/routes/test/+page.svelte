<script>
	let url = '';
	let tags = '';
	let country = '';
	let level = 'intermediate';
	let added_by = '';
	let result = null;
	let error = '';

	const levels = [
		{ value: 'easy', label: 'Easy' },
		{ value: 'intermediate', label: 'Intermediate' },
		{ value: 'advanced', label: 'Advanced' },
		{ value: 'notyet', label: 'Not Yet Rated' }
	];

	async function testImport() {
		error = '';
		result = null;
		const data = { url, tags, country, level, added_by };
		console.log('POSTing:', data);
		try {
			const res = await fetch('/api/add-video', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(data)
			});
			const json = await res.json();
			console.log('API response:', json);
			if (json.error) {
				error = json.error;
			} else {
				result = json;
			}
		} catch (err) {
			error = err.message;
		}
	}
</script>

<div class="test-add-video">
	<h2>Test /api/add-video</h2>
	<div class="form">
		<input
			type="text"
			placeholder="YouTube Channel Link or @handle"
			bind:value={url}
			class="input"
		/>
		<input
			type="text"
			placeholder="Tags (comma separated)"
			bind:value={tags}
			class="input"
		/>
		<input
			type="text"
			placeholder="Country"
			bind:value={country}
			class="input"
		/>
		<select bind:value={level} class="input">
			{#each levels as lvl}
				<option value={lvl.value}>{lvl.label}</option>
			{/each}
		</select>
		<input
			type="text"
			placeholder="Added By (optional UUID)"
			bind:value={added_by}
			class="input"
		/>
		<button on:click={testImport} class="btn">Import</button>
	</div>

	{#if error}
		<div class="error">❌ {error}</div>
	{/if}

	{#if result}
		<pre class="result">{JSON.stringify(result, null, 2)}</pre>
	{/if}
</div>

<style>
	.test-add-video {
		max-width: 480px;
		margin: 3rem auto;
		padding: 2rem;
		background: #fff;
		border-radius: 13px;
		box-shadow: 0 2px 16px #d5e3f8;
	}
	.form {
		display: flex;
		flex-direction: column;
		gap: 1em;
	}
	.input, select {
		padding: 0.7em;
		border: 1.2px solid #e3e8ee;
		border-radius: 8px;
		font-size: 1em;
	}
	.btn {
		padding: 0.7em 1.4em;
		border-radius: 8px;
		background: #2562e9;
		color: #fff;
		font-weight: 700;
		cursor: pointer;
		border: none;
		transition: background 0.15s;
	}
	.btn:hover {
		background: #e93c2f;
	}
	.error {
		color: #b12c2c;
		font-weight: 700;
		margin: 1em 0;
	}
	.result {
		margin-top: 1.5em;
		background: #f6faff;
		padding: 1em;
		border-radius: 10px;
		color: #181818;
		font-size: 0.99em;
	}
</style>
