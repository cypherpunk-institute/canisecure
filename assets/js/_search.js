class Search {

	constructor() {

		this.data = null;
		this.term = null;
		this.results = null;
		this.input = document.querySelector('.canisecure-search-input');
		this.form = document.querySelector('.canisecure-search');
		this.origin = document.location.href;

		if(this.input != null) {

			this.input.addEventListener('focus', e => {
				this.loadJSONFile();
			});

			this.input.addEventListener('input', e => {

				if(!this.data) {
					this.loadJSONFile();
				}

				this.term = e.currentTarget.value;
				this.query();
			});

			this.input.addEventListener('blur', e => {
				if(this.data && this.term && this.results.length > 0) {
					this.updateURL();
				}
			});

			const url = new URL(document.location.href);
			if(url.searchParams.get('s') != null) {

				if(!this.data) {
					this.loadJSONFile();
				}
				this.input.value = url.searchParams.get('s');
				this.term = url.searchParams.get('s');
				this.query();
			}


		}
	}

	loadJSONFile() {

		if(!this.data) {
			fetch('/assets/js/guides.json')
			.then(response => {
				return response.json();
			})
			.then(json => {
				this.data = json;
				if(this.term) {
					this.query();
				}
			})
			.catch(error => {
				console.log(error);
			});
		}
	}

	query() {

		if(!this.data) {
			this.form.classList.add('canisecure-search--loading');
		}

		if(!this.term) {
			this.form.classList.remove('canisecure-search--loading');
			this.removeResultsMessage();
			this.removeResultsContainer();
			history.pushState({id:'search'}, 'search', `${this.origin}`);
		}

		if(this.data && this.term) {

			const previousResultsLength = this.results ? this.results.length : -1;
			this.results = [];
			if(this.term.includes('+')) {

				let terms = this.term.split('+');
				terms.forEach(item => {
					if(item != '') {
						let itemResults = this.data.filter(guide => this.results.filter(result => result.title == guide.title).length == 0 && (guide.title.toLowerCase().includes(item.toLowerCase().trim()) || guide.keywords.includes(item.toLowerCase().trim())));
						this.results = [...this.results, ...itemResults];
					}
				});
			}
			else {
				this.results = this.data.filter(guide => guide.title.toLowerCase().includes(this.term.toLowerCase()) || guide.keywords.includes(this.term.toLowerCase()));
			}

			this.form.classList.remove('canisecure-search--loading');

			if(this.results.length != 0 && this.results.length != previousResultsLength) {
				this.buildResultsMessage(this.results.length);
			}

			if(this.results.length == 0) {
				this.removeResultsContainer();
				this.buildResultsMessage(this.results.length);
			}
			else {
				this.buildResultsContainer();
				this.buildResults();
				this.updateTitle();
			}
		}
	}

	removeResultsMessage() {

		let searchResultsMessage = document.querySelector('[role=search] form .canisecure-search-empty');
		if(searchResultsMessage != null) {
			searchResultsMessage.remove();
		}
	}

	buildResultsMessage(n) {

		let searchResultsMessage = document.querySelector('[role=search] form .canisecure-search-empty');
		if(searchResultsMessage == null) {
			let noResult = document.createElement('p');
			noResult.classList.add('canisecure-search-empty');
			searchResultsMessage = document.querySelector('[role=search] form').appendChild(noResult);
		}
		let message = '';
		if(n == 0) {
			message = 'No results found.';
			message += ' Why not <a href="https://github.com/krakensecuritylabs/canisecure/issues?utf8=✓&q=is%3Aissue+is%3Aopen+'+encodeURIComponent(this.term)+'">suggest this guide to be added?</a>';
		} else if (n == 1) {
			message = '1 result found.';
		} else {
			message = n + ' results found.';
		}
		searchResultsMessage.innerHTML = message;
	}

	buildResultsContainer() {

		if(document.querySelector('[role=main] .canisecure-search-results') == null) {
			let container = document.createElement('div');
			container.classList.add('canisecure-search-results');
			container.id = 'canisecure-search-results';
			document.querySelector('[role=main]').prepend(container);
		}
	}

	removeResultsContainer() {

		if(document.querySelector('[role=main] .canisecure-search-results') != null) {
			document.querySelector('[role=main] .canisecure-search-results').remove();
		}
	}

	buildResults() {

		const container = document.querySelector('[role=main] .canisecure-search-results');
		container.querySelectorAll('section').forEach(section => {
			if(this.results.filter(guide => guide.url == section.getAttribute('data-url')).length == 0) {
				section.remove();
			}
		});

		this.results.forEach(guide => {
			if(container.querySelector(`[data-url="${guide.url}"]`) == null) {
				let div = document.createElement('div');
				div.innerHTML = `<section class="guide guide--placeholder" data-url="${guide.url}">
						<header class="guide-header">
							<div class="guide-header-column">
								<h1 class="guide-title"><a href="${guide.url}">${guide.title}<span class="guide-permalink" aria-hidden="true">#</span></a></h1>
							</div>
						</header>
						<div class="guide-inside"></div>
						<footer class="guide-footer"></footer>
					</section>`;
				container.appendChild(div.firstChild);

				const guideContainer = container.querySelector(`[data-url="${guide.url}"]`);
				guideContainer.classList.add('loading');

				fetch(guide.url)
				.then(response => {
					return response.text();
				})
				.then(text => {
					let div = document.createElement('div');
					div.innerHTML = text;
					if(guideContainer != null) {
						guideContainer.classList.remove('guide--placeholder');
						guideContainer.classList.remove('loading');
						//guideContainer.querySelector('.guide-inside').innerHTML = div.querySelector('.guide-inside').innerHTML;
						//guideContainer.querySelector('.guide-footer').innerHTML = div.querySelector('.guide-footer').innerHTML;
					}
				})
				.catch(error => {
					console.log(error);
				});
			}
		});
	}

	updateURL() {
		history.pushState({id:'search'}, 'search', `${document.location.origin}/search/?s=${encodeURIComponent(this.term)}`);
	}

	updateTitle() {

		document.querySelector('title').innerHTML = `Can I secure&hellip; "${this.term}" search results`;
	}
}
