// Chart/Graph utilities
import { Colors } from '../config/colors.js';

export const ChartUtils = {
  createMiniChart(data, options = {}) {
    const {
      height = 90,
      color = Colors.pink,
      xKey = 'm',
      yKey = 'v',
    } = options;

    if (!data || data.length < 2) return null;

    const W = 300;
    const h = height;

    const values = data.map(d => d[yKey]);
    const min = Math.min(...values) - 4;
    const max = Math.max(...values) + 4;

    const px = (i) => (i / (data.length - 1)) * (W - 24) + 12;
    const py = (v) => h - ((v - min) / (max - min)) * (h - 16) - 4;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', `0 0 ${W} ${h}`);
    svg.style.width = '100%';
    svg.style.height = h + 'px';

    // Add gradient
    svg.appendChild(this.createGradient(color, h));

    // Add paths and data points
    this.addAreaAndLine(svg, data, px, py, color);
    this.addDataPoints(svg, data, px, py, xKey);

    return svg;
  },

  createGradient(color, height) {
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    const gid = `g${color.replace('#', '')}${height}`;
    gradient.id = gid;
    gradient.setAttribute('x1', '0');
    gradient.setAttribute('y1', '0');
    gradient.setAttribute('x2', '0');
    gradient.setAttribute('y2', '1');

    const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop1.setAttribute('offset', '0%');
    stop1.setAttribute('stop-color', color);
    stop1.setAttribute('stop-opacity', '0.3');

    const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop2.setAttribute('offset', '100%');
    stop2.setAttribute('stop-color', color);
    stop2.setAttribute('stop-opacity', '0.02');

    gradient.appendChild(stop1);
    gradient.appendChild(stop2);
    defs.appendChild(gradient);
    return defs;
  },

  addAreaAndLine(svg, data, px, py, color) {
    const path = data
      .map((d, i) => `${i === 0 ? 'M' : 'L'} ${px(i)} ${py(d.v)}`)
      .join(' ');

    const areaHeight = 90; // Default height for area path
    const gidColor = color.replace('#', '');

    const area = `${path} L ${px(data.length - 1)} ${areaHeight} L ${px(0)} ${areaHeight} Z`;
    const gid = `g${gidColor}${areaHeight}`;

    // Area path
    const areaPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    areaPath.setAttribute('d', area);
    areaPath.setAttribute('fill', `url(#${gid})`);
    svg.appendChild(areaPath);

    // Line path
    const linePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    linePath.setAttribute('d', path);
    linePath.setAttribute('fill', 'none');
    linePath.setAttribute('stroke', color);
    linePath.setAttribute('stroke-width', '2.5');
    linePath.setAttribute('stroke-linecap', 'round');
    linePath.setAttribute('stroke-linejoin', 'round');
    svg.appendChild(linePath);
  },

  addDataPoints(svg, data, px, py, xKey) {
    data.forEach((d, i) => {
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');

      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', px(i));
      circle.setAttribute('cy', py(d.v));
      circle.setAttribute('r', i === data.length - 1 ? 5 : 3);
      circle.setAttribute('fill', Colors.pink);
      circle.setAttribute('opacity', i === data.length - 1 ? 1 : 0.5);
      g.appendChild(circle);

      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', px(i));
      text.setAttribute('y', 90);
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('fill', Colors.muted);
      text.setAttribute('font-size', '9');
      text.textContent = d[xKey];
      g.appendChild(text);

      svg.appendChild(g);
    });
  },

  // Calculate XP level
  getLevel(xp, levels) {
    return levels.slice().reverse().find(l => xp >= l.minXp) || levels[0];
  },

  // Calculate progress to next level
  getLevelProgress(xp, levels) {
    const currentLevel = this.getLevel(xp, levels);
    const nextLevel = levels.find(l => l.number === currentLevel.number + 1);

    if (!nextLevel) return 100;

    const progress = ((xp - currentLevel.minXp) / (nextLevel.minXp - currentLevel.minXp)) * 100;
    return Math.min(100, progress);
  },

  // Get XP needed for next level
  getXpToNextLevel(xp, levels) {
    const currentLevel = this.getLevel(xp, levels);
    const nextLevel = levels.find(l => l.number === currentLevel.number + 1);

    if (!nextLevel) return null;

    return {
      current: xp,
      next: nextLevel.minXp,
      needed: nextLevel.minXp - xp,
    };
  },
};

export default ChartUtils;
