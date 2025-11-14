// Smooth scroll for in-page anchors
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href !== '#' && href !== '') {
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }
    });
});

/* ---------------------------
   Portfolio lightbox state
---------------------------- */

const lightboxState = {
    elements: null
};

/* ---------------------------
   Portfolio grid & filters
---------------------------- */

document.addEventListener('DOMContentLoaded', () => {
    const gallery = document.getElementById('portfolioGallery');
    if (!gallery) return;

    if (typeof portfolioImages === 'undefined' || !Array.isArray(portfolioImages) || portfolioImages.length === 0) {
        gallery.innerHTML = '<p style="text-align: center; width: 100%; padding: 40px; color: #666;">No portfolio images available.</p>';
        return;
    }

    initPortfolioLightbox();
    initPortfolioFilters(gallery);

    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            location.reload();
        }, 250);
    });
});

function buildPortfolioGrid(gallery, images) {
    gallery.innerHTML = '';

    const numColumns = window.innerWidth > 768 ? 3 : (window.innerWidth > 480 ? 2 : 1);
    const columns = [];

    for (let i = 0; i < numColumns; i++) {
        const column = document.createElement('div');
        column.className = 'portfolio-column';
        gallery.appendChild(column);
        columns.push(column);
    }

    images.forEach((imageData, index) => {
        const item = document.createElement('div');
        item.className = 'portfolio-item';
        item.dataset.index = String(index);
        item.dataset.categories = Array.isArray(imageData.categories) ? imageData.categories.join(',') : '';

        const img = document.createElement('img');
        img.src = imageData.src;
        img.alt = imageData.title || `Portfolio ${index + 1}`;
        img.loading = 'lazy';

        item.appendChild(img);

        item.addEventListener('click', () => {
            openPortfolioLightbox(imageData);
        });

        const columnIndex = index % numColumns;
        columns[columnIndex].appendChild(item);
    });
}

function getSelectedCategoriesFromURL() {
    const params = new URLSearchParams(window.location.search);
    const raw = params.getAll('category');
    const result = [];

    raw.forEach(value => {
        value.split(',').forEach(part => {
            const cleaned = part.trim();
            if (cleaned) {
                result.push(cleaned);
            }
        });
    });

    return Array.from(new Set(result));
}

function initPortfolioFilters(gallery) {
    const filterContainer = document.getElementById('portfolioFilters');
    const allImagesData = portfolioImages.slice();

    if (!filterContainer) {
        buildPortfolioGrid(gallery, allImagesData);
        return;
    }

    const buttons = Array.from(filterContainer.querySelectorAll('[data-category]'));
    if (!buttons.length) {
        buildPortfolioGrid(gallery, allImagesData);
        return;
    }

    const knownCategories = new Set(buttons.map(btn => btn.dataset.category));

    let activeCategories = getSelectedCategoriesFromURL()
        .filter(cat => knownCategories.has(cat));

    if (!activeCategories.length) {
        activeCategories = ['Tout voir'];
    }

    function updateButtonStates() {
        buttons.forEach(btn => {
            const cat = btn.dataset.category;
            if (activeCategories.includes(cat)) {
                btn.classList.add('is-active');
            } else {
                btn.classList.remove('is-active');
            }
        });
    }

    function applyFilters() {
        const isAll = !activeCategories.length || activeCategories.includes('Tout voir');

        let filtered = allImagesData;
        if (!isAll) {
            filtered = allImagesData.filter(image => {
                const itemCats = Array.isArray(image.categories) ? image.categories : [];
                return itemCats.some(cat => activeCategories.includes(cat));
            });
        }

        buildPortfolioGrid(gallery, filtered);
    }

    updateButtonStates();
    applyFilters();

    filterContainer.addEventListener('click', event => {
        const btn = event.target.closest('[data-category]');
        if (!btn) return;

        const cat = btn.dataset.category;
        if (!cat) return;

        if (cat === 'Tout voir') {
            activeCategories = ['Tout voir'];
        } else {
            const index = activeCategories.indexOf(cat);
            if (index === -1) {
                activeCategories.push(cat);
            } else {
                activeCategories.splice(index, 1);
            }

            activeCategories = activeCategories.filter(c => c !== 'Tout voir');

            if (!activeCategories.length) {
                activeCategories = ['Tout voir'];
            }
        }

        const params = new URLSearchParams(window.location.search);
        params.delete('category');

        if (!activeCategories.includes('Tout voir')) {
            activeCategories.forEach(catValue => {
                params.append('category', catValue);
            });
        }

        const newUrl = `${window.location.pathname}?${params.toString()}`;
        window.history.replaceState({}, '', newUrl);

        updateButtonStates();
        applyFilters();
    });
}

/* ---------------------------
   Portfolio lightbox overlay
---------------------------- */

function initPortfolioLightbox() {
    const lightbox = document.getElementById('portfolioLightbox');
    if (!lightbox) return;

    const imgEl = lightbox.querySelector('[data-lightbox-image]');
    const titleEl = lightbox.querySelector('[data-lightbox-title]');
    const descEl = lightbox.querySelector('[data-lightbox-description]');
    const catsEl = lightbox.querySelector('[data-lightbox-categories]');
    const closeBtn = lightbox.querySelector('.lightbox-close');

    if (!imgEl || !titleEl || !descEl || !catsEl || !closeBtn) return;

    lightboxState.elements = {
        lightbox,
        imgEl,
        titleEl,
        descEl,
        catsEl
    };

    function close() {
        lightbox.classList.remove('is-visible');
        document.body.classList.remove('no-scroll');
        lightbox.setAttribute('aria-hidden', 'true');
    }

    closeBtn.addEventListener('click', () => close());

    lightbox.addEventListener('click', event => {
        if (event.target === lightbox || event.target.classList.contains('lightbox-backdrop')) {
            close();
        }
    });

    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && lightbox.classList.contains('is-visible')) {
            close();
        }
    });
}

function openPortfolioLightbox(imageData) {
    if (!lightboxState.elements) {
        initPortfolioLightbox();
    }
    if (!lightboxState.elements) return;

    const { lightbox, imgEl, titleEl, descEl, catsEl } = lightboxState.elements;

    imgEl.src = imageData.src;
    imgEl.alt = imageData.title || '';
    titleEl.textContent = imageData.title || '';
    descEl.textContent = imageData.description || '';

    const cats = Array.isArray(imageData.categories) ? imageData.categories : [];
    if (cats.length) {
        catsEl.textContent = 'Tags: ' + cats.join(' / ');
    } else {
        catsEl.textContent = '';
    }

    lightbox.classList.add('is-visible');
    document.body.classList.add('no-scroll');
    lightbox.setAttribute('aria-hidden', 'false');
}
