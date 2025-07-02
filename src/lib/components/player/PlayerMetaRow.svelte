<script>
	import { onMount, createEventDispatcher } from 'svelte';
	import { CheckCircle, PlusCircle, Clock } from 'lucide-svelte';

	export let video;
	export let utils;
	export let user = null;

	export let isChannelSaved = false;
	export let savingChannel = false;
	export let saveChannelToMyChannels = () => {};

	export let isWatchLater = false;
	export let savingWatchLater = false;
	export let saveToWatchLater = () => {};

	const dispatch = createEventDispatcher();

	let isMobile = false;
	let menuButtonRef;
	let showDropdown = false;

	function toggleDropdown() {
		showDropdown = !showDropdown;
	}
	function closeDropdown() {
		showDropdown = false;
	}
	function handleBlur() {
		setTimeout(() => {
			if (!menuButtonRef?.contains(document.activeElement)) {
				showDropdown = false;
			}
		}, 100);
	}

	onMount(() => {
		const check = () => (isMobile = window.innerWidth <= 800);
		check();
		window.addEventListener('resize', check);
		return () => window.removeEventListener('resize', check);
	});
</script>

<div class="player-meta-row">
	<div class="meta-title-row">
		<div class="player-title">{video.title}</div>
		{#if user && video?.channel_id && !isMobile}
			<div class="add-to-channels-wrapper" style="position: relative;">
				<button
					class="more-btn"
					bind:this={menuButtonRef}
					aria-label="More options"
					on:click={toggleDropdown}
					tabindex="0"
					on:blur={handleBlur}
					type="button"
				>
					<span class="stacked-dots">
						<span class="dot"></span>
						<span class="dot"></span>
						<span class="dot"></span>
					</span>
				</button>
				{#if showDropdown}
					<div class="meta-dropdown-menu">
						<button
							class="dropdown-link"
							type="button"
							on:click={() => { saveChannelToMyChannels(); closeDropdown(); }}
							disabled={isChannelSaved || savingChannel}
						>
							{#if isChannelSaved}
								<CheckCircle class="dropdown-icon in" />
								In My Channels
							{:else}
								<PlusCircle class="dropdown-icon" />
								Add to My Channels
							{/if}
						</button>
						<button
							class="dropdown-link"
							type="button"
							on:click={() => { saveToWatchLater(); closeDropdown(); }}
							disabled={isWatchLater || savingWatchLater}
						>
							{#if isWatchLater}
								<CheckCircle class="dropdown-icon in" />
								In Watch Later
							{:else}
								<Clock class="dropdown-icon" />
								Add to Watch Later
							{/if}
						</button>
					</div>
				{/if}
			</div>
		{/if}
	</div>
	
	<div class="meta-channel-row">
		{#if video?.channel?.name}
			<div class="player-channel">{video.channel.name}</div>
		{/if}
		{#if video.length}
			<span class="player-duration">{utils.formatLength(video.length)}</span>
		{/if}
	</div>

	<div class="player-meta-badges">
		<span
			class="player-diff-badge"
			style="background: {utils.difficultyColor(video.level)};"
		>
			{utils.difficultyLabel(video.level)}
		</span>
		<button
			class="player-tags-badge"
			type="button"
			aria-label="View tags"
			on:click={() => dispatch('openTags')}
		>
			TAGS
		</button>
	</div>
</div>

<style>
/* --- DROPDOWN MENU STYLES --- */
.meta-dropdown-menu {
	position: absolute;
	top: 110%;
	right: 0;
	background: #fff;
	border-radius: 14px;
	box-shadow: 0 4px 16px #2a223310;
	min-width: 240px;
	padding: 0.23em 0;
	z-index: 100;
	display: flex;
	flex-direction: column;
}
.dropdown-link {
	display: flex;
	align-items: center;
	gap: 0.7em;
	width: 100%;
	padding: 0.77em 1.1em 0.77em 1em;
	font-size: 1.04em;
	color: #222943;
	background: none;
	border: none;
	cursor: pointer;
	transition: background 0.12s, color 0.12s;
	text-align: left;
	font-weight: 700;
	border-radius: 10px;
}
.dropdown-link:disabled {
	color: #b0b0b0;
	cursor: default;
}
.dropdown-link:hover:not(:disabled),
.dropdown-link:focus:not(:disabled) {
	background: #f6f4fa;
	color: #e93c2f;
}
.dropdown-icon {
	width: 1.3em;
	height: 1.3em;
	color: #babdcf;
	margin-right: 0.5em;
	vertical-align: middle;
	transition: color 0.13s;
}
.dropdown-icon.in {
	color: #e93c2f;
}
.more-btn {
	background: none;
	border: none;
	padding: 0.20em 0.4em 0.20em 0.4em;
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 50%;
	transition: none;
	position: relative;
}
.more-btn:hover, .more-btn:focus {
	background: none;
}
.stacked-dots {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	height: 16px;
	width: 14px;
	padding: 0;
}
.stacked-dots .dot {
	width: 4px;
	height: 4px;
	background: #181818;
	border-radius: 50%;
	margin: 1px 0;
	display: block;
}
/* --- REST OF YOUR ORIGINAL STYLES (unchanged) --- */
.player-meta-row {
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 0.43em;
	margin-bottom: 0.95em;
	width: 100%;
}
.player-meta-badges {
	display: flex;
	align-items: center;
	gap: 0.9em;
	margin-top: 0.22em;
	margin-bottom: 0;
}
.meta-title-row {
	display: flex;
	flex-direction: row;
	align-items: center;
	width: 100%;
	gap: 1.1em;
}
.player-title {
	font-size: 1.38rem;
	font-weight: 800;
	color: #1a1a1a;
	line-height: 1.21;
	overflow-wrap: anywhere;
	min-width: 0;
	flex: 1 1 auto;
}
.add-to-channels-wrapper {
	display: flex;
	align-items: center;
	flex-shrink: 0;
}
.meta-channel-row {
	display: flex;
	flex-direction: row;
	align-items: center;
	justify-content: space-between;
	width: 100%;
	margin-top: 0.10em;
	margin-bottom: 0.10em;
}
.player-channel {
	font-size: 1.06rem;
	font-weight: 500;
	color: #435576;
	letter-spacing: 0.01em;
	max-width: 300px;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}
.player-duration {
	font-size: 0.99em;
	color: #adadad;
	margin-left: 1em;
	white-space: nowrap;
}
.player-diff-badge,
.player-tags-badge {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	min-width: 38px;
	height: 30px;
	font-size: 0.99em;
	font-weight: 700;
	padding: 0 1em;
	border-radius: 8px;
	color: #fff;
	letter-spacing: 0.01em;
	box-shadow: 0 1px 6px #0001;
	white-space: nowrap;
	text-shadow: 0 1px 3px #0002;
	transition: box-shadow 0.13s;
	border: none;
	cursor: pointer;
	text-transform: uppercase;
}
.player-diff-badge {
	background: var(--diff-color, #bbb);
}
.player-tags-badge {
	background: #e6e6ee;
	color: #2a2a38;
	margin-left: 0.12em;
	transition: background 0.14s;
}
.player-tags-badge:hover,
.player-tags-badge:focus {
	background: #ccccee;
	outline: none;
	color: #1a1a1a;
}
.add-to-channels-wrapper.mobile {
	margin-left: 0.44em;
	margin-top: 0;
}
@media (max-width: 800px) {
	.player-meta-row {
		display: flex;
		flex-direction: column;
		gap: 0.33em;
		width: 100%;
		margin-bottom: 0.72em;
		padding: 0.6em 0.08em;
	}

	.meta-title-row {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.08em;
		width: 100%;
	}

	.player-title {
		font-size: 1.07rem;
		line-height: 1.18;
		margin-bottom: 0.12em;
	}

	.add-to-channels-wrapper {
		width: 100%;
		margin-left: 0;
		margin-top: 0.11em;
		display: flex;
		justify-content: flex-start;
	}

	.add-to-channels-wrapper.mobile {
		width: auto;
		margin-left: 0.42em;
		margin-top: 0;
		justify-content: flex-start;
	}

	.meta-channel-row {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		margin: 0.06em 0;
	}

	.player-channel {
		font-size: 0.97rem;
		max-width: 70vw;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.player-duration {
		font-size: 0.96em;
		margin-left: 0.7em;
		white-space: nowrap;
	}

	.player-meta-badges {
		display: flex;
		align-items: center;
		gap: 0.44em;
		margin-top: 0.07em;
	}

	.player-diff-badge,
	.player-tags-badge {
		font-size: 0.90em;
		height: 26px;
		padding: 0 0.75em;
		border-radius: 7px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}
}
</style>
