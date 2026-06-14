class FullscreenImageViewer {
	constructor(containerSelector = '.prose') {
		this.container = document.querySelector(containerSelector);
		this.overlay = null;
		this.currentImg = null;
		this.scale = 1;
		this.posX = 0;
		this.posY = 0;
		this.startDist = 0;
		this.lastScale = 1;
		this.isDragging = false;
		this.startX = 0;
		this.startY = 0;

		this.init();
	}

	init() {
		if (!this.container) return;

		// Add click listener to all images in the container
		this.container.addEventListener('click', (e) => {
			if (e.target.tagName === 'IMG') {
				e.preventDefault();
				this.openFullscreen(e.target);
			}
		});
	}

	openFullscreen(img) {
		// Create overlay
		this.overlay = document.createElement('div');
		this.overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.95);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: zoom-out;
      touch-action: none;
    `;

		// Clone the image
		this.currentImg = document.createElement('img');
		this.currentImg.src = img.src;
		this.currentImg.alt = img.alt;
		this.currentImg.style.cssText = `
      max-width: 90vw;
      max-height: 90vh;
      object-fit: contain;
      cursor: grab;
      user-select: none;
      -webkit-user-select: none;
      transform-origin: center center;
    `;

		this.overlay.appendChild(this.currentImg);
		document.body.appendChild(this.overlay);
		document.body.style.overflow = 'hidden';

		// Reset transform values
		this.scale = 1;
		this.posX = 0;
		this.posY = 0;
		this.lastScale = 1;

		// Add event listeners
		this.overlay.addEventListener('click', (e) => {
			if (e.target === this.overlay) {
				this.close();
			}
		});

		// Touch events for pinch zoom
		this.currentImg.addEventListener('touchstart', this.handleTouchStart.bind(this));
		this.currentImg.addEventListener('touchmove', this.handleTouchMove.bind(this));
		this.currentImg.addEventListener('touchend', this.handleTouchEnd.bind(this));

		// Mouse events for desktop dragging
		this.currentImg.addEventListener('mousedown', this.handleMouseDown.bind(this));
		document.addEventListener('mousemove', this.handleMouseMove.bind(this));
		document.addEventListener('mouseup', this.handleMouseUp.bind(this));

		// Prevent context menu
		this.currentImg.addEventListener('contextmenu', (e) => e.preventDefault());
	}

	handleTouchStart(e) {
		if (e.touches.length === 1) {
			// Single touch - prepare for drag
			this.isDragging = true;
			this.startX = e.touches[0].clientX - this.posX;
			this.startY = e.touches[0].clientY - this.posY;
		} else if (e.touches.length === 2) {
			// Two touches - pinch zoom
			this.isDragging = false;
			const dist = this.getDistance(e.touches[0], e.touches[1]);
			this.startDist = dist;
			this.lastScale = this.scale;
		}
	}

	handleTouchMove(e) {
		e.preventDefault();

		if (e.touches.length === 1 && this.isDragging && this.scale > 1) {
			// Single touch drag (only when zoomed)
			this.posX = e.touches[0].clientX - this.startX;
			this.posY = e.touches[0].clientY - this.startY;
			this.updateTransform();
		} else if (e.touches.length === 2) {
			// Pinch zoom
			const dist = this.getDistance(e.touches[0], e.touches[1]);
			const scaleDiff = dist / this.startDist;
			this.scale = Math.min(Math.max(1, this.lastScale * scaleDiff), 4);

			// Reset position when zooming out to 1
			if (this.scale === 1) {
				this.posX = 0;
				this.posY = 0;
			}

			this.updateTransform();
		}
	}

	handleTouchEnd(e) {
		if (e.touches.length === 0) {
			this.isDragging = false;

			// If scale is 1 and this was a tap, close the viewer
			if (this.scale === 1) {
				this.close();
			}
		} else if (e.touches.length === 1) {
			// One finger left, reset drag
			this.isDragging = true;
			this.startX = e.touches[0].clientX - this.posX;
			this.startY = e.touches[0].clientY - this.posY;
		}
	}

	handleMouseDown(e) {
		if (this.scale > 1) {
			e.preventDefault();
			this.isDragging = true;
			this.startX = e.clientX - this.posX;
			this.startY = e.clientY - this.posY;
			this.currentImg.style.cursor = 'grabbing';
		}
	}

	handleMouseMove(e) {
		if (this.isDragging && this.scale > 1) {
			this.posX = e.clientX - this.startX;
			this.posY = e.clientY - this.startY;
			this.updateTransform();
		}
	}

	handleMouseUp() {
		this.isDragging = false;
		if (this.currentImg) {
			this.currentImg.style.cursor = this.scale > 1 ? 'grab' : 'zoom-out';
		}
	}

	getDistance(touch1, touch2) {
		const dx = touch2.clientX - touch1.clientX;
		const dy = touch2.clientY - touch1.clientY;
		return Math.sqrt(dx * dx + dy * dy);
	}

	updateTransform() {
		if (this.currentImg) {
			this.currentImg.style.transform = `translate(${this.posX}px, ${this.posY}px) scale(${this.scale})`;
		}
	}

	close() {
		if (this.overlay) {
			document.body.removeChild(this.overlay);
			document.body.style.overflow = '';
			this.overlay = null;
			this.currentImg = null;
			this.scale = 1;
			this.posX = 0;
			this.posY = 0;
		}
	}
}

// Initialize the viewer
document.addEventListener('DOMContentLoaded', () => {
	new FullscreenImageViewer('.prose');
});


document.addEventListener("DOMContentLoaded", () => {

	class ImageExpander {
		constructor() {
			this.desktopBreakpoint = 768;
			this.images = [];
			this.currentlyExpanded = null;
			this.prevDesktopState = this.isDesktop();

			this.navbarHeight = 80; // adjust as needed

			this.scrollTimer = null;  
			this.scrollPauseDuration = 200; 

			this.cooldown = false;
			this.cooldownDuration = 300;

			this.init();
			this.attachScrollHandler();
			this.attachResizeHandler();
		}

		isDesktop() {
			return window.innerWidth > this.desktopBreakpoint;
		}

		init() {
			if (!this.isDesktop()) return;

			this.images = Array.from(document.querySelectorAll(".prose img")).filter(
                img => !img.closest('.not-prose')
            );
			this.initializeAllImages();
		}

		/* ------------------------------
		     IMAGE INITIALIZATION
		------------------------------*/
		initializeImage(img, attempt = 0) {
			if (!img.naturalWidth || !img.naturalHeight) return false;

			const maxAttempts = 6;

			const width = img.offsetWidth || img.clientWidth;
			if (width === 0 && attempt < maxAttempts) {
				requestAnimationFrame(() => this.initializeImage(img, attempt + 1));
				return false;
			}

			const ratio = img.naturalHeight / img.naturalWidth;
			const displayHeight = width * ratio;
			const compressedHeight = displayHeight * 0.4 + 100;

			img.dataset.displayHeight = displayHeight;
			img.dataset.compressedHeight = compressedHeight;

			img.style.height = `${compressedHeight}px`;
			img.style.width = "100%";
			img.style.objectFit = "cover";
			img.style.transition = "height 0.5s ease";

			return true;
		}

		initializeAllImages() {
			for (const img of this.images) {
				if (img.complete && img.naturalHeight) {
					this.initializeImage(img);
				} else {
					img.addEventListener("load", () => this.initializeImage(img));
				}
			}
		}

		/* ------------------------------
		       SCROLL HANDLER
		------------------------------*/
		attachScrollHandler() {
			document.addEventListener("scroll", () => {
				clearTimeout(this.scrollTimer);

				this.scrollTimer = setTimeout(() => {
					this.evaluate();
				}, this.scrollPauseDuration);

				this.collapseIfPastNavbar();
			}, { passive: true });
		}

		/* ------------------------------
		      NAVBAR COLLAPSE LOGIC
		------------------------------*/
		collapseIfPastNavbar() {
			if (!this.currentlyExpanded) return;

			const rect = this.currentlyExpanded.getBoundingClientRect();
			if (rect.bottom < this.navbarHeight) {
				this.compressImage(this.currentlyExpanded);
				this.currentlyExpanded = null;
			}
		}

		/* ------------------------------
		        EXPANSION ENGINE
		------------------------------*/
		evaluate() {
			if (this.cooldown || !this.isDesktop()) return;

			const viewportHeight = window.innerHeight;
			const focusMin = viewportHeight * 0.3;
			const focusMax = viewportHeight * 0.7;

			let best = null;
			let bestScore = 0;

			for (const img of this.images) {
				const rect = img.getBoundingClientRect();
				if (rect.bottom < 0 || rect.top > viewportHeight) continue;

				const center = rect.top + rect.height / 2;

				// Must be inside focus band
				if (center < focusMin || center > focusMax) continue;

				// Score = visible area
				const visibleArea =
					Math.min(rect.bottom, viewportHeight) -
					Math.max(rect.top, 0);

				if (visibleArea > bestScore) {
					bestScore = visibleArea;
					best = img;
				}
			}

			if (!best) {
				this.compressCurrent();
				this.currentlyExpanded = null;
				return;
			}

			if (best !== this.currentlyExpanded) {
				this.compressCurrent();
				this.expandImage(best);
				this.currentlyExpanded = best;
				this.applyCooldown();
			}
		}

		applyCooldown() {
			this.cooldown = true;
			setTimeout(() => { this.cooldown = false; }, this.cooldownDuration);
		}

		/* ------------------------------
		         EXPAND / COMPRESS
		------------------------------*/
		expandImage(img) {
			const maxHeight = window.innerHeight * 0.8;
			const displayHeight = Math.min(parseFloat(img.dataset.displayHeight), maxHeight);
			img.style.height = `${displayHeight}px`;
		}

		compressImage(img) {
			const h = parseFloat(img.dataset.compressedHeight);
			img.style.height = `${h}px`;
		}

		compressCurrent() {
			if (this.currentlyExpanded) {
				this.compressImage(this.currentlyExpanded);
			}
		}

		/* ------------------------------
		        RESPONSIVE LOGIC
		------------------------------*/
		resetImages() {
			for (const img of this.images) {
				img.style.height = "";
				img.style.transition = "";
				img.style.width = "";
			}
		}

		reactivate() {
			this.resetImages();
			this.currentlyExpanded = null;
			this.init();
		}

		attachResizeHandler() {
			let resizeTimer;

			window.addEventListener("resize", () => {
				clearTimeout(resizeTimer);
				resizeTimer = setTimeout(() => {

					const nowDesktop = this.isDesktop();

					if (nowDesktop !== this.prevDesktopState) {
						this.prevDesktopState = nowDesktop;

						if (nowDesktop) {
							this.reactivate();
						} else {
							this.resetImages();
						}
						return;
					}

					// Recompute heights smoothly
					if (nowDesktop) {
						for (const img of this.images) {
							const width = img.offsetWidth || img.clientWidth;
							if (!width) continue;

							const ratio = img.naturalHeight / img.naturalWidth;
							const displayHeight = width * ratio;
							const compressedHeight = displayHeight * 0.4 + 100;

							img.dataset.displayHeight = displayHeight;
							img.dataset.compressedHeight = compressedHeight;

							if (img === this.currentlyExpanded) {
								img.style.height = `${displayHeight}px`;
							} else {
								img.style.height = `${compressedHeight}px`;
							}
						}
					}

				}, 200);
			});
		}
	}

	new ImageExpander();

});
