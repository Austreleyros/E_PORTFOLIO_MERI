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
    // 7. Research Works photo sliders
    // Drag with your finger or mouse: the photo moves with you, then glides into place.
    // The arrow buttons glide to the previous/next photo.
    document.querySelectorAll('.research-slider').forEach(slider => {
        const track = slider.querySelector('.slider-track');
        const prevBtn = slider.querySelector('.slider-btn.prev');
        const nextBtn = slider.querySelector('.slider-btn.next');
        const counter = slider.querySelector('.slider-counter');
        const title = slider.closest('.research-item').querySelector('h4').textContent;

        let index = 0;
        const visibleSlides = () => [...track.querySelectorAll('.slide')].filter(s => !s.classList.contains('missing'));

        const update = () => {
            const total = visibleSlides().length;
            index = Math.max(0, Math.min(index, total - 1));
            slider.classList.toggle('is-empty', total === 0);
            slider.classList.toggle('is-single', total === 1);
            counter.textContent = total ? `${index + 1} / ${total}` : '';
            prevBtn.disabled = index <= 0;
            nextBtn.disabled = index >= total - 1;
        };

        // Move the strip of photos (offsetPx is how far the finger has dragged)
        const setPosition = (offsetPx = 0) => {
            track.style.transform = `translateX(calc(${-index * 100}% + ${offsetPx}px))`;
        };

        const goTo = (i) => {
            index = i;
            update();
            setPosition(0); // CSS transition makes this glide smoothly
        };

        prevBtn.addEventListener('click', () => goTo(index - 1));
        nextBtn.addEventListener('click', () => goTo(index + 1));

        // Skip any photo that hasn't been uploaded yet
        track.querySelectorAll('img').forEach(img => {
            const markMissing = () => {
                img.closest('.slide').classList.add('missing');
                goTo(index);
            };
            img.addEventListener('error', markMissing);
            if (img.complete && img.naturalWidth === 0) markMissing();
        });

        // ---- Dragging (works for touch, pen, and mouse) ----
        let pointerId = null, startX = 0, startY = 0, dx = 0;
        let direction = null; // 'x' = sliding photos, 'y' = scrolling the page
        let moved = false;

        track.addEventListener('pointerdown', (e) => {
            if (e.pointerType === 'mouse' && e.button !== 0) return;
            pointerId = e.pointerId;
            startX = e.clientX;
            startY = e.clientY;
            dx = 0;
            direction = null;
            moved = false;
        });

        track.addEventListener('pointermove', (e) => {
            if (e.pointerId !== pointerId) return;
            const moveX = e.clientX - startX;
            const moveY = e.clientY - startY;

            // Decide once whether this is a sideways slide or an up/down page scroll
            if (!direction) {
                if (Math.abs(moveX) < 6 && Math.abs(moveY) < 6) return;
                direction = Math.abs(moveX) > Math.abs(moveY) ? 'x' : 'y';
                if (direction === 'x') {
                    track.setPointerCapture(e.pointerId);
                    track.classList.add('dragging');
                    moved = true;
                }
            }
            if (direction !== 'x') return;

            dx = moveX;
            const total = visibleSlides().length;
            // Gentle stretch at the first/last photo instead of a hard stop
            if ((index === 0 && dx > 0) || (index >= total - 1 && dx < 0)) dx *= 0.35;
            setPosition(dx);
        });

        const endDrag = (e) => {
            if (e.pointerId !== pointerId) return;
            pointerId = null;
            if (direction !== 'x') return;
            track.classList.remove('dragging');
            const width = slider.clientWidth || 1;
            // Drag past 15% of the width to change photo
            if (dx < -width * 0.15) goTo(index + 1);
            else if (dx > width * 0.15) goTo(index - 1);
            else goTo(index); // not far enough: glide back
            direction = null;
        };
        track.addEventListener('pointerup', endDrag);
        track.addEventListener('pointercancel', endDrag);

        // Tap/click a photo (without dragging) to open it full size
        track.addEventListener('click', () => {
            if (moved) { moved = false; return; }
            const slides = visibleSlides();
            const img = slides[index] && slides[index].querySelector('img');
            if (!img) return;
            openLightbox(img.currentSrc || img.src, img.alt, `${title} • Photo ${index + 1} of ${slides.length}`);
        });

        // Prevent the browser's own image dragging
        track.addEventListener('dragstart', (e) => e.preventDefault());

        goTo(0);
    });

    // 8. Smooth scrolling for the menu links
    // (animated by the script, so it stays smooth even if the computer has animations turned off)
    let scrollAnim = null;
    const rootStyle = document.documentElement.style;
    const easeInOutCubic = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    const stopScrollAnim = () => {
        cancelAnimationFrame(scrollAnim);
        rootStyle.scrollBehavior = '';
    };

    const smoothScrollTo = (targetY) => {
        stopScrollAnim();
        const startY = window.scrollY;
        const distance = targetY - startY;
        const duration = Math.min(1100, Math.max(500, Math.abs(distance) * 0.5)); // longer trips take a bit longer
        let startTime = null;
        rootStyle.scrollBehavior = 'auto'; // let the script control every frame

        const step = (now) => {
            if (startTime === null) startTime = now;
            const progress = Math.min((now - startTime) / duration, 1);
            window.scrollTo(0, startY + distance * easeInOutCubic(progress));
            if (progress < 1) {
                scrollAnim = requestAnimationFrame(step);
            } else {
                rootStyle.scrollBehavior = '';
            }
        };
        scrollAnim = requestAnimationFrame(step);
    };

    // If the visitor starts scrolling on their own, stop the animation
    ['wheel', 'touchstart', 'keydown'].forEach(evt => {
        window.addEventListener(evt, stopScrollAnim, { passive: true });
    });

    // Position of a section on the page (ignores the fade-in animation offset)
    const pageTop = (el) => {
        let y = 0;
        while (el) { y += el.offsetTop; el = el.offsetParent; }
        return y;
    };

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const id = link.getAttribute('href');
            const target = document.querySelector(id);
            if (!target) return;
            e.preventDefault();
            smoothScrollTo(pageTop(target));
            history.pushState(null, '', id);
        });
    });
});
