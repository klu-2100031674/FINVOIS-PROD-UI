/**
 * BOI report PDF export — html2canvas + jsPDF with DOM clone and
 * data-section-start overflow splitting (ported from Loan-Verifier-Pro).
 */

export async function exportBoiPdf(pdfRef, viewportRef) {
  const root = pdfRef?.current ?? pdfRef;
  const el = viewportRef?.current ?? viewportRef;

  if (!root) {
    throw new Error('PDF root element not found');
  }

  const exportClassTargets = [document.documentElement, document.body, root];
  const prev = el?.style?.getPropertyValue('--pdf-scale');

  try {
    el?.style?.setProperty('--pdf-scale', '1');
    exportClassTargets.forEach((target) => target.classList.add('pdf-export'));
    await new Promise((resolve) => requestAnimationFrame(resolve));

    const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
      import('jspdf'),
      import('html2canvas'),
    ]);

    const clone = root.cloneNode(true);
    clone.style.position = 'absolute';
    clone.style.left = '-100000px';
    clone.style.top = '0';
    clone.style.width = `${root.getBoundingClientRect().width}px`;
    clone.style.setProperty('--pdf-scale', '1');
    document.body.appendChild(clone);

    const A4_H = (297 * 96) / 25.4;
    const PAD_Y = (18 * 96) / 25.4;
    const SAFETY = 8;
    const USABLE = A4_H - 2 * PAD_Y - SAFETY;

    const splitOverflow = (page) => {
      const pageRect = page.getBoundingClientRect();
      const contentBottom = pageRect.top + PAD_Y + USABLE;
      const sections = Array.from(page.querySelectorAll('[data-section-start]'));

      for (const sec of sections) {
        if (sec.closest('.report-page-one-block')) continue;
        const r = sec.getBoundingClientRect();
        if (r.top < pageRect.top || r.top >= pageRect.top + A4_H) continue;
        if (r.bottom <= contentBottom) continue;

        const ancestors = [];
        let n = sec;
        while (n && n !== page) {
          ancestors.unshift(n);
          n = n.parentElement;
        }
        if (ancestors.length === 0) continue;
        if (
          ancestors[0] === page.firstElementChild ||
          ancestors[0].previousElementSibling === null
        ) {
          continue;
        }

        const newPage = page.cloneNode(false);
        const header = page.firstElementChild?.cloneNode(true);
        if (header) newPage.appendChild(header);

        let oldParent = page;
        let newParent = newPage;
        for (let i = 0; i < ancestors.length; i++) {
          const node = ancestors[i];
          if (i === ancestors.length - 1) {
            let cur = node;
            while (cur) {
              const sibling = cur.nextElementSibling;
              newParent.appendChild(cur);
              cur = sibling;
            }
          } else {
            const wrap = node.cloneNode(false);
            newParent.appendChild(wrap);
            newParent = wrap;
            oldParent = node;
          }
        }
        void oldParent;

        page.parentElement?.insertBefore(newPage, page.nextSibling);
        return newPage;
      }
      return null;
    };

    const queue = Array.from(clone.querySelectorAll('.report-page'));
    const MAX_ITER = 500;
    let iter = 0;
    while (queue.length && iter++ < MAX_ITER) {
      const page = queue.shift();
      let next = splitOverflow(page);
      while (next && iter++ < MAX_ITER) {
        queue.push(next);
        next = splitOverflow(page);
      }
    }

    const allPages = Array.from(clone.querySelectorAll('.report-page'));
    const pages = allPages.filter((p) => {
      const text = (p.innerText || '').replace(/\s+/g, '').trim();
      const imgs = p.querySelectorAll('img').length;
      const tables = p.querySelectorAll('table').length;
      const sectionStarts = p.querySelectorAll('[data-section-start]').length;
      const rect = p.getBoundingClientRect();
      if (rect.height < 200) return false;
      if (imgs > 0 || tables > 0 || sectionStarts > 0) return true;
      return text.length > 120;
    });
    const targets = pages.length > 0 ? pages : [clone];

    const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
    const pdfW = 210;
    const pdfH = 297;

    try {
      for (let i = 0; i < targets.length; i++) {
        const canvas = await html2canvas(targets[i], {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false,
        });
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const imgH = (canvas.height * pdfW) / canvas.width;
        if (i > 0) pdf.addPage();
        if (imgH <= pdfH + 0.5) {
          pdf.addImage(imgData, 'JPEG', 0, 0, pdfW, Math.min(imgH, pdfH));
        } else {
          let heightLeft = imgH;
          let position = 0;
          pdf.addImage(imgData, 'JPEG', 0, position, pdfW, imgH);
          heightLeft -= pdfH;
          while (heightLeft > 0) {
            position -= pdfH;
            pdf.addPage();
            pdf.addImage(imgData, 'JPEG', 0, position, pdfW, imgH);
            heightLeft -= pdfH;
          }
        }
      }
    } finally {
      clone.parentElement?.removeChild(clone);
    }

    return pdf.output('blob');
  } finally {
    exportClassTargets.forEach((target) => target.classList.remove('pdf-export'));
    if (prev !== undefined && prev !== '') {
      el?.style?.setProperty('--pdf-scale', prev);
    } else {
      el?.style?.removeProperty('--pdf-scale');
    }
    window.dispatchEvent(new Event('resize'));
  }
}
