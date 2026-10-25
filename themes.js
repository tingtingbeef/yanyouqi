/*
 * 研有期 · Botanical photography theme library
 * Local transparent WebP assets; no external requests or line-art fallback.
 * Extend this configuration to add a flower without changing page components.
 */
(function () {
  'use strict';
  function colors(bg, surface, soft, ink, muted, line, accent, deep, pale, petal) {
    return {
      '--bg': bg, '--surface': surface, '--surface-soft': soft,
      '--ink': ink, '--muted': muted, '--line': line,
      '--green': accent, '--green-2': deep, '--green-pale': pale,
      '--amber': '#96763d', '--blue': '#637e96', '--red': '#ac6265',
      '--accent': accent, '--accent-soft': pale, '--petal': petal
    };
  }
  function asset(key, alt) {
    return {hero: './assets/flowers/' + key + '-hero.webp', thumb: './assets/flowers/' + key + '-thumb.webp', alt};
  }
  window.STUDY_THEMES = {
    iris: {
      name: '鸢尾', meaning: '致远', english: 'IRIS', description: '雾紫与灰蓝，留一片安静的心境。',
      quote: '愿你始终保有奔赴远方的勇气。',
      colors: colors('#f7f5f1', '#fffefd', '#f0edf4', '#34323d', '#6b6777', '#e2dce8', '#78668d', '#5f5073', '#ebe6f0', '#b6a8c7'),
      palette: ['#827095', '#7f98ad', '#a89b77', '#82947d', '#b58c96', '#8987b0', '#b39b79', '#6e8790'],
      asset: asset('iris', '自然光下的一枝紫色鸢尾，柔软花瓣舒展，细长绿叶向上生长')
    },
    sunflower: {
      name: '向日葵', meaning: '向阳', english: 'SUNFLOWER', description: '奶油黄与橄榄绿，向着光缓缓生长。',
      quote: '不必追赶太阳，你也在自己的轨道上发光。',
      colors: colors('#f8f6ef', '#fffefa', '#f4efdf', '#38382e', '#716d5b', '#e6e0ce', '#7c8553', '#626c3e', '#ebeedf', '#d4b568'),
      palette: ['#a28c4e', '#7e8e5b', '#75938e', '#b78d6e', '#9284a5', '#a0737e', '#7a8caa', '#9e9a72'],
      asset: asset('sunflower', '自然光下的一枝向日葵，金黄花瓣环绕深色花心，绿叶轻轻展开')
    },
    lily: {
      name: '百合', meaning: '见初', english: 'LILY', description: '象牙白与鼠尾草绿，简单也自有丰盛。',
      quote: '走过很远的路，也记得最初为何出发。',
      colors: colors('#f6f6f0', '#fffefa', '#edf0e8', '#333b32', '#667062', '#dde3d8', '#6e8369', '#52694f', '#e5ecdf', '#d7d4be'),
      palette: ['#71866b', '#94a08a', '#ad9c71', '#78959c', '#a98c92', '#8c83a0', '#b08e69', '#6b8586'],
      asset: asset('lily', '自然光下的一枝象牙白百合，洁净花瓣和细致花蕊映着鼠尾草绿色叶片')
    },
    lavender: {
      name: '薰衣草', meaning: '静候', english: 'LAVENDER', description: '浅紫与暖白，把呼吸还给自己。',
      quote: '有些答案，需要时间慢慢写完。',
      colors: colors('#f7f4f4', '#fffdfd', '#f0eaf3', '#3b3441', '#706675', '#e5dce9', '#8b7398', '#6f597c', '#eee5f2', '#b5a2c6'),
      palette: ['#927da3', '#8498a7', '#a393b0', '#8c9b81', '#b38e9f', '#aa9a70', '#748c98', '#b18f79'],
      asset: asset('lavender', '自然光下的数枝薰衣草，淡紫色花穗错落舒展，纤细茎叶安静相依')
    },
    wintersweet: {
      name: '腊梅', meaning: '凌寒', english: 'WINTERSWEET', description: '鹅黄与茶褐，在冬日积蓄自己的力量。',
      quote: '漫长冬日里，也有正在生长的春天。',
      colors: colors('#f7f4ee', '#fffdf8', '#f1ebe0', '#3d362f', '#766b5e', '#e7ded0', '#907a57', '#715e40', '#eee5d5', '#d6bc7c'),
      palette: ['#a18a5b', '#8d9674', '#8196a1', '#b38b7b', '#9b87a2', '#7b928b', '#b19e72', '#957c71'],
      asset: asset('wintersweet', '自然光下的一枝腊梅，清透鹅黄色花瓣点缀在自然弯曲的茶褐枝条上')
    },
    rose: {
      name: '玫瑰', meaning: '热望', english: 'ROSE', description: '豆沙粉与奶油白，认真生活也值得浪漫。',
      quote: '愿你永远有热爱的勇气，也有重新开始的自由。',
      colors: colors('#f8f4f0', '#fffdfb', '#f3e9e8', '#403436', '#78676a', '#e9dcdd', '#a3717e', '#855965', '#f2e3e7', '#cc9faa'),
      palette: ['#ad7b89', '#8e9b83', '#8a94ac', '#b69b78', '#9a84a6', '#769692', '#b38d7f', '#8c879c'],
      asset: asset('rose', '自然光下的一枝豆沙粉玫瑰，层叠花瓣轻轻绽开，墨绿叶片衬着纤细花茎')
    }
  };
  // Original geometric mark: three solid petals growing from an open book.
  window.STUDY_LOGO = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="currentColor" aria-hidden="true" focusable="false">' +
    '<path d="M24 4C15 11 16 20 24 25C32 20 33 11 24 4ZM7 12C7 23 14 29 22 28C22 19 17 13 7 12ZM41 12C31 13 26 19 26 28C34 29 41 23 41 12Z"/>' +
    '<path d="M5 29C12 28 18 30 23 34V43C18 39 12 37 5 38V29ZM43 29C36 28 30 30 25 34V43C30 39 36 37 43 38V29Z" fill-opacity=".78"/>' +
    '</svg>';
})();
