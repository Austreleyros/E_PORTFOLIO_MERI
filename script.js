document.addEventListener("DOMContentLoaded", () => {
    // 1. Sidebar Toggle Logic
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('main-content');

    menuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('hidden');
        sidebar.classList.toggle('visible'); 
        mainContent.classList.toggle('expanded');
    });

    // 2. Active Link Highlighting on Scroll
    const sections = document.querySelectorAll('.content-section');
    const navLinks = document.querySelectorAll('.nav-link');

    window.addEventListener('scroll', () => {
        let current = '';

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            
            if (pageYOffset >= (sectionTop - 150)) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href').includes(current) && current !== '') {
                link.classList.add('active');
            }
        });
    });

    // 3. Smooth Scroll Reveal Animation
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.15 });

    sections.forEach(section => {
        section.classList.add('scroll-reveal');
        revealObserver.observe(section);
    });

    // 4. Full-Size Photo Viewer (created here, so index.html doesn't need changes)
    const lightbox = document.createElement('div');
    lightbox.className = 'lightbox';
    lightbox.setAttribute('role', 'dialog');
    lightbox.setAttribute('aria-modal', 'true');
    lightbox.setAttribute('aria-label', 'Photo viewer');
    lightbox.innerHTML = `
        <button type="button" class="lightbox-close" aria-label="Close photo viewer">&times;</button>
        <figure class="lightbox-figure">
            <img class="lightbox-img" alt="">
            <figcaption class="lightbox-caption"></figcaption>
        </figure>
    `;
    document.body.appendChild(lightbox);

    const lightboxImg = lightbox.querySelector('.lightbox-img');
    const lightboxCaption = lightbox.querySelector('.lightbox-caption');
    const lightboxClose = lightbox.querySelector('.lightbox-close');
    let lastFocused = null;

    const openLightbox = (src, alt, caption) => {
        lastFocused = document.activeElement;
        lightboxImg.src = src;
        lightboxImg.alt = alt;
        lightboxCaption.textContent = caption;
        lightbox.classList.add('open');
        document.body.classList.add('lightbox-active');
        setTimeout(() => lightboxClose.focus(), 50); // wait until the viewer is visible
    };

    const closeLightbox = () => {
        lightbox.classList.remove('open');
        document.body.classList.remove('lightbox-active');
        if (lastFocused) lastFocused.focus();
    };

    lightboxClose.addEventListener('click', closeLightbox);

    // Tap the dark background (outside the photo) to close
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox || e.target.classList.contains('lightbox-figure')) closeLightbox();
    });

    // Press Esc to close
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && lightbox.classList.contains('open')) closeLightbox();
    });

    // 5. Seminar Flip Cards (tap/click to show the photo)
    const flipCards = document.querySelectorAll('.flip-card');

    flipCards.forEach(card => {
        const back = card.querySelector('.flip-card-back');
        const img = back.querySelector('img');
        const title = card.querySelector('.flip-card-front h3').textContent;
        const detail = card.querySelector('.flip-card-front p').textContent;

        // Add the "View full size" button to the photo side
        const viewBtn = document.createElement('button');
        viewBtn.type = 'button';
        viewBtn.className = 'view-full-btn';
        viewBtn.textContent = 'View full size';
        viewBtn.tabIndex = -1; // can't be tabbed to until the card is flipped
        back.appendChild(viewBtn);

        viewBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // open the viewer without flipping the card back
            openLightbox(img.currentSrc || img.src, img.alt, `${title} • ${detail}`);
        });

        // Stop Enter/Space on the button from also flipping the card
        viewBtn.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') e.stopPropagation();
        });

        const flip = () => {
            const isFlipped = card.classList.toggle('flipped');
            card.setAttribute('aria-pressed', isFlipped);
            viewBtn.tabIndex = isFlipped ? 0 : -1;
        };

        card.addEventListener('click', flip);

        // Lets keyboard users flip with Enter or Space
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                flip();
            }
        });
    });

    // 6. If a photo is missing or the file name is wrong, show "Photo coming soon"
    document.querySelectorAll('.flip-card-back img').forEach(img => {
        const markMissing = () => img.closest('.flip-card-back').classList.add('no-photo');

        img.addEventListener('error', markMissing);
        if (img.complete && img.naturalWidth === 0) markMissing();
    });

    // 7. Research Works photo sliders (swipe on phones, drag or arrows on laptops)
    document.querySelectorAll('.research-slider').forEach(slider => {
        const track = slider.querySelector('.slider-track');
        const prevBtn = slider.querySelector('.slider-btn.prev');
        const nextBtn = slider.querySelector('.slider-btn.next');
        const counter = slider.querySelector('.slider-counter');
        const title = slider.closest('.research-item').querySelector('h4').textContent;

        const visibleSlides = () => [...track.querySelectorAll('.slide')].filter(s => !s.classList.contains('missing'));
        const currentIndex = () => track.clientWidth ? Math.round(track.scrollLeft / track.clientWidth) : 0;

        const update = () => {
            const total = visibleSlides().length;
            const i = Math.min(currentIndex(), Math.max(total - 1, 0));
            slider.classList.toggle('is-empty', total === 0);
            slider.classList.toggle('is-single', total === 1);
            counter.textContent = total ? `${i + 1} / ${total}` : '';
            prevBtn.disabled = i <= 0;
            nextBtn.disabled = i >= total - 1;
        };

        const goTo = (i) => {
            const total = visibleSlides().length;
            const target = Math.max(0, Math.min(i, total - 1));
            track.scrollTo({ left: target * track.clientWidth, behavior: 'smooth' });
        };

        prevBtn.addEventListener('click', () => goTo(currentIndex() - 1));
        nextBtn.addEventListener('click', () => goTo(currentIndex() + 1));
        track.addEventListener('scroll', update, { passive: true });
        window.addEventListener('resize', update);

        // Hide any photo that hasn't been uploaded yet
        track.querySelectorAll('img').forEach(img => {
            const markMissing = () => {
                img.closest('.slide').classList.add('missing');
                update();
            };
            img.addEventListener('error', markMissing);
            if (img.complete && img.naturalWidth === 0) markMissing();
        });

        // Mouse drag: the photo follows the mouse, then snaps to the nearest photo
        // (phones and touchpads already swipe naturally)
        let dragging = false, moved = false, startX = 0, startScroll = 0;

        track.addEventListener('pointerdown', (e) => {
            if (e.pointerType !== 'mouse' || e.button !== 0) return;
            dragging = true;
            moved = false;
            startX = e.clientX;
            startScroll = track.scrollLeft;
            track.classList.add('dragging');
            track.setPointerCapture(e.pointerId);
        });

        track.addEventListener('pointermove', (e) => {
            if (!dragging) return;
            const dx = e.clientX - startX;
            if (Math.abs(dx) > 5) moved = true;
            track.scrollLeft = startScroll - dx;
        });

        const endDrag = () => {
            if (!dragging) return;
            dragging = false;
            const width = track.clientWidth || 1;
            const startIndex = Math.round(startScroll / width);
            const pulled = (track.scrollLeft - startScroll) / width;
            // A short pull (20% of the width) is enough to move to the next photo
            let target = startIndex;
            if (pulled > 0.2) target = startIndex + 1;
            if (pulled < -0.2) target = startIndex - 1;
            goTo(target);
            setTimeout(() => track.classList.remove('dragging'), 450);
        };
        track.addEventListener('pointerup', endDrag);
        track.addEventListener('pointercancel', endDrag);

        // Tap/click a photo (without dragging) to open it full size
        track.addEventListener('click', () => {
            if (moved) { moved = false; return; }
            const slides = visibleSlides();
            const i = Math.min(currentIndex(), slides.length - 1);
            const img = slides[i] && slides[i].querySelector('img');
            if (!img) return;
            openLightbox(img.currentSrc || img.src, img.alt, `${title} • Photo ${i + 1} of ${slides.length}`);
        });

        update();
    });
});
