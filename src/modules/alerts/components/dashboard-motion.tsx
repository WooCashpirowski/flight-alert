'use client';

import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(useGSAP, ScrollTrigger);

export function DashboardMotion() {
    useGSAP(() => {
        const reducedMotion = window.matchMedia(
            '(prefers-reduced-motion: reduce)',
        ).matches;
        if (reducedMotion) return;

        const context = gsap.matchMedia();

        context.add('(min-width: 980px)', () => {
            const intro = document.querySelector<HTMLElement>(
                '[data-dashboard-intro]',
            );
            const feed = document.querySelector<HTMLElement>(
                '[data-dashboard-feed]',
            );
            if (!intro || !feed) return;

            ScrollTrigger.create({
                trigger: feed,
                start: 'top 112px',
                end: 'bottom bottom-=96',
                pin: intro,
                pinSpacing: false,
                invalidateOnRefresh: true,
            });
        });

        context.add('(min-width: 980px)', () => {
            const cards = gsap.utils.toArray<HTMLElement>('[data-alert-card]');
            cards.forEach((card, index) => {
                gsap.fromTo(
                    card,
                    { y: 30, opacity: 0, scale: 0.985 },
                    {
                        y: 0,
                        opacity: 1,
                        scale: 1,
                        duration: 0.8,
                        delay: Math.min(index * 0.06, 0.24),
                        ease: 'power3.out',
                        scrollTrigger: {
                            trigger: card,
                            start: 'top 92%',
                            once: true,
                        },
                    },
                );
            });
        });

        return () => context.revert();
    });

    return null;
}
