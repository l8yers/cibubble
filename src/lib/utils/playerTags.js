// $lib/utils/playerTags.js

export function getInitialTagState() {
	return {
		showTagModal: false,
		newTag: '',
		tagAdding: false,
		tagAddError: '',
		tagSuccess: false,
		tagSuccessTimeout: null,
		confirmStep: false,
		allTags: [],
		tagCloudLoading: false
	};
}

export function openTagModal(tagState, loadTagCloud) {
	tagState.showTagModal = true;
	tagState.tagAddError = '';
	tagState.newTag = '';
	tagState.confirmStep = false;
	loadTagCloud();
}

export function closeTagModal(tagState) {
	tagState.showTagModal = false;
	tagState.confirmStep = false;
	tagState.newTag = '';
	tagState.tagAddError = '';
	tagState.tagAdding = false;
}

export function tryAddTag(tagState, tagArray) {
	tagState.tagAddError = '';
	let tag = tagState.newTag.trim().toLowerCase();
	if (!tag || tag.length < 2 || tag.length > 32) {
		tagState.tagAddError = 'Tags must be 2–32 characters.';
		return;
	}
	if (tagArray.some((t) => t === tag)) {
		tagState.tagAddError = 'That tag already exists.';
		return;
	}
	tagState.confirmStep = true;
}

export function selectCloudTag(tagState, tag) {
	tagState.newTag = tag;
	tagState.tagAddError = '';
}

export function setNewTagValue(tagState, val) {
	tagState.newTag = val;
	tagState.tagAddError = '';
}
